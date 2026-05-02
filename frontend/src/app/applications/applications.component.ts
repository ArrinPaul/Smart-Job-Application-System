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

  get filteredApplications(): Application[] {
    switch (this.currentPhase) {
      case 'interviews':
        return this.applications.filter(app => 
          [ApplicationStatus.PHONE_SCREEN, ApplicationStatus.TECHNICAL_INTERVIEW, ApplicationStatus.ON_SITE_INTERVIEW].includes(app.status)
        );
      case 'offers':
        return this.applications.filter(app => app.status === ApplicationStatus.OFFER_EXTENDED);
      case 'archived':
        return this.applications.filter(app => 
          [ApplicationStatus.HIRED, ApplicationStatus.REJECTED, ApplicationStatus.HOLD].includes(app.status)
        );
      case 'active':
      default:
        return this.applications.filter(app => 
          [ApplicationStatus.APPLIED, ApplicationStatus.SHORTLISTED].includes(app.status)
        );
    }
  }

  getStepStatus(appStatus: string, stepName: string): string {
    const statuses = [
      ApplicationStatus.APPLIED, 
      ApplicationStatus.SHORTLISTED, 
      ApplicationStatus.PHONE_SCREEN, 
      ApplicationStatus.TECHNICAL_INTERVIEW, 
      ApplicationStatus.ON_SITE_INTERVIEW, 
      ApplicationStatus.OFFER_EXTENDED, 
      ApplicationStatus.HIRED
    ];
    const currentIdx = statuses.indexOf(appStatus as ApplicationStatus);
    
    if (appStatus === ApplicationStatus.REJECTED && stepName === 'REJECTED') return 'rejected';
    if (appStatus === ApplicationStatus.REJECTED && stepName !== 'APPLIED') return '';
    
    if (stepName === 'APPLIED') return currentIdx >= 0 ? 'completed' : '';
    if (stepName === 'SHORTLISTED') return currentIdx >= 1 ? 'completed' : '';
    if (stepName === 'INTERVIEW') return currentIdx >= 2 && currentIdx <= 4 ? 'active' : (currentIdx > 4 ? 'completed' : '');
    if (stepName === 'HIRED') return appStatus === ApplicationStatus.HIRED ? 'completed' : '';
    
    return '';
  }

  getApplicationsCount(phase: string): number {
    if (!this.applications.length) return 0;
    
    switch (phase) {
      case 'interviews':
        return this.applications.filter(app => 
          [ApplicationStatus.PHONE_SCREEN, ApplicationStatus.TECHNICAL_INTERVIEW, ApplicationStatus.ON_SITE_INTERVIEW].includes(app.status)
        ).length;
      case 'offers':
        return this.applications.filter(app => app.status === ApplicationStatus.OFFER_EXTENDED).length;
      case 'archived':
        return this.applications.filter(app => 
          [ApplicationStatus.HIRED, ApplicationStatus.REJECTED, ApplicationStatus.HOLD].includes(app.status)
        ).length;
      case 'active':
      default:
        return this.applications.filter(app => 
          [ApplicationStatus.APPLIED, ApplicationStatus.SHORTLISTED].includes(app.status)
        ).length;
    }
  }

  loadApplications(): void {
    this.isLoading = true;
    const request = this.isRecruiter ? this.httpService.getRecruiterApplications() : this.httpService.getMyApplications();
    
    request.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: Application[]) => {
        this.applications = response;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
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

