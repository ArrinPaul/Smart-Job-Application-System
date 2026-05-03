import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpService } from '../services/http.service';
import { Application, ApplicationStatus } from '../models/job.model';
import { Subject, takeUntil, finalize, interval, switchMap, of, startWith, Subscription } from 'rxjs';

@Component({
  selector: 'app-application-preview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './application-preview.component.html',
  styleUrls: ['./application-preview.component.css']
})
export class ApplicationPreviewComponent implements OnInit, OnDestroy {
  private httpService = inject(HttpService);
  private route = inject(ActivatedRoute);

  application: Application | null = null;
  job: any | null = null;
  loading = true;
  submitting = false;
  error = '';

  ApplicationStatus = ApplicationStatus;
  statusFlow = [
    ApplicationStatus.APPLIED,
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.PHONE_SCREEN,
    ApplicationStatus.TECHNICAL_INTERVIEW,
    ApplicationStatus.ON_SITE_INTERVIEW,
    ApplicationStatus.OFFER_EXTENDED,
    ApplicationStatus.HIRED
  ];

  private destroy$ = new Subject<void>();
  private pollingSub?: Subscription;

  ngOnInit(): void {
    const identifier = this.route.snapshot.params['slug']; 
    if (identifier) {
      this.startPolling(identifier);
    }
  }

  ngOnDestroy(): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  startPolling(identifier: string): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }

    const isNumericId = !isNaN(Number(identifier));
    const numericId = isNumericId ? Number(identifier) : null;

    // Poll every 5 seconds for status updates while the page is open
    this.pollingSub = interval(5000)
      .pipe(
        startWith(0),
        switchMap(() => {
          if (document.visibilityState === 'visible') {
            return this.httpService.getMyApplications();
          }
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (apps) => {
          let found;
          if (isNumericId) {
            found = apps.find(a => a.id === numericId);
          } else {
            // Find by job slug
            found = apps.find(a => a.job.slug === identifier);
          }

          if (found) {
            // Only update if status or details changed to avoid flicker
            if (!this.application || 
                JSON.stringify(this.application) !== JSON.stringify(found)) {
              this.application = found;
            }
            this.loading = false;
            this.error = '';
          } else if (this.loading) {
            if (!isNumericId) {
              // If not applied yet, we need to load job details to show the apply button
              this.fetchJobDetails(identifier);
            } else {
              this.error = 'Application record not found.';
              this.loading = false;
            }
          }
        },
        error: () => {
          if (this.loading) {
            this.error = 'Failed to load application status.';
            this.loading = false;
          }
        }
      });
  }

  fetchJobDetails(slug: string): void {
    this.httpService.getJobBySlug(slug)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (job) => {
          this.job = job;
          this.error = 'You haven\'t applied for this position yet.';
          this.loading = false;
        },
        error: () => {
          this.error = 'Job not found.';
          this.loading = false;
        }
      });
  }

  applyNow(): void {
    if (!this.job || this.submitting) return;

    this.submitting = true;
    this.httpService.applyJob(this.job.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.submitting = false)
      )
      .subscribe({
        next: () => {
          this.loading = true; // Restart polling loop
          this.startPolling(this.job.slug);
        },
        error: () => {
          this.error = 'Failed to submit application. Please try again.';
        }
      });
  }

  getStepStatus(stage: ApplicationStatus): string {
    if (!this.application) return '';
    
    const currentStatus = this.application.status.toUpperCase() as ApplicationStatus;
    
    // Terminal states handling
    if (currentStatus === ApplicationStatus.REJECTED) {
      return stage === ApplicationStatus.APPLIED ? 'completed' : 'rejected';
    }
    if (currentStatus === ApplicationStatus.HOLD) {
      return stage === ApplicationStatus.APPLIED ? 'completed' : 'hold';
    }

    const currentIdx = this.statusFlow.indexOf(currentStatus);
    const targetIdx = this.statusFlow.indexOf(stage);

    if (currentIdx === targetIdx) return 'active';
    if (targetIdx < currentIdx) return 'completed';
    return '';
  }

  isUrl(str: string): boolean {
    return str.startsWith('http') || str.includes('zoom.us') || str.includes('teams.microsoft');
  }

  downloadResume(): void {
    if (!this.application?.resume?.id) return;
    this.httpService.downloadResume(this.application.resume.id)
      .subscribe(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Application_CV.pdf`;
        a.click();
      });
  }
}
