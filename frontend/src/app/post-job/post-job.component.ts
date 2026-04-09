// File: ./src/app/post-job/post-job.component.ts
import { Component } from '@angular/core';
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
export class PostJobComponent {
  jobTitle = '';
  jobDescription = '';
  jobLocation = '';
  successMessage = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private httpService: HttpService,
    private authService: AuthService,
    private router: Router
  ) {}

  onPostJob(): void {
    if (!this.jobTitle || !this.jobLocation) {
      this.errorMessage = 'Title and Location are required';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.httpService.createJob({
      title: this.jobTitle,
      description: this.jobDescription,
      location: this.jobLocation
    }).subscribe({
      next: () => {
        this.successMessage = 'Job posted successfully!';
        this.jobTitle = '';
        this.jobDescription = '';
        this.jobLocation = '';
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Failed to post job';
        this.isLoading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
