// File: ./src/app/login/login.component.ts
import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpService } from '../../services/http.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
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
          this.authService.saveSession(
            response.token,
            response.role,
            response.username,
            response.id
          );
          this.toastService.showSuccess('Login successful!');
          this.navigateBasedOnRole(response.role);
        },
        error: () => {
          this.isLoading = false;
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
        this.router.navigate(['/jobs']);
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
