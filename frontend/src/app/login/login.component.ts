// File: ./src/app/login/login.component.ts
import { Component, OnDestroy } from '@angular/core';
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
            response.token,
            response.role,
            response.username,
            response.id
          );
          // Show success message
          this.toastService.showSuccess('✅ Login successful! Welcome back!');
          // Navigate based on role after a brief delay
          setTimeout(() => {
            this.navigateBasedOnRole(response.role);
          }, 1500);
        },
        error: (error) => {
          this.isLoading = false;
          // Error is already handled by the interceptor
          // Just log for debugging
          console.error('Login failed:', error);
        }
      });
  }

  private navigateBasedOnRole(role: UserRole): void {
    switch (role) {
      case UserRole.RECRUITER:
        this.router.navigate(['/post-job']);
        break;
      case UserRole.JOB_SEEKER:
        this.router.navigate(['/jobs']);
        break;
      case UserRole.ADMIN:
        this.router.navigate(['/admin']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
