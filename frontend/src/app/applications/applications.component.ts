// File: ./src/app/applications/applications.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpService } from '../../services/http.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './applications.component.html'
})
export class ApplicationsComponent implements OnInit {
  applications: any[] = [];
  isRecruiter = false;
  isJobSeeker = false;
  successMessage = '';
  errorMessage = '';
  isLoading = false;
  statusOptions: string[] = ['APPLIED', 'SHORTLISTED', 'REJECTED', 'HIRED'];

  constructor(private httpService: HttpService, public authService: AuthService) {}

  ngOnInit(): void {
    this.isRecruiter = this.authService.isRecruiter();
    this.isJobSeeker = this.authService.isJobSeeker();
    this.loadApplications();
  }

  loadApplications(): void {
    this.isLoading = true;
    if (this.isRecruiter) {
      this.httpService.getRecruiterApplications().subscribe({
        next: (response) => {
          this.applications = response;
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Failed to load applications';
          this.isLoading = false;
        }
      });
    } else if (this.isJobSeeker) {
      this.httpService.getMyApplications().subscribe({
        next: (response) => {
          this.applications = response;
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Failed to load applications';
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  onUpdateStatus(applicationId: number, newStatus: string): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.httpService.updateApplicationStatus(applicationId, newStatus).subscribe({
      next: () => {
        this.successMessage = 'Status updated to: ' + newStatus;
        this.loadApplications(); // reload to show updated state
      },
      error: () => {
        this.errorMessage = 'Failed to update status';
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
