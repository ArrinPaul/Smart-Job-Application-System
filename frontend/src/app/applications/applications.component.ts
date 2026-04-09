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
  isJobSeeker = false;
  isLoading = false;
  statusOptions = Object.values(ApplicationStatus);
  private destroy$ = new Subject<void>();

  constructor(
    private httpService: HttpService,
    public authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.isRecruiter = this.authService.isRecruiter();
    this.isJobSeeker = this.authService.isJobSeeker();
    this.loadApplications();
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
    } else if (this.isJobSeeker) {
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

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
