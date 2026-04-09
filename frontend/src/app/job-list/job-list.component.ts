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
  isLoading = false;
  isAdmin = false;
  showUsers = false;
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
    this.loadJobs();
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
    this.destroy$.next();
    this.destroy$.complete();
  }
}

