// File: ./src/app/post-job/post-job.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpService } from '../services/http.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Job, CreateJobRequest } from '../models/job.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-post-job',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './post-job.component.html'
})
export class PostJobComponent implements OnInit, OnDestroy {
  jobTitle = '';
  jobDescription = '';
  jobLocation = '';
  isLoading = false;
  
  myJobs: Job[] = [];
  editingJobId: number | null = null;
  private destroy$ = new Subject<void>();
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private httpService: HttpService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMyJobs();
    this.startAutoRefresh();
  }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => {
      if (!this.isLoading) {
        this.loadMyJobs();
      }
    }, 10000);
  }

  loadMyJobs(): void {
    this.httpService.getRecruiterJobs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: Job[]) => {
          this.myJobs = response;
        },
        error: () => {
          // Error handled by interceptor toast
        }
      });
  }

  onPostJob(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    const jobData: CreateJobRequest = {
      title: this.jobTitle,
      description: this.jobDescription,
      location: this.jobLocation
    };

    if (this.editingJobId) {
      this.httpService.updateJob(this.editingJobId, jobData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.showSuccess('Job updated successfully!');
            this.resetForm();
            this.loadMyJobs();
          },
          error: () => {
            this.isLoading = false;
          }
        });
    } else {
      this.httpService.createJob(jobData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.showSuccess('Job posted successfully!');
            this.resetForm();
            this.loadMyJobs();
          },
          error: () => {
            this.isLoading = false;
          }
        });
    }
  }

  editJob(job: Job): void {
    this.editingJobId = job.id;
    this.jobTitle = job.title;
    this.jobDescription = job.description;
    this.jobLocation = job.location;
    window.scrollTo(0, 0);
  }

  getActiveJobsCount(): number {
    return this.myJobs.length;
  }

  deleteJob(jobId: number): void {
    if (confirm('Are you sure you want to delete this job?')) {
      this.httpService.deleteJob(jobId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.showSuccess('Job deleted successfully');
            this.loadMyJobs();
          },
          error: () => {
            // Error handled by interceptor toast
          }
        });
    }
  }

  private validateForm(): boolean {
    if (!this.jobTitle.trim()) {
      this.toastService.showWarning('Job title is required');
      return false;
    }
    if (!this.jobDescription.trim()) {
      this.toastService.showWarning('Job description is required');
      return false;
    }
    if (!this.jobLocation.trim()) {
      this.toastService.showWarning('Job location is required');
      return false;
    }
    return true;
  }

  resetForm(): void {
    this.jobTitle = '';
    this.jobDescription = '';
    this.jobLocation = '';
    this.editingJobId = null;
    this.isLoading = false;
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
