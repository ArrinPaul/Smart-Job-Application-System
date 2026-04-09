// File: ./src/app/post-job/post-job.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpService } from '../../services/http.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-post-job',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './post-job.component.html'
})
export class PostJobComponent implements OnInit {
  jobTitle = '';
  jobDescription = '';
  jobLocation = '';
  successMessage = '';
  errorMessage = '';
  isLoading = false;
  
  myJobs: any[] = [];
  editingJobId: number | null = null;

  constructor(
    private httpService: HttpService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMyJobs();
  }

  loadMyJobs(): void {
    this.httpService.getRecruiterJobs().subscribe({
      next: (response) => {
        this.myJobs = response;
      },
      error: () => {
        this.errorMessage = 'Failed to load your jobs';
      }
    });
  }

  onPostJob(): void {
    if (!this.jobTitle || !this.jobLocation) {
      this.errorMessage = 'Title and Location are required';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const jobData = {
      title: this.jobTitle,
      description: this.jobDescription,
      location: this.jobLocation
    };

    if (this.editingJobId) {
      this.httpService.updateJob(this.editingJobId, jobData).subscribe({
        next: () => {
          this.successMessage = 'Job updated successfully!';
          this.resetForm();
          this.loadMyJobs();
        },
        error: (error) => {
          this.errorMessage = error.error?.error || 'Failed to update job';
          this.isLoading = false;
        }
      });
    } else {
      this.httpService.createJob(jobData).subscribe({
        next: () => {
          this.successMessage = 'Job posted successfully!';
          this.resetForm();
          this.loadMyJobs();
        },
        error: (error) => {
          this.errorMessage = error.error?.error || 'Failed to post job';
          this.isLoading = false;
        }
      });
    }
  }

  editJob(job: any): void {
    this.editingJobId = job.id;
    this.jobTitle = job.title;
    this.jobDescription = job.description;
    this.jobLocation = job.location;
    window.scrollTo(0, 0);
  }

  deleteJob(jobId: number): void {
    if (confirm('Are you sure you want to delete this job?')) {
      this.httpService.deleteJob(jobId).subscribe({
        next: () => {
          this.successMessage = 'Job deleted successfully';
          this.loadMyJobs();
        },
        error: () => {
          this.errorMessage = 'Failed to delete job';
        }
      });
    }
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
}
