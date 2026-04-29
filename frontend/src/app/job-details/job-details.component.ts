import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpService } from '../services/http.service';
import { Job } from '../models/job.model';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ToastService } from '../services/toast.service';
import { Subject, takeUntil } from 'rxjs';

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

  fetchJobDetails(slug: string): void {
    this.loading = true;
    this.error = '';
    this.httpService.getJobBySlug(slug).subscribe({
      next: (job) => {
        const normalizedJob = this.normalizeJob(job);
        this.job = normalizedJob;
        this.renderedDescription = this.sanitizer.bypassSecurityTrustHtml(normalizedJob.description || '');
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching job:', err);
        this.error = 'Job not found or failed to load.';
        this.loading = false;
      }
    });
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

  private normalizeJob(rawJob: unknown): Job {
    const candidate = this.unwrapJob(rawJob);

    return {
      id: this.toNumber(candidate.id) ?? 0,
      title: this.readText(candidate.title) || 'Untitled Role',
      description: this.readDescription(candidate),
      location: this.readText(candidate.location) || 'Remote',
      jobType: this.readText(candidate.jobType ?? candidate.job_type),
      workType: this.readText(candidate.workType ?? candidate.work_type),
      experienceRequired: this.toNumber(candidate.experienceRequired ?? candidate.experience_required) ?? undefined,
      requiredSkills: this.readText(candidate.requiredSkills ?? candidate.required_skills),
      educationRequired: this.readText(candidate.educationRequired ?? candidate.education_required),
      salaryMin: this.toNumber(candidate.salaryMin ?? candidate.salary_min) ?? undefined,
      salaryMax: this.toNumber(candidate.salaryMax ?? candidate.salary_max) ?? undefined,
      salaryCurrency: this.readText(candidate.salaryCurrency ?? candidate.salary_currency) || undefined,
      isActive: this.readBoolean(candidate.isActive ?? candidate.is_active),
      applicationLink: this.readText(candidate.applicationLink ?? candidate.application_link),
      companyName: this.readText(candidate.companyName ?? candidate.company_name),
      howToApply: this.readText(candidate.howToApply ?? candidate.how_to_apply),
      slug: this.readText(candidate.slug) || '',
      postedBy: candidate.postedBy
        ? {
            id: this.toNumber(candidate.postedBy.id) ?? 0,
            username: this.readText(candidate.postedBy.username) || '',
            companyName: this.readText(candidate.postedBy.companyName ?? candidate.postedBy.company_name)
          }
        : undefined,
      createdAt: this.readText(candidate.createdAt ?? candidate.created_at),
      updatedAt: this.readText(candidate.updatedAt ?? candidate.updated_at)
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
      if (Array.isArray(candidate.data)) {
        return (candidate.data[0] ?? {}) as Record<string, unknown>;
      }
      if (candidate.job && typeof candidate.job === 'object') {
        return candidate.job as Record<string, unknown>;
      }
      return candidate;
    }

    return {};
  }

  private readDescription(candidate: Record<string, unknown>): string {
    const descriptionValue = candidate.description ?? candidate['description_html'] ?? candidate['descriptionHtml'];

    if (typeof descriptionValue === 'string') {
      const trimmed = descriptionValue.trim();
      if (!trimmed) {
        return '';
      }

      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          const unwrapped = this.unwrapJob(parsed);
          return this.readText(unwrapped.description) || this.readText(unwrapped.description_html) || descriptionValue;
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
