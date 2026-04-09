// File: ./src/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UserRole } from '../app/models/user.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'jobportal_token';
  private readonly ROLE_KEY = 'jobportal_role';
  private readonly USER_KEY = 'jobportal_user';
  private loggedInSubject = new BehaviorSubject<boolean>(false);
  public loggedIn$ = this.loggedInSubject.asObservable();

  constructor(private router: Router) {
    // Check if user is already logged in on service initialization
    this.loggedInSubject.next(this.isLoggedIn());
  }

  saveSession(token: string, role: UserRole, username?: string, userId?: number): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.ROLE_KEY, role);
    if (username) localStorage.setItem('username', username);
    if (userId) localStorage.setItem('userId', String(userId));
    this.loggedInSubject.next(true);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
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
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    this.loggedInSubject.next(false);
    this.router.navigate(['/login']);
  }

  isAdmin(): boolean {
    return this.getRole() === UserRole.ADMIN;
  }

  isRecruiter(): boolean {
    return this.getRole() === UserRole.RECRUITER;
  }

  isJobSeeker(): boolean {
    return this.getRole() === UserRole.JOB_SEEKER;
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
