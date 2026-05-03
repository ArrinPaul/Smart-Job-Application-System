import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpService } from '../services/http.service';
import { Job } from '../models/job.model';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { sanitizeHtml } from '../lib/safe-dompurify';
import { ToastService } from '../services/toast.service';
import { TranslationService } from '../services/translation.service';
import { Subject, takeUntil, finalize } from 'rxjs';
import { switchMap } from 'rxjs/operators';

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
    private translationService: TranslationService,
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
        switchMap(job => this.translationService.translateJob(job)),
        finalize(() => { this.loading = false; })
      )
      .subscribe({
        next: (job) => {
          if (!job) {
            this.error = 'Job not found or failed to load.';
            return;
          }

          this.job = job;
          const desc = (job.description || '').toString();
          if (desc && desc.trim()) {
            this.renderedDescription = this.sanitizeAndConvert(desc);
          } else {
            this.renderedDescription = this.sanitizer.bypassSecurityTrustHtml(
              '<p>Review the responsibilities, requirements, and application steps below.</p>'
            );
          }
        },
        error: (err) => {
          console.error('Error fetching job:', err);
          this.error = 'Job not found or failed to load.';
        }
      });
  }

  isGlobalRecruiter(): boolean {
    return this.job?.postedBy?.username === 'global.recruiter';
  }

  isJobSeeker(): boolean {
    return this.authService.isJobSeeker();
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  getInternalApplyLabel(): string {
    if (!this.authService.isLoggedIn()) {
      return 'Login to Apply';
    }

    if (!this.isJobSeeker()) {
      return 'Apply (Job seekers only)';
    }

    return this.isGlobalRecruiter() ? 'Apply Now' : 'Preview & Apply';
  }

  canApplyInternally(): boolean {
    if (!this.isJobSeeker()) return false;
    return !this.isGlobalRecruiter() || !this.job?.applicationLink;
  }

  applyInternally(): void {
    if (!this.authService.isLoggedIn()) {
      this.toastService.showWarning('Please login to apply for this job.');
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    if (!this.isJobSeeker()) {
      this.toastService.showWarning('Only job seeker accounts can apply for jobs.');
      return;
    }

    if (!this.job) return;

    if (!this.isGlobalRecruiter()) {
      this.router.navigate(['/jobs', this.job.slug, 'apply']);
    } else {
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
    return postedAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  getDescriptionPreview(): string {
    const description = (this.job?.description || '').toString().trim();
    if (!description) {
      return 'Review the responsibilities, requirements, and application steps below.';
    }

    const compact = description.replace(/\s+/g, ' ');
    return compact.length > 220 ? `${compact.slice(0, 217).trimEnd()}...` : compact;
  }

  getSalaryLabel(): string {
    const { salaryMin, salaryMax, salaryCurrency = '$' } = this.job || {};

    if (salaryMin != null && salaryMax != null) {
      return `${salaryCurrency}${Number(salaryMin).toLocaleString()} - ${salaryCurrency}${Number(salaryMax).toLocaleString()}`;
    }
    if (salaryMin != null) {
      return `From ${salaryCurrency}${Number(salaryMin).toLocaleString()}`;
    }
    if (salaryMax != null) {
      return `Up to ${salaryCurrency}${Number(salaryMax).toLocaleString()}`;
    }
    return 'Competitive';
  }

  private sanitizeAndConvert(md: string): SafeHtml {
    const fixed = this.fixEncoding(md || '');
    const looksLikeHtml = fixed.trim().startsWith('<');

    try {
      const html = looksLikeHtml
        ? fixed
        : marked.parse(fixed, { async: false, breaks: true });
      const clean = sanitizeHtml(String(html));
      return this.sanitizer.bypassSecurityTrustHtml(clean);
    } catch {
      const escaped = fixed.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

  getRequirementsList(): string[] {
    const { educationRequired, experienceRequired, requiredSkills } = this.job || {};
    const requirements: string[] = [];

    if (educationRequired) {
      requirements.push(educationRequired);
    }
    if (experienceRequired != null) {
      requirements.push(`${experienceRequired} years of experience`);
    }
    if (requiredSkills) {
      requirements.push(...requiredSkills.split(',').map(s => s.trim()).filter(Boolean));
    }
    return Array.from(new Set(requirements));
  }

  getReferenceLinks(): Array<{ label: string; href: string }> {
    if (this.job?.applicationLink) {
      return [{ label: 'Application Portal', href: this.job.applicationLink }];
    }
    return [];
  }

  fetchInsights(): void {
    if (!this.job) return;

    if (this.selectedInsights) {
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
          if (err?.status === 401) {
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
