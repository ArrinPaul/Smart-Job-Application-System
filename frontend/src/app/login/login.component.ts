// File: ./src/app/login/login.component.ts
import { Component, OnDestroy, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpService } from '../services/http.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { LoginRequest, LoginResponse, UserRole } from '../models/user.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnDestroy {
  username = '';
  password = '';
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private httpService: HttpService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  onLogin(): void {
    if (!this.username.trim() || !this.password.trim()) {
      this.toastService.showWarning('Please enter username and password');
      return;
    }

    this.isLoading = true;
    const loginRequest: LoginRequest = {
      username: this.username,
      password: this.password
    };

    this.httpService.login(loginRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: LoginResponse) => {
          this.isLoading = false;
          this.authService.saveSession(
            response.role,
            response.username,
            response.id,
            response.mfaEnabled,
            response.token,
            response.onboardingCompleted
          );

          if (response.mfaEnabled) {
            const otpCode = window.prompt('MFA is enabled. Enter your current 6-digit authenticator code for sensitive actions:');
            if (otpCode && /^\d{6}$/.test(otpCode.trim())) {
              this.authService.setMfaOtpCode(otpCode.trim());
            }
          }

          // Show success message
          this.toastService.showSuccess('Login successful! Welcome back!');
          
          // Navigate based on role and onboarding status
          setTimeout(() => {
            const role = response.role;
            const onboardingCompleted = response.onboardingCompleted;

            if (!onboardingCompleted && role !== UserRole.ADMIN) {
              console.log('Navigating to onboarding...');
              this.router.navigate(['/onboarding']);
            } else {
              console.log('Navigating to dashboard based on role:', role);
              this.navigateBasedOnRole(role);
            }
          }, 1000);
        },
        error: (error) => {
          this.isLoading = false;
          // Interceptor already displays user-facing error toasts.
          if (isDevMode()) {
            console.warn('Login failed', {
              status: error?.status,
              url: error?.url,
              message: error?.error?.message || error?.message
            });
          }
        }
      });
  }

  private navigateBasedOnRole(role: any): void {
    const normalizedRole = String(role).toUpperCase();
    console.log('[Login] Normalizing role for navigation:', normalizedRole);

    switch (normalizedRole) {
      case 'RECRUITER':
        this.router.navigate(['/post-job']);
        break;
      case 'JOB_APPLICANT':
      case 'JOB_SEEKER':
        this.router.navigate(['/dashboard']);
        break;
      case 'ADMIN':
        this.router.navigate(['/admin']);
        break;
      default:
        console.warn('[Login] Unknown role, falling back to landing:', normalizedRole);
        this.router.navigate(['/']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
