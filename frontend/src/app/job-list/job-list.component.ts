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
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.css']
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
    'Support'
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
  
  // Pagination
  currentPage = 1;
  pageSize = 15;
  
  private destroy$ = new Subject<void>();

  constructor(
    private httpService: HttpService,
    public authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.loadJobs();
    if (this.isAdmin) {
      this.loadUsers();
    }
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
      const skills = (job.requiredSkills || '').toLowerCase();
      const combinedText = `${title} ${desc} ${skills}`;

      if (this.selectedCategory !== 'All Categories') {
        matchesCategory = this.matchesCategory(this.selectedCategory, combinedText);
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

  get showingStart(): number {
    if (this.filteredJobs.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredJobs.length);
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

  getJobCategory(job: Job): string {
    const text = `${job.title} ${job.description} ${job.requiredSkills || ''}`.toLowerCase();

    if (this.matchesCategory('Design', text)) {
      return 'Design';
    }
    if (this.matchesCategory('Support', text)) {
      return 'Support';
    }
    if (this.matchesCategory('Engineering', text)) {
      return 'Engineering';
    }

    return 'Engineering';
  }

  private matchesCategory(category: string, text: string): boolean {
    const normalized = text.toLowerCase();

    switch (category) {
      case 'Design':
        return /\b(design|designer|ui|ux|graphic|visual|product\s+designer)\b/.test(normalized);
      case 'Support':
        return /\b(support|customer\s+success|help\s+desk|service\s+desk|customer\s+care)\b/.test(normalized);
      case 'Engineering':
        return /\b(engineer|engineering|developer|software|frontend|back\s*end|backend|full\s*stack|devops|qa|data|mobile|ios|android)\b/.test(normalized);
      default:
        return normalized.includes(category.toLowerCase());
    }
  }

  getStatusLabel(job: Job): string {
    return job.isActive === false ? 'Closed' : 'Open';
  }

  formatPostedDate(dateValue?: string): string {
    if (!dateValue) {
      return 'Recently posted';
    }

    const createdAt = new Date(dateValue);
    if (Number.isNaN(createdAt.getTime())) {
      return 'Recently posted';
    }

    const now = new Date();
    const difference = Math.max(0, now.getTime() - createdAt.getTime());
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Posted today';
    }

    if (days === 1) {
      return 'Posted 1 day ago';
    }

    return `Posted ${days} days ago`;
  }

  formatSalary(job: Job): string {
    if (!job.salaryMin && !job.salaryMax) {
      return 'Salary on request';
    }

    const currency = job.salaryCurrency || 'USD';
    const formatter = new Intl.NumberFormat('en-US');
    const minValue = job.salaryMin ? formatter.format(job.salaryMin) : '';
    const maxValue = job.salaryMax ? formatter.format(job.salaryMax) : '';

    if (minValue && maxValue) {
      return `${currency} ${minValue} - ${maxValue}`;
    }

    return `${currency} ${minValue || maxValue}`;
  }

  formatExperience(experienceRequired?: number): string {
    if (experienceRequired === undefined || experienceRequired === null) {
      return 'Open experience';
    }

    if (experienceRequired <= 0) {
      return 'Freshers welcome';
    }

    if (experienceRequired === 1) {
      return '1 year exp';
    }

    return `${experienceRequired}+ years exp`;
  }

  getJobPreview(job: Job, maxLength: number = 115): string {
    const plainText = this.stripPreviewText(job.description || '');

    if (!plainText) {
      return 'View the full role details on the job page.';
    }

    return plainText.length > maxLength ? `${plainText.slice(0, maxLength)}...` : plainText;
  }

  private stripPreviewText(input: string): string {
    if (!input) return '';
    let text = input;

    if (text.includes('&lt;') || text.includes('&gt;') || text.includes('&#')) {
      try {
        const doc = new DOMParser().parseFromString(text, 'text/html');
        text = doc.documentElement.textContent || text;
      } catch {
        // keep original text if decoding fails
      }
    }

    return text
      .replace(/<[^>]+>/g, ' ')
      .replace(/^#+\s+/gm, ' ')
      .replace(/\n#+\s+/g, ' ')
      .replace(/#/g, '')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/[\*_]{1,3}/g, '')
      .replace(/`{1,3}/g, '')
      .replace(/\s+/g, ' ')
      .trim();
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

  editJob(jobId: number): void {
    this.toastService.showInfo(`Edit workflow for job #${jobId} is available in the admin area.`);
  }

  deleteJob(jobId: number): void {
    const confirmed = window.confirm('Delete this job listing permanently?');
    if (!confirmed) {
      return;
    }

    this.httpService.deleteJobAdmin(jobId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.showSuccess('Job deleted successfully.');
          this.loadJobs(false);
        },
        error: () => {
          this.toastService.showError('Failed to delete job.');
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
