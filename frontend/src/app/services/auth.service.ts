import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { HttpService } from './http.service';
import { UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly ROLE_KEY = 'jobportal_role';
  private readonly MFA_KEY = 'jobportal_mfa_enabled';
  private readonly MFA_OTP_KEY = 'jobportal_mfa_otp_code';
  private loggedIn$ = new BehaviorSubject<boolean>(this.hasSessionMetadata());

  constructor(
    private router: Router,
    private httpService: HttpService
  ) {}

  /**
   * Save authentication session metadata (token remains in HttpOnly cookie)
   */
  saveSession(role: UserRole, username?: string, userId?: number, mfaEnabled?: boolean): void {
    localStorage.setItem(this.ROLE_KEY, role);
    if (username) localStorage.setItem('username', username);
    if (userId) localStorage.setItem('userId', String(userId));
    localStorage.setItem(this.MFA_KEY, String(!!mfaEnabled));
    this.loggedIn$.next(true);
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.hasSessionMetadata();
  }

  /**
   * Get JWT token
   */
  getToken(): string | null {
    return null;
  }

  /**
   * Get user role
   */
  getRole(): UserRole | null {
    const role = localStorage.getItem(this.ROLE_KEY);
    return role as UserRole || null;
  }

  /**
   * Get username
   */
  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  /**
   * Get user ID
   */
  getUserId(): number | null {
    const userId = localStorage.getItem('userId');
    return userId ? parseInt(userId, 10) : null;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: UserRole): boolean {
    return this.getRole() === role;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.getRole() === UserRole.ADMIN;
  }

  /**
   * Check if user is recruiter
   */
  isRecruiter(): boolean {
    return this.getRole() === UserRole.RECRUITER;
  }

  /**
   * Check if user is job seeker
   */
  isJobSeeker(): boolean {
    return this.getRole() === UserRole.JOB_SEEKER;
  }

  /**
   * Get login status as observable
   */
  getLoginStatus(): Observable<boolean> {
    return this.loggedIn$.asObservable();
  }

  /**
   * Logout and clear session
   */
  logout(): void {
    this.httpService.logout().subscribe({
      next: () => this.finalizeLogout(),
      error: () => this.finalizeLogout()
    });
  }

  /**
   * Check if UI-safe session metadata exists
   */
  private hasSessionMetadata(): boolean {
    return !!localStorage.getItem(this.ROLE_KEY);
  }

  isMfaEnabled(): boolean {
    return localStorage.getItem(this.MFA_KEY) === 'true';
  }

  setMfaOtpCode(code: string): void {
    sessionStorage.setItem(this.MFA_OTP_KEY, code.trim());
  }

  getMfaOtpCode(): string | null {
    return sessionStorage.getItem(this.MFA_OTP_KEY);
  }

  private finalizeLogout(): void {
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.MFA_KEY);
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    sessionStorage.removeItem(this.MFA_OTP_KEY);
    this.loggedIn$.next(false);

    this.router.navigate(['/login']).catch(() => {
      window.location.href = '/login';
    });
  }
}
