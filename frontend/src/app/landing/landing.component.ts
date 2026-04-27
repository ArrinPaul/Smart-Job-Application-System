import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
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
