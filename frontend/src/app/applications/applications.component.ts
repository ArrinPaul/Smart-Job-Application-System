// File: ./src/app/applications/applications.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpService } from '../services/http.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Application, ApplicationStatus } from '../models/job.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './applications.component.html'
})
export class ApplicationsComponent implements OnInit, OnDestroy {
  applications: Application[] = [];
  isRecruiter = false;
  isJobSeeker = false;
  isLoading = false;
  currentPhase = 'active'; // active, interviews, offers, archived
  statusOptions = Object.values(ApplicationStatus);
  private destroy$ = new Subject<void>();

  constructor(
    private httpService: HttpService,
    public authService: AuthService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isRecruiter = this.authService.isRecruiter();
    this.isJobSeeker = this.authService.isJobSeeker();
    
    this.route.url.subscribe(() => {
      const path = this.router.url.split('/').pop() || 'active';
      this.currentPhase = ['active', 'interviews', 'offers', 'archived'].includes(path) ? path : 'active';
      this.loadApplications();
    });
  }

  loadApplications(): void {
    this.isLoading = true;
    const request = this.isRecruiter ? this.httpService.getRecruiterApplications() : this.httpService.getMyApplications();
    
    request.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: Application[]) => {
        this.applications = response;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  get filteredApplications(): Application[] {
    const phase = this.currentPhase;
    if (phase === 'active') {
      return this.applications.filter(app => ['APPLIED', 'SHORTLISTED'].includes(app.status));
    } else if (phase === 'interviews') {
      return this.applications.filter(app => ['PHONE_SCREEN', 'TECHNICAL_INTERVIEW', 'ON_SITE_INTERVIEW'].includes(app.status));
    } else if (phase === 'offers') {
      return this.applications.filter(app => ['OFFER_EXTENDED'].includes(app.status));
    } else if (phase === 'archived' || phase === 'hired') {
      return this.applications.filter(app => ['HIRED', 'REJECTED', 'HOLD'].includes(app.status));
    }
    return this.applications;
  }

  getApplicationsCount(phase: string): number {
    if (phase === 'active') {
      return this.applications.filter(app => ['APPLIED', 'SHORTLISTED'].includes(app.status)).length;
    } else if (phase === 'interviews') {
      return this.applications.filter(app => ['PHONE_SCREEN', 'TECHNICAL_INTERVIEW', 'ON_SITE_INTERVIEW'].includes(app.status)).length;
    } else if (phase === 'offers') {
      return this.applications.filter(app => ['OFFER_EXTENDED'].includes(app.status)).length;
    } else if (phase === 'archived') {
      return this.applications.filter(app => ['HIRED', 'REJECTED', 'HOLD'].includes(app.status)).length;
    }
    return 0;
  }

  getStepStatus(currentStatus: string, step: string): string {
    const interviewStatuses = ['PHONE_SCREEN', 'TECHNICAL_INTERVIEW', 'ON_SITE_INTERVIEW', 'OFFER_EXTENDED'];
    
    if (step === 'APPLIED') {
      return 'completed';
    }
    
    if (step === 'SHORTLISTED') {
      if (currentStatus === 'APPLIED') return 'active';
      return 'completed';
    }

    if (step === 'INTERVIEW') {
      if (['APPLIED', 'SHORTLISTED'].includes(currentStatus)) return '';
      if (interviewStatuses.includes(currentStatus)) return 'active';
      if (currentStatus === 'HIRED' || currentStatus === 'REJECTED') return 'completed';
    }

    if (step === 'HIRED') {
      if (currentStatus === 'HIRED') return 'active';
      return '';
    }

    return '';
  }

  onUpdateStatus(applicationId: number, newStatus: string): void {
    this.httpService.updateApplicationStatus(applicationId, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.showSuccess('Status updated to: ' + newStatus.replace('_', ' '));
          this.loadApplications();
        }
      });
  }

  downloadResume(resumeId: number, fileName: string): void {
    this.httpService.downloadResume(resumeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.click();
          window.URL.revokeObjectURL(url);
          this.toastService.showSuccess('Resume downloaded');
        },
        error: () => this.toastService.showError('Failed to download resume')
      });
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

