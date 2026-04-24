// File: ./src/app/job-list/job-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpService } from '../services/http.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Job } from '../models/job.model';
import { User, UserRole } from '../models/user.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './job-list.component.html'
})
export class JobListComponent implements OnInit, OnDestroy {
  jobs: Job[] = [];
  users: User[] = [];
  searchTitle = '';
  searchLocation = '';
  activeQuickFilter = 'ALL';
  isLoading = false;
  isAdmin = false;
  showUsers = false;
  private destroy$ = new Subject<void>();
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private httpService: HttpService,
    public authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.loadJobs();
    this.startAutoRefresh();
    if (this.isAdmin) {
      this.loadUsers();
    }
  }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => {
      if (!this.isLoading) {
        this.loadJobs();
      }
    }, 12000);
  }

  loadJobs(): void {
    this.isLoading = true;
    this.httpService.getJobs(this.searchTitle, this.searchLocation)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: Job[]) => {
          this.jobs = response;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  loadUsers(): void {
    this.httpService.getAllUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: User[]) => {
          this.users = response;
        },
        error: () => {
          // Error will be handled by interceptor toast
        }
      });
  }

  onSearch(): void {
    this.activeQuickFilter = 'CUSTOM';
    this.loadJobs();
  }

  applyQuickFilter(filter: 'ALL' | 'REMOTE' | 'ENGINEERING' | 'ENTRY'): void {
    this.activeQuickFilter = filter;

    switch (filter) {
      case 'REMOTE':
        this.searchTitle = '';
        this.searchLocation = 'Remote';
        break;
      case 'ENGINEERING':
        this.searchTitle = 'Engineer';
        this.searchLocation = '';
        break;
      case 'ENTRY':
        this.searchTitle = 'Intern';
        this.searchLocation = '';
        break;
      default:
        this.searchTitle = '';
        this.searchLocation = '';
        break;
    }

    this.loadJobs();
  }

  get totalJobs(): number {
    return this.jobs.length;
  }

  get remoteJobsCount(): number {
    return this.jobs.filter(job => {
      const location = (job.location || '').toLowerCase();
      return location.includes('remote') || location.includes('hybrid');
    }).length;
  }

  get recentJobsCount(): number {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return this.jobs.filter(job => {
      if (!job.createdAt) return false;
      return new Date(job.createdAt) >= sevenDaysAgo;
    }).length;
  }

  getRoleSignal(title: string): string {
    const normalized = title.toLowerCase();

    if (normalized.includes('intern') || normalized.includes('trainee') || normalized.includes('junior')) {
      return 'Entry Friendly';
    }
    if (normalized.includes('lead') || normalized.includes('principal') || normalized.includes('architect')) {
      return 'Leadership Track';
    }
    return 'Core Role';
  }

  toggleView(view: string): void {
    this.showUsers = (view === 'users');
  }

  onApply(jobId: number): void {
    this.httpService.applyJob(jobId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.showSuccess('Applied successfully!');
        },
        error: () => {
          // Error will be handled by interceptor toast
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

