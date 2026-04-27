import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpService } from '../services/http.service';
import { ToastService } from '../services/toast.service';
import { Job } from '../models/job.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
  
  // Modals
  showEditModal = false;
  showDeleteConfirm = false;
  
  editingJob: Job | null = null;
  jobToDelete: Job | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private httpService: HttpService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.isLoading = true;
    this.httpService.getAllJobsAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: Job[]) => {
          this.jobs = response;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.toastService.showError('Failed to load jobs');
        }
      });
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
