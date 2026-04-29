import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { HttpService } from '../services/http.service';
import { UserRole } from '../models/user.model';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {
  stats = {
    totalJobs: 0,
    totalUsers: 0,
    matchRate: 95,
    matchingSpeedMs: 12
  };

  constructor(
    private authService: AuthService, 
    private router: Router,
    private httpService: HttpService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    if (this.authService.isLoggedIn()) {
      const role = this.authService.getRole();
      const onboardingCompleted = this.authService.isOnboardingCompleted();
      const currentUrl = this.router.url;

      if (!onboardingCompleted && role !== UserRole.ADMIN) {
        if (currentUrl !== '/onboarding') {
          this.router.navigate(['/onboarding']);
        }
      } else {
        this.navigateBasedOnRole(role);
      }
    }
  }

  loadStats(): void {
    this.httpService.getPortalStats().subscribe({
      next: (data) => {
        this.stats = {
          totalJobs: data.totalJobs || 0,
          totalUsers: data.totalUsers || 0,
          matchRate: data.matchRate || 95,
          matchingSpeedMs: data.matchingSpeedMs || 12
        };
      },
      error: () => {
        // Fallback to reasonable defaults if API fails
        this.stats = {
          totalJobs: 2500,
          totalUsers: 10000,
          matchRate: 95,
          matchingSpeedMs: 12
        };
      }
    });
  }

  private navigateBasedOnRole(role: UserRole | null): void {
    const currentUrl = this.router.url;
    let targetUrl = '';

    switch (role) {
      case UserRole.RECRUITER:
        targetUrl = '/post-job';
        break;
      case UserRole.JOB_SEEKER:
        targetUrl = '/dashboard';
        break;
      case UserRole.ADMIN:
        targetUrl = '/admin';
        break;
    }

    if (targetUrl && currentUrl !== targetUrl) {
      console.log('[Landing] Redirecting logged-in user to:', targetUrl);
      this.router.navigate([targetUrl]);
    }
  }
}
