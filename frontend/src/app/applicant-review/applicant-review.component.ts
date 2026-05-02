import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpService } from '../services/http.service';
import { ToastService } from '../services/toast.service';
import { Application, ApplicationStatus, UpdateApplicationDetailsRequest } from '../models/job.model';
import { Subject, takeUntil, finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-applicant-review',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './applicant-review.component.html',
  styleUrls: ['./applicant-review.component.css']
})
export class ApplicantReviewComponent implements OnInit, OnDestroy {
  private httpService = inject(HttpService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  application: Application | null = null;
  loading = true;
  isSaving = false;
  error = '';
  activeTab = 'profile';
  
  // Form fields
  internalNotes = '';
  recruiterFeedback = '';
  interviewDate = '';
  interviewLocation = '';

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

  constructor() {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadApplication(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadApplication(id: number): void {
    this.loading = true;
    this.httpService.getRecruiterApplications()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (apps) => {
          this.application = apps.find(a => a.id === Number(id)) || null;
          if (this.application) {
            this.internalNotes = this.application.internalNotes || '';
            this.recruiterFeedback = this.application.recruiterFeedback || '';
            this.interviewLocation = this.application.interviewLocation || '';
            if (this.application.interviewDate) {
              const date = new Date(this.application.interviewDate);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              this.interviewDate = `${year}-${month}-${day}T${hours}:${minutes}`;
            }
          } else {
            this.error = 'Candidate record not found.';
          }
        },
        error: () => this.error = 'Failed to load candidate details.'
      });
  }

  get nextPossibleStatuses(): ApplicationStatus[] {
    if (!this.application) return [];
    
    const currentStatus = this.application.status.toUpperCase() as ApplicationStatus;
    const currentIndex = this.statusFlow.indexOf(currentStatus);
    
    if (currentIndex === -1) {
       if (currentStatus === ApplicationStatus.HOLD) return [ApplicationStatus.SHORTLISTED];
       return [ApplicationStatus.SHORTLISTED];
    }
    
    // Suggest the next 1 step as primary
    return this.statusFlow.slice(currentIndex + 1, currentIndex + 2);
  }

  get skippableStatuses(): ApplicationStatus[] {
    if (!this.application) return [];
    
    const currentStatus = this.application.status.toUpperCase() as ApplicationStatus;
    const currentIndex = this.statusFlow.indexOf(currentStatus);
    
    if (currentIndex === -1) return [];

    // All steps after the next possible one
    return this.statusFlow.slice(currentIndex + 2);
  }

  isStepCompleted(step: ApplicationStatus): boolean {
    if (!this.application) return false;
    const currentStatus = this.application.status.toUpperCase() as ApplicationStatus;
    const targetIndex = this.statusFlow.indexOf(step);
    const currentIndex = this.statusFlow.indexOf(currentStatus);
    
    if (currentStatus === ApplicationStatus.REJECTED) return false;
    if (currentStatus === ApplicationStatus.HIRED) return true;
    
    return targetIndex < currentIndex;
  }

  getSkills(): string[] {
    return this.application?.applicant.skills?.split(',').map(s => s.trim()) || [];
  }

  updateStatus(status: ApplicationStatus): void {
    if (!this.application) return;

    this.isSaving = true;
    this.httpService.updateApplicationStatus(this.application.id, status)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSaving = false)
      )
      .subscribe({
        next: (updated) => {
          this.application!.status = updated.status;
          this.toastService.showSuccess(`Pipeline updated: Candidate moved to ${status.replace('_', ' ')}`);
        },
        error: () => this.toastService.showError('Failed to update pipeline stage.')
      });
  }

  saveDetails(): void {
    if (!this.application) return;

    this.isSaving = true;
    const request: UpdateApplicationDetailsRequest = {
      internalNotes: this.internalNotes,
      recruiterFeedback: this.recruiterFeedback,
      interviewLocation: this.interviewLocation
    };

    if (this.interviewDate) {
      request.interviewDate = new Date(this.interviewDate).toISOString();
    }

    this.httpService.updateApplicationDetails(this.application.id, request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSaving = false)
      )
      .subscribe({
        next: (updated) => {
          this.application = { ...this.application!, ...updated };
          this.toastService.showSuccess('Evaluation details synced successfully.');
        },
        error: () => this.toastService.showError('Failed to save evaluation.')
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
          a.download = `CV_${this.application?.applicant.fullName || 'Candidate'}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => this.toastService.showError('Failed to download CV.')
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

  logout(): void {
    this.authService.logout();
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#1e6742';
    if (score >= 50) return '#0d6774';
    return '#bb3e2d';
  }
}
