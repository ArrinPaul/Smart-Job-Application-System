// File: ./src/app/applications/applications.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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
  isJobApplicant = false;
  isLoading = false;
  selectedStatusFilter = 'ALL';
  statusOptions = Object.values(ApplicationStatus);
  private destroy$ = new Subject<void>();
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private httpService: HttpService,
    public authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.isRecruiter = this.authService.isRecruiter();
    this.isJobApplicant = this.authService.isJobApplicant();
    this.loadApplications();
    this.startAutoRefresh();
  }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => {
      if (!this.isLoading) {
        this.loadApplications();
      }
    }, 12000);
  }

  getStepStatus(appStatus: string, stepName: string): string {
    const statuses = ['APPLIED', 'SHORTLISTED', 'HIRED', 'REJECTED'];
    const currentIdx = statuses.indexOf(appStatus);
    
    if (appStatus === 'REJECTED' && stepName === 'REJECTED') return 'rejected';
    if (appStatus === 'REJECTED' && stepName !== 'APPLIED') return '';
    
    if (stepName === 'APPLIED') {
      return currentIdx >= 0 ? 'completed' : '';
    }
    if (stepName === 'SHORTLISTED') {
      if (appStatus === 'SHORTLISTED') return 'active';
      return currentIdx > 1 ? 'completed' : '';
    }
    if (stepName === 'HIRED') {
      if (appStatus === 'HIRED') return 'completed';
      return '';
    }
    return '';
  }

  getApplicationsCount(status: string): number {
    return this.applications.filter(app => app.status === status).length;
  }

  get filteredApplications(): Application[] {
    if (this.selectedStatusFilter === 'ALL') {
      return this.applications;
    }

    return this.applications.filter(app => app.status === this.selectedStatusFilter);
  }

  setStatusFilter(status: string): void {
    this.selectedStatusFilter = status;
  }

  get hiredCount(): number {
    return this.getApplicationsCount('HIRED');
  }

  get rejectedCount(): number {
    return this.getApplicationsCount('REJECTED');
  }

  loadApplications(): void {
    this.isLoading = true;
    if (this.isRecruiter) {
      this.httpService.getRecruiterApplications()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: Application[]) => {
            this.applications = response;
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
          }
        });
    } else if (this.isJobApplicant) {
      this.httpService.getMyApplications()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: Application[]) => {
            this.applications = response;
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
          }
        });
    } else {
      this.isLoading = false;
    }
  }

  onUpdateStatus(applicationId: number, newStatus: string): void {
    this.httpService.updateApplicationStatus(applicationId, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.showSuccess('Status updated to: ' + newStatus);
          this.loadApplications();
        },
        error: () => {
          // Error handled by interceptor toast
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
        error: () => {
          this.toastService.showError('Failed to download resume');
        }
      });
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}
