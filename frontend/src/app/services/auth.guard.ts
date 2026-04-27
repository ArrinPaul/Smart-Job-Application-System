// Route Guard for protecting authenticated routes
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
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (this.authService.isLoggedIn()) {
      // Check onboarding (except for the onboarding page itself)
      if (!this.authService.isOnboardingCompleted() && 
          !state.url.startsWith('/onboarding') && 
          !this.authService.isAdmin()) {
        this.router.navigate(['/onboarding']);
        return false;
      }
      return true;
    }

    // Not logged in, redirect to login
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const requiredRoles = route.data['roles'] as string[];
    const isLoggedIn = this.authService.isLoggedIn();
    const userRole = this.authService.getRole();
    const isOnboardingCompleted = this.authService.isOnboardingCompleted();

    console.log('[RoleGuard] Checking access:', {
      url: state.url,
      requiredRoles,
      userRole,
      isLoggedIn,
      isOnboardingCompleted
    });

    if (!isLoggedIn) {
      console.warn('[RoleGuard] Not logged in, redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }

    // Check onboarding
    if (!isOnboardingCompleted && !this.authService.isAdmin()) {
      console.warn('[RoleGuard] Onboarding incomplete, redirecting to onboarding');
      this.router.navigate(['/onboarding']);
      return false;
    }

    if (userRole && requiredRoles.includes(userRole)) {
      return true;
    }

    // User doesn't have required role - instead of landing, try to send them to THEIR dashboard
    console.error('[RoleGuard] Role mismatch. Required:', requiredRoles, 'Actual:', userRole);
    
    const normalizedRole = String(userRole).toUpperCase();
    if (normalizedRole === 'RECRUITER') {
      this.router.navigate(['/post-job']);
    } else if (normalizedRole === 'JOB_SEEKER') {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/']);
    }
    
    return false;
  }
}
