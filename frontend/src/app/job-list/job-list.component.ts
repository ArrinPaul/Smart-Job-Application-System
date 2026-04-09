// File: ./src/app/job-list/job-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpService } from '../../services/http.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './job-list.component.html'
})
export class JobListComponent implements OnInit {
  jobs: any[] = [];
  users: any[] = [];
  searchTitle = '';
  searchLocation = '';
  successMessage = '';
  errorMessage = '';
  isLoading = false;
  isAdmin = false;
  showUsers = false;

  constructor(private httpService: HttpService, public authService: AuthService) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.loadJobs();
    if (this.isAdmin) {
      this.loadUsers();
    }
  }

  loadJobs(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.httpService.searchJobs(this.searchTitle, this.searchLocation).subscribe({
      next: (response) => {
        this.jobs = response;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load jobs';
        this.isLoading = false;
      }
    });
  }

  loadUsers(): void {
    this.httpService.getAllUsers().subscribe({
      next: (response) => {
        this.users = response;
      },
      error: () => {
        this.errorMessage = 'Failed to load users';
      }
    });
  }

  onSearch(): void {
    this.loadJobs();
  }

  toggleView(view: string): void {
    this.showUsers = (view === 'users');
    this.successMessage = '';
    this.errorMessage = '';
  }

  onApply(jobId: number): void {
    const userIdString = localStorage.getItem('userId');
    const userId = userIdString ? Number(userIdString) : 1;

    this.httpService.applyForJob(jobId, userId).subscribe({
      next: () => {
        this.successMessage = 'Applied successfully!';
        this.errorMessage = '';
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Failed to apply';
        this.successMessage = '';
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
