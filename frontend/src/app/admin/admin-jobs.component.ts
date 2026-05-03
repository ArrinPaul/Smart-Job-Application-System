import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpService } from '../services/http.service';
import { ToastService } from '../services/toast.service';
import { TranslationService } from '../services/translation.service';
import { Job } from '../models/job.model';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-admin-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-jobs.component.html',
  styleUrl: './admin-jobs.component.css'
})
export class AdminJobsComponent implements OnInit, OnDestroy {
  jobs: Job[] = [];
  isLoading = false;
  
  // Search
  searchTitle = '';
  searchLocation = '';

  // Modals
  showEditModal = false;
  showDeleteConfirm = false;
  
  editingJob: Job | null = null;
  jobToDelete: Job | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 15;

  private destroy$ = new Subject<void>();

  constructor(
    private httpService: HttpService,
    private toastService: ToastService,
    private translationService: TranslationService
  ) {}

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.isLoading = true;
    this.httpService.getAllJobsAdmin(this.searchTitle, this.searchLocation)
      .pipe(
        takeUntil(this.destroy$),
        switchMap((response: Job[]) => this.translationService.translateJobs(response))
      )
      .subscribe({
        next: (translatedJobs: Job[]) => {
          this.jobs = translatedJobs;
          this.isLoading = false;
          this.currentPage = 1; // Reset to first page on new load
        },
        error: () => {
          this.isLoading = false;
          this.toastService.showError('Failed to load jobs');
        }
      });
  }

  get paginatedJobs(): Job[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.jobs.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.jobs.length / this.pageSize);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  get showingStart(): number {
    if (this.jobs.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.jobs.length);
  }

  onSearch(): void {
    this.loadJobs();
  }

  clearSearch(): void {
    this.searchTitle = '';
    this.searchLocation = '';
    this.loadJobs();
  }

  openEditModal(job: Job): void {
    // Create a deep copy to avoid direct binding to the list
    this.editingJob = JSON.parse(JSON.stringify(job));
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingJob = null;
  }

  saveJobChanges(): void {
    if (!this.editingJob) return;

    this.isLoading = true;
    this.httpService.updateJobAdmin(this.editingJob.id, this.editingJob)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.toastService.showSuccess('Job updated successfully');
          this.closeEditModal();
          this.loadJobs();
        },
        error: () => {
          this.isLoading = false;
          this.toastService.showError('Failed to update job');
        }
      });
  }

  openDeleteConfirm(job: Job): void {
    this.jobToDelete = job;
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.jobToDelete = null;
  }

  confirmDelete(): void {
    if (!this.jobToDelete) return;

    this.isLoading = true;
    this.httpService.deleteJobAdmin(this.jobToDelete.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.toastService.showSuccess('Job deleted successfully');
          this.closeDeleteConfirm();
          this.loadJobs();
        },
        error: () => {
          this.isLoading = false;
          this.toastService.showError('Failed to delete job');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
