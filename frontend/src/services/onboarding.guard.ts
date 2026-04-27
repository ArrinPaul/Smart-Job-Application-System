// Onboarding Guard - ensures users only see onboarding once
import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class OnboardingGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Check if user is logged in
    if (!this.authService.isLoggedIn()) {
      // Not logged in, redirect to login
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Check if onboarding is already completed
    if (this.authService.isOnboardingCompleted()) {
      // Already completed, navigate to home
      const role = this.authService.getRole();
      if (role === 'RECRUITER') {
        this.router.navigate(['/post-job']);
      } else if (role === 'JOB_APPLICANT') {
        this.router.navigate(['/job-list']);
      } else {
        this.router.navigate(['/']);
      }
      return false;
    }

    // User is logged in and hasn't completed onboarding yet
    return true;
  }
}
