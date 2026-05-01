import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpService } from '../services/http.service';
import { Job } from '../models/job.model';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { sanitizeHtml } from '../lib/safe-dompurify';
import { ToastService } from '../services/toast.service';
import { Subject, takeUntil, finalize } from 'rxjs';

import { JobMatchInsights } from '../models/recommendation.model';
import { ChatService } from '../services/chat.service';
import { AuthService } from '../services/auth.service';

import { HttpErrorResponse } from '@angular/common/http';

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
    private authService: AuthService,
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
    if (!this.authService.isLoggedIn()) {
      this.toastService.showWarning('Please login to chat with our AI assistant.');
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    if (this.job) {
      this.chatService.setJobContext(this.job);
    }
  }

  contactRecruiter(): void {
    if (!this.authService.isLoggedIn()) {
      this.toastService.showWarning('Please login to message the recruiter.');
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    if (this.job?.postedBy?.id) {
      this.router.navigate(['/messages'], { 
        queryParams: { 
          userId: this.job.postedBy.id,
          jobId: this.job.id
        } 
      });
    } else {
      this.toastService.showInfo('Recruiter information not available for direct messaging.');
    }
  }

  fetchJobDetails(slug: string): void {
    this.loading = true;
    this.error = '';
    this.httpService.getJobBySlug(slug)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.loading = false; })
      )
      .subscribe({
        next: (job) => {
          const normalizedJob = this.normalizeJob(job);
          this.job = normalizedJob;
          // Convert markdown -> HTML, sanitize, and bind. If no description, show preview fallback.
          const desc = (normalizedJob.description || '').toString();
          if (desc && desc.trim()) {
            this.renderedDescription = this.sanitizeAndConvert(desc);
          } else {
            this.renderedDescription = this.sanitizer.bypassSecurityTrustHtml(this.getDescriptionPreview());
          }
        },
        error: (err) => {
          console.error('Error fetching job:', err);
          this.error = 'Job not found or failed to load.';
        }
      });
  }

  applyInternally(): void {
    if (this.job) {
        this.httpService.applyJob(this.job.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
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
    const salaryMin = this.toNumber(this.job?.salaryMin);
    const salaryMax = this.toNumber(this.job?.salaryMax);

    if (salaryMin != null && salaryMax != null) {
      const currency = this.job?.salaryCurrency || '$';
      return `${currency}${salaryMin.toLocaleString()} - ${currency}${salaryMax.toLocaleString()}`;
    }

    if (salaryMin != null) {
      const currency = this.job?.salaryCurrency || '$';
      return `From ${currency}${salaryMin.toLocaleString()}`;
    }

    if (salaryMax != null) {
      const currency = this.job?.salaryCurrency || '$';
      return `Up to ${currency}${salaryMax.toLocaleString()}`;
    }

    return 'Competitive';
  }

  private sanitizeAndConvert(md: string): SafeHtml {
    let fixed = this.fixEncoding(md || '');
    fixed = this.normalizeMarkdown(fixed);

    // If the text contains HTML-escaped entities like &lt;p&gt;..., decode them first
    if (fixed.includes('&lt;') || fixed.includes('&gt;')) {
      try {
        const doc = new DOMParser().parseFromString(fixed, 'text/html');
        const decoded = doc.documentElement.textContent || fixed;
        fixed = decoded;
      } catch {
        // fallback to original
      }
    }

    // If the fixed text already looks like HTML, don't run it through the markdown parser
    const looksLikeHtml = fixed.trim().startsWith('<');

    try {
      const html = looksLikeHtml ? fixed : marked.parse(fixed || '', { async: false });
      const clean = sanitizeHtml(String(html));
      return this.sanitizer.bypassSecurityTrustHtml(clean);
    } catch {
      const escaped = fixed
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return this.sanitizer.bypassSecurityTrustHtml(`<p>${escaped}</p>`);
    }
  }

  private fixEncoding(input: string): string {
    if (!input) return input;
    return input
      .replace(/\u00e2\u0080\u0094|â€”|â\u0000\u000a|â\u000a/g, '—')
      .replace(/\u00e2\u0080\u0093|â€“/g, '–')
      .replace(/\u00e2\u0080\u0099|\u00e2\u0080\u0098|â€™|â€˜/g, "'")
      .replace(/\u00e2\u0080\u009c|\u00e2\u0080\u009d|â€œ|â€\\"/g, '"')
      .replace(/\u00e2\u0080\u00a6/g, '...')
      .replace(/\u00c3\u00a9|Ã©/g, 'é')
      .replace(/\u00c3\u00b1|Ã±/g, 'ñ')
      .replace(/\u00c2|Â/g, '')
      .replace(/\r\n/g, '\n')
      .trim();
  }

  private normalizeMarkdown(input: string): string {
    if (!input) return input;

    let out = input
      .replace(/\r\n/g, '\n')
      .replace(/\\n/g, '\n');

    // Remove bold markers around labels and split labels into their own lines.
    out = out.replace(/\*\*(Position|Location|Employment Type|Description|The Role|Key Skills|Responsibilities)\*\*:/gi, '$1:');

    out = out
      .replace(/([^\n])\s*(#{1,6})\s+/g, '$1\n\n$2 ')
      .replace(/(##\s+[^\n]*?)\s+(We|Our|You|This|They|The)\b/g, '$1\n\n$2')
      .replace(/(##\s+[^\n]*?)\s+(Position|Location|Employment Type):/gi, '$1\n\n$2:')
      .replace(/([^\n])\s+(Position|Location|Employment Type):/gi, '$1\n$2:')
      .replace(/([^\n])\s*(Description|The Role|Key Skills|Responsibilities):/gi, '$1\n$2:')
      .replace(/(^|\n)\s*•\s+/g, '$1- ')
      .replace(/\s+•\s+/g, '\n- ')
      .replace(/([\S])\s+-\s+/g, '$1\n- ')
      .replace(/\n{3,}/g, '\n\n');

    // Convert key fields into bullet points.
    out = out.replace(/^(Position|Location|Employment Type):/gmi, '- $1:');

    const lines = out.split('\n');
    const seenHeadings = new Set<string>();
    const cleaned: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        cleaned.push('');
        continue;
      }

      const headingMatch = trimmed.match(/^#{1,6}\s+(.*)$/);
      if (headingMatch) {
        const headingText = headingMatch[1].trim();
        const headingKey = headingText.toLowerCase();

        // Drop the previous plain line if it duplicates this heading.
        for (let idx = cleaned.length - 1; idx >= 0; idx -= 1) {
          const previous = cleaned[idx].trim();
          if (!previous) continue;
          if (previous.toLowerCase() === headingKey) {
            cleaned.splice(idx, 1);
          }
          break;
        }

        if (seenHeadings.has(headingKey)) {
          continue;
        }

        seenHeadings.add(headingKey);
      }

      cleaned.push(line);
    }

    return cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  private normalizeJob(rawJob: unknown): Job {
    const candidate = this.unwrapJob(rawJob);
    const postedBy = this.asRecord(candidate['postedBy']);

    return {
      id: this.toNumber(candidate['id']) ?? 0,
      title: this.readText(candidate['title']) || 'Untitled Role',
      description: this.readDescription(candidate),
      location: this.readText(candidate['location']) || 'Remote',
      jobType: this.readText(candidate['jobType'] ?? candidate['job_type']),
      workType: this.readText(candidate['workType'] ?? candidate['work_type']),
      experienceRequired: this.toNumber(candidate['experienceRequired'] ?? candidate['experience_required']) ?? undefined,
      requiredSkills: this.readText(candidate['requiredSkills'] ?? candidate['required_skills']),
      educationRequired: this.readText(candidate['educationRequired'] ?? candidate['education_required']),
      salaryMin: this.toNumber(candidate['salaryMin'] ?? candidate['salary_min']) ?? undefined,
      salaryMax: this.toNumber(candidate['salaryMax'] ?? candidate['salary_max']) ?? undefined,
      salaryCurrency: this.readText(candidate['salaryCurrency'] ?? candidate['salary_currency']) || undefined,
      isActive: this.readBoolean(candidate['isActive'] ?? candidate['is_active']),
      applicationLink: this.readText(candidate['applicationLink'] ?? candidate['application_link']),
      companyName: this.readText(candidate['companyName'] ?? candidate['company_name']),
      howToApply: this.readText(candidate['howToApply'] ?? candidate['how_to_apply']),
      slug: this.readText(candidate['slug']) || '',
      postedBy: postedBy
        ? {
            id: this.toNumber(postedBy['id']) ?? 0,
            username: this.readText(postedBy['username']) || '',
            companyName: this.readText(postedBy['companyName'] ?? postedBy['company_name'])
          }
        : undefined,
      createdAt: this.readText(candidate['createdAt'] ?? candidate['created_at']),
      updatedAt: this.readText(candidate['updatedAt'] ?? candidate['updated_at'])
    };
  }

  private unwrapJob(rawJob: unknown): Record<string, unknown> {
    if (Array.isArray(rawJob)) {
      return (rawJob[0] ?? {}) as Record<string, unknown>;
    }

    if (typeof rawJob === 'string') {
      try {
        const parsed = JSON.parse(rawJob);
        return this.unwrapJob(parsed);
      } catch {
        return { description: rawJob };
      }
    }

    if (rawJob && typeof rawJob === 'object') {
      const candidate = rawJob as Record<string, unknown>;
      if (Array.isArray(candidate['data'])) {
        return (candidate['data'][0] ?? {}) as Record<string, unknown>;
      }
      if (candidate['job'] && typeof candidate['job'] === 'object') {
        return candidate['job'] as Record<string, unknown>;
      }
      return candidate;
    }

    return {};
  }

  private readDescription(candidate: Record<string, unknown>): string {
    const descriptionValue = candidate['description'] ?? candidate['description_html'] ?? candidate['descriptionHtml'];

    if (typeof descriptionValue === 'string') {
      const trimmed = descriptionValue.trim();
      if (!trimmed) {
        return '';
      }

      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          const unwrapped = this.unwrapJob(parsed);
          return this.readText(unwrapped['description']) || this.readText(unwrapped['description_html']) || descriptionValue;
        } catch {
          return descriptionValue;
        }
      }

      return descriptionValue;
    }

    return this.readText(descriptionValue);
  }

  private readText(value: unknown): string {
    if (typeof value === 'string') {
      return value.trim();
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    return '';
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private readBoolean(value: unknown): boolean | undefined {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
    }

    return undefined;
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return null;
  }

  getDescriptionPreview(): string {
    const raw = this.fixEncoding(this.job?.description || '');
    const normalized = this.normalizeMarkdown(raw);
    const plainText = normalized
      // strip HTML tags first (if description is already HTML)
      .replace(/<[^>]+>/g, ' ')
      // basic markdown-to-text cleanup (for summaries)
      .replace(/^#+\s+/gm, ' ')
      .replace(/\n#+\s+/g, ' ')
      .replace(/#/g, '')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/[\*_]{1,3}/g, '')
      .replace(/`{1,3}/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const deduped = this.removeLeadingDupes(plainText);

    if (!deduped) {
      return 'Review the responsibilities, requirements, and application steps below.';
    }

    return deduped;
  }

  private removeLeadingDupes(input: string): string {
    return input.replace(/^(\b\w+(?:\s+\w+){1,6})\s+\1(\s+\1)*/i, '$1');
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
    this.httpService.getJobMatchInsights(this.job.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.insightLoading = false; })
      )
      .subscribe({
        next: (response) => {
          this.selectedInsights = response;
          if (response.error) {
            this.toastService.showWarning(response.error);
          }
        },
        error: (err: HttpErrorResponse) => {
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
