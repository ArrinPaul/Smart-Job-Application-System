// File: ./src/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  TOKEN_KEY = 'token';
  ROLE_KEY = 'role';
  USERNAME_KEY = 'username';

  constructor(private router: Router) {}

  saveSession(token: string, role: string, username: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.ROLE_KEY, role);
    localStorage.setItem(this.USERNAME_KEY, username);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRole(): string | null {
    return localStorage.getItem(this.ROLE_KEY);
  }

  getUsername(): string | null {
    return localStorage.getItem(this.USERNAME_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.USERNAME_KEY);
    this.router.navigate(['/login']);
  }

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }

  isRecruiter(): boolean {
    return this.getRole() === 'RECRUITER';
  }

  isJobSeeker(): boolean {
    return this.getRole() === 'JOB_SEEKER';
  }
}
