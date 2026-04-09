// File: ./src/app/registration/registration.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './registration.component.html'
})
export class RegistrationComponent {
  username = '';
  password = '';
  email = '';
  role = '';
  successMessage = '';
  errorMessage = '';
  isLoading = false;
  roleOptions: string[] = ['RECRUITER', 'JOB_SEEKER'];

  constructor(private httpService: HttpService, private router: Router) {}

  onRegister(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.username || !this.password || !this.email || !this.role) {
      this.errorMessage = 'All fields are required';
      this.isLoading = false;
      return;
    }

    this.httpService.register({
      username: this.username,
      password: this.password,
      email: this.email,
      role: this.role
    }).subscribe({
      next: () => {
        this.successMessage = 'Registration successful! Redirecting to login...';
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Registration failed. Please try again.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}
