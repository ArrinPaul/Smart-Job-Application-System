import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpService } from '../services/http.service';
import { ToastService } from '../services/toast.service';
import { Application, ApplicationStatus } from '../models/job.model';
import { Subject, takeUntil, finalize, interval, switchMap, startWith, of, Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-applicant-review',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './applicant-review.component.html',
  styleUrls: ['./applicant-review.component.css']
})
export class ApplicantReviewComponent implements OnInit, OnDestroy {
  application: Application | null = null;
  loading = true;
  error = '';
  private destroy$ = new Subject<void>();
  private pollingSub?: Subscription;

  // For the details form
  detailsRequest: any = {
    internalNotes: '',
    interviewDate: '',
    interviewLocation: '',
    recruiterFeedback: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private httpService: HttpService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const rawId = params['id'];
      const id = Number(rawId);
      
      if (rawId && !isNaN(id)) {
        this.startPolling(id);
      } else if (rawId) {
        this.error = 'Invalid application ID provided.';
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  startPolling(id: number): void {
    if (isNaN(id)) return;
    
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }

    // Poll every 5 seconds for updates
    this.pollingSub = interval(5000)
      .pipe(
        startWith(0),
        switchMap(() => {
          if (document.visibilityState === 'visible') {
            return this.httpService.getApplicationById(id);
          }
          return of(this.application); // Keep current state if hidden
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (found) => {
          if (found) {
            // Only update if something actually changed to avoid form reset
            const hasChanged = !this.application || 
              JSON.stringify(this.application) !== JSON.stringify(found);

            if (hasChanged) {
              this.application = found;
              this.initForm();
            }
            this.loading = false;
            this.error = '';
          } else if (this.loading) {
            this.error = 'Application not found';
            this.loading = false;
          }
        },
        error: (err) => {
          if (this.loading) {
            this.error = err.status === 404 ? 'Application not found' : 'Failed to load application details';
            this.loading = false;
          }
        }
      });
  }

  initForm(): void {
    if (!this.application) return;
    this.detailsRequest = {
      internalNotes: this.application.internalNotes || '',
      interviewDate: this.application.interviewDate ? new Date(this.application.interviewDate).toISOString().slice(0, 16) : '',
      interviewLocation: this.application.interviewLocation || '',
      recruiterFeedback: this.application.recruiterFeedback || ''
    };
  }

  getSkills(): string[] {
    return this.application?.applicant.skills?.split(',').map(s => s.trim()) || [];
  }

  updateStatus(status: string): void {
    if (!this.application) return;

    this.httpService.updateApplicationStatus(this.application.id, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.application!.status = updated.status;
          this.toastService.showSuccess(`Application stage updated to ${status.replace('_', ' ')}`);
        },
        error: () => this.toastService.showError('Failed to update status')
      });
  }

  saveDetails(): void {
    if (!this.application) return;

    const request = {
      ...this.detailsRequest,
      interviewDate: this.detailsRequest.interviewDate ? new Date(this.detailsRequest.interviewDate).toISOString() : null
    };

    this.httpService.updateApplicationDetails(this.application.id, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.application = updated;
          this.initForm();
          this.toastService.showSuccess('Application details saved successfully');
        },
        error: () => this.toastService.showError('Failed to save application details')
      });
  }

  downloadResume(): void {
    if (!this.application?.resume?.id) return;
    
    this.httpService.downloadResume(this.application.resume.id)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Resume_${this.application?.applicant.fullName || 'Applicant'}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => this.toastService.showError('Failed to download resume')
      });
  }

  messageApplicant(): void {
    if (this.application?.applicant.id) {
      this.router.navigate(['/messages'], { 
        queryParams: { 
          userId: this.application.applicant.id,
          jobId: this.application.job.id
        } 
      });
    }
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 50) return '#3b82f6';
    return '#f59e0b';
  }
}
