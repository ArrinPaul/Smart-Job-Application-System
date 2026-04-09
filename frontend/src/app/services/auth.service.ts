import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'jobportal_token';
  private readonly ROLE_KEY = 'jobportal_role';
  private readonly USER_KEY = 'jobportal_user';
  private loggedIn$ = new BehaviorSubject<boolean>(this.hasToken());

  constructor() {}

  /**
   * Save authentication session (token, role, user info)
   */
  saveSession(token: string, role: UserRole, username?: string, userId?: number): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.ROLE_KEY, role);
    if (username) localStorage.setItem('username', username);
    if (userId) localStorage.setItem('userId', String(userId));
    this.loggedIn$.next(true);
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.hasToken();
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
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    this.loggedIn$.next(false);
  }

  /**
   * Check if token exists
   */
  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }
}
