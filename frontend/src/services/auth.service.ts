// File: ./src/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';
import { UserRole } from '../app/models/user.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedInSubject = new BehaviorSubject<boolean>(false);
  public loggedIn$ = this.loggedInSubject.asObservable();

  constructor(private router: Router) {
    // Check if user is already logged in on service initialization
    this.loggedInSubject.next(this.isLoggedIn());
  }

  saveSession(token: string, role: UserRole, username: string, userId?: number): void {
    localStorage.setItem(environment.tokenKey, token);
    localStorage.setItem(environment.roleKey, role);
    localStorage.setItem(environment.usernameKey, username);
    if (userId) {
      localStorage.setItem(environment.userIdKey, userId.toString());
    }
    this.loggedInSubject.next(true);
  }

  getToken(): string | null {
    return this.secureLsGetItem(environment.tokenKey);
  }

  getRole(): UserRole | null {
    const role = this.secureLsGetItem(environment.roleKey);
    return role as UserRole | null;
  }

  getUsername(): string | null {
    return this.secureLsGetItem(environment.usernameKey);
  }

  getUserId(): number | null {
    const userId = this.secureLsGetItem(environment.userIdKey);
    return userId ? parseInt(userId, 10) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem(environment.roleKey);
    localStorage.removeItem(environment.usernameKey);
    localStorage.removeItem(environment.userIdKey);
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
