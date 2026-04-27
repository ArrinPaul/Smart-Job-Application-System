// File: ./src/app/registration/registration.component.ts
import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpService } from '../services/http.service';
import { ToastService } from '../services/toast.service';
import { RegisterRequest, UserRole } from '../models/user.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './registration.component.html'
})
export class RegistrationComponent implements OnDestroy {
  username = '';
  password = '';
  email = '';
  role: UserRole | '' = '';
  isLoading = false;
  roleOptions = [
    { label: 'Recruiter', value: UserRole.RECRUITER },
    { label: 'Job Applicant', value: UserRole.JOB_APPLICANT }
  ];
  private destroy$ = new Subject<void>();

  constructor(
    private httpService: HttpService,
    private toastService: ToastService,
    private router: Router
  ) {}

  onRegister(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    const registerRequest: RegisterRequest = {
      username: this.username,
      email: this.email,
      password: this.password,
      role: this.role as UserRole
    };

    this.httpService.register(registerRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          // Show success message
          this.toastService.showSuccess('Account created successfully! Redirecting to login...');
          // Reset form
          this.username = '';
          this.email = '';
          this.password = '';
          this.role = '';
          // Redirect to login after showing success toast
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          // Error is already handled by the interceptor
          // Just log for debugging
          console.error('Registration failed:', error);
        }
      });
  }

  private validateForm(): boolean {
    if (!this.username.trim()) {
      this.toastService.showWarning('Username is required');
      return false;
    }
    if (!this.email.trim()) {
      this.toastService.showWarning('Email is required');
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(this.email)) {
      this.toastService.showWarning('Please enter a valid email');
      return false;
    }
    if (!this.password.trim()) {
      this.toastService.showWarning('Password is required');
      return false;
    }
    if (this.password.length < 6) {
      this.toastService.showWarning('Password must be at least 6 characters');
      return false;
    }
    if (!this.role) {
      this.toastService.showWarning('Please select a role');
      return false;
    }
    return true;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

