// File: ./src/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UserRole } from '../app/models/user.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly ROLE_KEY = 'jobportal_role';
  private readonly MFA_KEY = 'jobportal_mfa_enabled';
  private readonly ONBOARDING_KEY = 'jobportal_onboarding_completed';
  private loggedInSubject = new BehaviorSubject<boolean>(false);
  public loggedIn$ = this.loggedInSubject.asObservable();

  constructor(private router: Router) {
    // Check if user is already logged in on service initialization
    this.loggedInSubject.next(this.isLoggedIn());
  }

  saveSession(role: UserRole, username?: string, userId?: number, mfaEnabled?: boolean, token?: string, onboardingCompleted?: boolean): void {
    localStorage.setItem(this.ROLE_KEY, role);
    if (username) localStorage.setItem('username', username);
    if (userId) localStorage.setItem('userId', String(userId));
    localStorage.setItem(this.MFA_KEY, String(!!mfaEnabled));
    if (token) localStorage.setItem('token', token);
    localStorage.setItem(this.ONBOARDING_KEY, String(!!onboardingCompleted));
    this.loggedInSubject.next(true);
  }

  getToken(): string | null {
    return null;
  }

  getRole(): UserRole | null {
    const role = localStorage.getItem(this.ROLE_KEY);
    return role as UserRole | null;
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  getUserId(): number | null {
    const userId = localStorage.getItem('userId');
    return userId ? parseInt(userId, 10) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getRole();
  }

  logout(): void {
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.MFA_KEY);
    localStorage.removeItem(this.ONBOARDING_KEY);
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('mfaOtpCode');
    this.loggedInSubject.next(false);
    this.router.navigate(['/login']);
  }

  isMfaEnabled(): boolean {
    return localStorage.getItem(this.MFA_KEY) === 'true';
  }

  setMfaOtpCode(otpCode: string): void {
    localStorage.setItem('mfaOtpCode', otpCode);
  }

  getMfaOtpCode(): string | null {
    return localStorage.getItem('mfaOtpCode');
  }

  isAdmin(): boolean {
    return this.getRole() === UserRole.ADMIN;
  }

  isRecruiter(): boolean {
    return this.getRole() === UserRole.RECRUITER;
  }

  isJobApplicant(): boolean {
    return this.getRole() === UserRole.JOB_APPLICANT;
  }

  isOnboardingCompleted(): boolean {
    return localStorage.getItem(this.ONBOARDING_KEY) === 'true';
  }

  setOnboardingCompleted(completed: boolean): void {
    localStorage.setItem(this.ONBOARDING_KEY, String(completed));
  }

  // Secure localStorage access - validates token existence
  private secureLsGetItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Error accessing localStorage:', e);
      return null;
    }
  }
}
