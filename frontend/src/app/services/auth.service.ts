import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { HttpService } from './http.service';
import { UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly SESSION_LAST_ACTIVITY_KEY = 'jobportal_session_last_activity';
  private readonly SESSION_EVENT_KEY = 'jobportal_session_event';
  private readonly SESSION_DURATION_MS = 4 * 60 * 60 * 1000;
  private readonly ROLE_KEY = 'jobportal_role';
  private readonly TOKEN_KEY = 'jobportal_token';
  private readonly MFA_KEY = 'jobportal_mfa_enabled';
  private readonly ONBOARDING_KEY = 'jobportal_onboarding_completed';
  private readonly MFA_OTP_KEY = 'jobportal_mfa_otp_code';
  private loggedIn$ = new BehaviorSubject<boolean>(this.hasSessionMetadata());

  get isLoggedIn$(): Observable<boolean> {
    return this.loggedIn$.asObservable();
  }

  constructor(
    private router: Router,
    private httpService: HttpService
  ) {}

  /**
   * Save authentication session metadata (token remains in HttpOnly cookie)
   */
  saveSession(role: UserRole, username?: string, userId?: number, mfaEnabled?: boolean, token?: string, onboardingCompleted?: boolean): void {
    localStorage.setItem(this.ROLE_KEY, role);
    if (username) localStorage.setItem('username', username);
    if (userId) localStorage.setItem('userId', String(userId));
    localStorage.setItem(this.MFA_KEY, String(!!mfaEnabled));
    localStorage.setItem(this.ONBOARDING_KEY, String(!!onboardingCompleted));
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
    } else {
      localStorage.removeItem(this.TOKEN_KEY);
    }
    this.touchSessionActivity();
    // Push true to notify all subscribers immediately
    this.loggedIn$.next(true);
  }

  isOnboardingCompleted(): boolean {
    return localStorage.getItem(this.ONBOARDING_KEY) === 'true';
  }

  setOnboardingCompleted(completed: boolean): void {
    localStorage.setItem(this.ONBOARDING_KEY, String(completed));
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.hasSessionMetadata() && !this.isSessionExpired();
  }

  touchSessionActivity(): void {
    localStorage.setItem(this.SESSION_LAST_ACTIVITY_KEY, String(Date.now()));
  }

  getSessionRemainingMs(): number {
    const lastActivityRaw = localStorage.getItem(this.SESSION_LAST_ACTIVITY_KEY);
    if (!lastActivityRaw) {
      return 0;
    }

    const lastActivity = Number(lastActivityRaw);
    if (Number.isNaN(lastActivity)) {
      return 0;
    }

    const elapsed = Date.now() - lastActivity;
    return Math.max(0, this.SESSION_DURATION_MS - elapsed);
  }

  isSessionExpired(): boolean {
    if (!this.hasSessionMetadata()) {
      return false;
    }
    return this.getSessionRemainingMs() <= 0;
  }

  broadcastSessionEvent(eventType: 'expired' | 'logout'): void {
    localStorage.setItem(this.SESSION_EVENT_KEY, JSON.stringify({ type: eventType, at: Date.now() }));
  }

  getSessionEventKey(): string {
    return this.SESSION_EVENT_KEY;
  }

  /**
   * Get JWT token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get user role
   */
  getRole(): UserRole | null {
    const role = localStorage.getItem(this.ROLE_KEY);
    if (!role) return null;
    
    // Normalize role string to match enum
    const normalizedRole = role.toUpperCase();
    if (Object.values(UserRole).includes(normalizedRole as UserRole)) {
      return normalizedRole as UserRole;
    }
    return null;
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
   * Check if user is Job Applicant
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
   * Logout and clear session. Returns a promise that resolves when navigation completes.
   */
  logout(): Promise<boolean> {
    // Fire-and-forget server-side logout (do not block UX)
    this.httpService.logout().subscribe({
      next: () => {},
      error: () => {}
    });

    return this.finalizeLogout();
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

  private finalizeLogout(): Promise<boolean> {
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.MFA_KEY);
    localStorage.removeItem(this.ONBOARDING_KEY);
    localStorage.removeItem(this.SESSION_LAST_ACTIVITY_KEY);
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    sessionStorage.removeItem(this.MFA_OTP_KEY);
    this.loggedIn$.next(false);

    // Return the router navigation promise so callers can await if desired.
    return this.router.navigate(['/login'], { replaceUrl: true }).then(() => true).catch(() => {
      // Fallback to full-page redirect if router navigation fails.
      try {
        window.location.href = '/login';
      } catch (e) {
        // ignore
      }
      return false;
    });
  }
}
