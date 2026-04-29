import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpService } from '../services/http.service';
import { Job } from '../models/job.model';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-job-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './job-details.component.html',
  styleUrls: ['./job-details.component.css']
})
export class JobDetailsComponent implements OnInit {
  job: Job | null = null;
  renderedDescription: SafeHtml = '';
  loading = true;
  error = '';
  selectedInsights: any = null;
  insightLoading = false;

  constructor(
    private route: ActivatedRoute,
    private httpService: HttpService,
    private sanitizer: DomSanitizer,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      if (slug) {
        this.fetchJobDetails(slug);
      }
    });
  }

  fetchJobDetails(slug: string): void {
    this.selectedInsights = null; // Clear previous

    this.insightLoading = true;
    this.httpService.getJobMatchInsights(this.job.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.selectedInsights = response;
          this.insightLoading = false;
          if (response.error) {
            this.toastService.showWarning(response.error);
          }
        },
        error: (err: any) => {
          this.insightLoading = false;
          // If unauthorized, prompt login and redirect
          if (err && err.status === 401) {
            this.toastService.showWarning('Please login to view match insights.');
            this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
            return;
          }
          this.toastService.showError('Unable to fetch job insights.');
          this.insightJobId = null;
        }
      });
   * Structured markdown-lite renderer for scraped descriptions.
   * Supports headings, bullet lists, bold/italic, links, and clean paragraphs.
   */
  private parseMarkdown(text: string): SafeHtml {
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

    const html = output.join('');
    return this.sanitizer.bypassSecurityTrustHtml(html);
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
      error: () => {
        this.toastService.showError('Unable to fetch job insights.');
        this.insightLoading = false;
      }
    });
  }

  getMatchColor(percent: number): string {
    if (percent >= 80) return '#10b981';
    if (percent >= 50) return '#f59e0b';
    return '#ef4444';
  }
}
