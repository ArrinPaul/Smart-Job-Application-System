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
  selectedCategory = 'All Categories';
  selectedJobType = 'All Types';
  
  Math = Math; // Make Math available in template
  
  categories = [
    'All Categories',
    'Engineering',
    'Design',
    'Marketing',
    'Sales',
    'Product',
    'Support',
    'Internships'
  ];

  jobTypes = [
    'All Types',
    'Remote',
    'On-site',
    'Hybrid',
    'Full-time',
    'Part-time'
  ];

  activeQuickFilter = 'ALL';
  isLoading = false;
  isAdmin = false;
  showUsers = false;
  selectedInsights: any = null;
  insightJobId: number | null = null;
  
  // Pagination
  currentPage = 1;
  pageSize = 50;
  
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
        this.loadJobs(false);
      }
    }, 12000);
  }

  loadJobs(resetPagination: boolean = true): void {
    this.isLoading = true;
    if (resetPagination) {
      this.currentPage = 1;
    }
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

  get filteredJobs(): Job[] {
    return this.jobs.filter(job => {
      let matchesCategory = true;
      let matchesType = true;

      const title = (job.title || '').toLowerCase();
      const desc = (job.description || '').toLowerCase();
      const loc = (job.location || '').toLowerCase();

      if (this.selectedCategory !== 'All Categories') {
        const cat = this.selectedCategory.toLowerCase();
        if (cat === 'internships') {
          matchesCategory = title.includes('intern') || desc.includes('intern') || title.includes('trainee');
        } else {
          matchesCategory = title.includes(cat) || desc.includes(cat);
        }
      }

      if (this.selectedJobType !== 'All Types') {
        const type = this.selectedJobType.toLowerCase();
        if (type === 'remote') {
          matchesType = loc.includes('remote') || desc.includes('remote');
        } else if (type === 'hybrid') {
          matchesType = loc.includes('hybrid') || desc.includes('hybrid');
        } else if (type === 'on-site') {
          matchesType = !loc.includes('remote') && !loc.includes('hybrid') && !desc.includes('remote');
        } else {
          matchesType = title.includes(type) || desc.includes(type);
        }
      }

      return matchesCategory && matchesType;
    });
  }

  get paginatedJobs(): Job[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredJobs.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredJobs.length / this.pageSize);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

  clearFilters(): void {
    this.searchTitle = '';
    this.searchLocation = '';
    this.selectedCategory = 'All Categories';
    this.selectedJobType = 'All Types';
    this.activeQuickFilter = 'ALL';
    this.loadJobs();
  }

  applyQuickFilter(filter: 'ALL' | 'REMOTE' | 'ENGINEERING' | 'ENTRY'): void {
    this.activeQuickFilter = filter;
    this.selectedCategory = 'All Categories';
    this.selectedJobType = 'All Types';

    switch (filter) {
      case 'REMOTE':
        this.searchTitle = '';
        this.searchLocation = 'Remote';
        this.selectedJobType = 'Remote';
        break;
      case 'ENGINEERING':
        this.searchTitle = 'Engineer';
        this.searchLocation = '';
        this.selectedCategory = 'Engineering';
        break;
      case 'ENTRY':
        this.searchTitle = 'Intern';
        this.searchLocation = '';
        this.selectedCategory = 'Internships';
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
    return this.jobs.filter(job => this.isRemoteOrHybrid(job)).length;
  }

  isRemoteOrHybrid(job: Job): boolean {
    const location = (job.location || '').toLowerCase();
    const description = (job.description || '').toLowerCase();
    const keywords = ['remote', 'hybrid', 'work from home', 'wfh', 'anywhere'];

    return keywords.some(key => location.includes(key) || description.includes(key));
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

  fetchInsights(jobId: number): void {
    if (this.insightJobId === jobId && this.selectedInsights) {
      this.closeInsights();
      return;
    }

    this.insightJobId = jobId;
    this.selectedInsights = null; // Clear previous

    this.httpService.getJobMatchInsights(jobId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.selectedInsights = response;
          if (response.error) {
            this.toastService.showWarning(response.error);
          }
        },
        error: () => {
          this.toastService.showError('Unable to fetch smart insights.');
          this.insightJobId = null;
        }
      });
  }

  closeInsights(): void {
    this.selectedInsights = null;
    this.insightJobId = null;
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
