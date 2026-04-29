import { Component, OnInit, OnDestroy, SecurityContext } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpService } from '../services/http.service';
import { Job } from '../models/job.model';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ToastService } from '../services/toast.service';
import { Subject, takeUntil } from 'rxjs';

import { JobMatchInsights } from '../models/recommendation.model';
import { ChatService } from '../services/chat.service';

import { HttpErrorResponse } from '@angular/common/http';

interface DescriptionSection {
  title: string;
  html: SafeHtml;
  kind: 'role' | 'company' | 'other';
}

@Component({
  selector: 'app-job-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './job-details.component.html',
  styleUrls: ['./job-details.component.css']
})
export class JobDetailsComponent implements OnInit, OnDestroy {
  job: Job | null = null;
  renderedDescription: SafeHtml = '';
  roleSections: DescriptionSection[] = [];
  companySection: DescriptionSection | null = null;
  loading = true;
  error = '';
  selectedInsights: JobMatchInsights | null = null;
  insightLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private httpService: HttpService,
    private sanitizer: DomSanitizer,
    private toastService: ToastService,
    private chatService: ChatService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const slug = params['slug'];
      if (slug) {
        this.fetchJobDetails(slug);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  chatWithAI(): void {
    if (this.job) {
      this.chatService.setJobContext(this.job);
    }
  }

  fetchJobDetails(slug: string): void {
    this.loading = true;
    this.error = '';
    this.httpService.getJobBySlug(slug).subscribe({
      next: (job) => {
        this.job = job;
        const sections = this.extractDescriptionSections(job.description);
        this.roleSections = sections.filter((section) => section.kind !== 'company');
        this.companySection = sections.find((section) => section.kind === 'company') ?? null;
        this.renderedDescription = this.parseJobDescription(job.description);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching job:', err);
        this.error = 'Job not found or failed to load.';
        this.loading = false;
      }
    });
  }

  /**
   * Structured markdown-lite renderer for scraped descriptions.
   * Supports headings, bullet lists, bold/italic, links, and clean paragraphs.
   */
  private parseJobDescription(text: string): SafeHtml {
    if (!text) return '';

    const normalized = this.decodeHtmlEntities(text).trim();
    const html = this.renderRichText(normalized);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private extractDescriptionSections(text: string): DescriptionSection[] {
    if (!text) {
      return [];
    }

    const normalized = this.decodeHtmlEntities(text).trim();
    const html = this.renderRichText(normalized);

    if (!html) {
      return [];
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
    const container = doc.body.firstElementChild as HTMLElement | null;

    if (!container) {
      return [];
    }

    const sections: Array<{ title: string; content: string; kind: 'role' | 'company' | 'other' }> = [];
    let currentTitle = 'Details';
    let currentKind: 'role' | 'company' | 'other' = 'other';
    let currentContent: string[] = [];

    const pushSection = () => {
      const content = currentContent.join('').trim();
      if (!content) {
        return;
      }

      sections.push({
        title: currentTitle,
        content,
        kind: currentKind
      });
      currentContent = [];
    };

    const isHeading = (node: Element): boolean => /^H[1-6]$/.test(node.tagName);

    const classifySection = (title: string): 'role' | 'company' | 'other' => {
      const value = title.toLowerCase();

      if (/(about the company|about us|company|why us|why join|our company|über uns|warum zu uns|employer|team)/i.test(value)) {
        return 'company';
      }

      if (/(about the role|role|responsibilit|what you do|what you'll do|deine aufgaben|dein aufgaben|deine stärken|requirements|qualifications|what you'll bring|your profile|your skills|stärken)/i.test(value)) {
        return 'role';
      }

      return 'other';
    };

    const pushNode = (node: ChildNode) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textContent = node.textContent?.trim();
        if (textContent) {
          currentContent.push(`<p>${this.escapeHtml(textContent)}</p>`);
        }
        return;
      }

      const element = node as Element;
      if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
        return;
      }

      currentContent.push(element.outerHTML);
    };

    for (const node of Array.from(container.childNodes)) {
      if (node.nodeType === Node.ELEMENT_NODE && isHeading(node as Element)) {
        pushSection();
        currentTitle = (node.textContent || 'Details').trim();
        currentKind = classifySection(currentTitle);
        continue;
      }

      pushNode(node);
    }

    pushSection();

    if (!sections.length) {
      return [];
    }

    return sections.map((section) => ({
      title: section.title,
      kind: section.kind,
      html: this.sanitizer.bypassSecurityTrustHtml(section.content)
    }));
  }

  private renderRichText(text: string): string {
    if (this.looksLikeHtml(text)) {
      const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, text) ?? '';
      return sanitized;
    }

    return this.parseMarkdown(text);
  }

  private looksLikeHtml(text: string): boolean {
    return /<\/?(p|div|span|br|ul|ol|li|strong|em|b|i|h[1-6]|a|section|article|table|thead|tbody|tr|td|th)\b/i.test(text);
  }

  private parseMarkdown(text: string): string {
    if (!text) return '';

    const lines = text.replace(/\r\n/g, '\n').split('\n');
    const output: string[] = [];
    let inList = false;

    const closeList = () => {
      if (inList) {
        output.push('</ul>');
        inList = false;
      }
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (!line) {
        closeList();
        continue;
      }

      if (line.startsWith('### ')) {
        closeList();
        output.push(`<h3 class="md-h3">${this.formatInline(line.slice(4))}</h3>`);
        continue;
      }

      if (line.startsWith('## ')) {
        closeList();
        output.push(`<h2 class="md-h2">${this.formatInline(line.slice(3))}</h2>`);
        continue;
      }

      if (/^[•*-]\s+/.test(line)) {
        if (!inList) {
          output.push('<ul class="md-ul">');
          inList = true;
        }
        output.push(`<li class="md-li">${this.formatInline(line.replace(/^[•*-]\s+/, ''))}</li>`);
        continue;
      }

      closeList();
      output.push(`<p>${this.formatInline(line)}</p>`);
    }

    closeList();

    return output.join('');
  }

  private decodeHtmlEntities(text: string): string {
    if (!text) return '';

    const decoder = document.createElement('textarea');
    decoder.innerHTML = text;
    return decoder.value;
  }

  private formatInline(value: string): string {
    const linkPlaceholders: string[] = [];

    const withLinkPlaceholders = value.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
      const safeText = this.escapeHtml(String(text).trim());
      const safeUrl = this.normalizeLink(String(url).trim());
      const html = safeUrl
        ? `<a class="md-link" href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeText}</a>`
        : safeText;
      const token = `__MD_LINK_${linkPlaceholders.length}__`;
      linkPlaceholders.push(html);
      return token;
    });

    let out = this.escapeHtml(withLinkPlaceholders)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');

    linkPlaceholders.forEach((linkHtml, idx) => {
      out = out.replace(`__MD_LINK_${idx}__`, linkHtml);
    });

    return out;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private normalizeLink(url: string): string {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.toString();
      }
      return '';
    } catch {
      return '';
    }
  }

  applyInternally(): void {
    if (this.job) {
        this.httpService.applyJob(this.job.id).subscribe({
            next: () => this.toastService.showSuccess('Applied successfully!'),
            error: () => this.toastService.showError('Failed to apply')
        });
    }
  }

  shareJob(): void {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      this.toastService.showSuccess('Link copied to clipboard!');
    });
  }

  getCompanyName(): string {
    return this.job?.companyName || this.job?.postedBy?.companyName || this.job?.postedBy?.username || 'Hiring Company';
  }

  getCategoryLabel(): string {
    return this.job?.jobType || this.job?.workType || 'Open Role';
  }

  getWorkModeLabel(): string {
    return this.job?.workType || this.job?.jobType || 'Flexible';
  }

  getPostedLabel(): string {
    if (!this.job?.createdAt) {
      return 'Recently posted';
    }

    const postedAt = new Date(this.job.createdAt);
    if (Number.isNaN(postedAt.getTime())) {
      return this.job.createdAt;
    }

    return postedAt.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getSalaryLabel(): string {
    if (this.job?.salaryMin !== undefined && this.job?.salaryMax !== undefined) {
      const currency = this.job.salaryCurrency || '$';
      return `${currency}${this.job.salaryMin.toLocaleString()} - ${currency}${this.job.salaryMax.toLocaleString()}`;
    }

    if (this.job?.salaryMin !== undefined) {
      const currency = this.job.salaryCurrency || '$';
      return `From ${currency}${this.job.salaryMin.toLocaleString()}`;
    }

    if (this.job?.salaryMax !== undefined) {
      const currency = this.job.salaryCurrency || '$';
      return `Up to ${currency}${this.job.salaryMax.toLocaleString()}`;
    }

    return 'Competitive';
  }

  getDescriptionPreview(): string {
    const raw = this.job?.description || '';
    const plainText = raw
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!plainText) {
      return 'Review the responsibilities, requirements, and application steps below.';
    }

    return plainText.length > 210 ? `${plainText.slice(0, 207)}...` : plainText;
  }

  getRequirementsList(): string[] {
    const requirements: string[] = [];

    if (this.job?.educationRequired) {
      requirements.push(this.job.educationRequired);
    }

    if (this.job?.experienceRequired !== undefined && this.job?.experienceRequired !== null) {
      requirements.push(`${this.job.experienceRequired} years of experience`);
    }

    if (this.job?.requiredSkills) {
      requirements.push(
        ...this.job.requiredSkills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean)
      );
    }

    return Array.from(new Set(requirements));
  }

  getReferenceLinks(): Array<{ label: string; href: string }> {
    const links: Array<{ label: string; href: string }> = [];

    if (this.job?.applicationLink) {
      links.push({
        label: 'Application Portal',
        href: this.job.applicationLink
      });
    }

    return links;
  }

  fetchInsights(): void {
    if (!this.job) return;

    if (this.selectedInsights) {
      // toggle off
      this.selectedInsights = null;
      return;
    }

    this.insightLoading = true;
    this.httpService.getJobMatchInsights(this.job.id).subscribe({
      next: (response) => {
        this.selectedInsights = response;
        this.insightLoading = false;
        if (response.error) {
          this.toastService.showWarning(response.error);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.insightLoading = false;
        if (err && err.status === 401) {
          this.toastService.showWarning('Please login to view match insights.');
          this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
          return;
        }
        this.toastService.showError('Unable to fetch job insights.');
      }
    });
  }

  getMatchColor(percent: number): string {
    if (percent >= 80) return '#10b981';
    if (percent >= 50) return '#f59e0b';
    return '#ef4444';
  }
}
