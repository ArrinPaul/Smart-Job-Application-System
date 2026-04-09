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

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    const userRole = this.authService.getRole();
    if (userRole && requiredRoles.includes(userRole)) {
      return true;
    }

    // User doesn't have required role
    this.router.navigate(['/']);
    return false;
  }
}

// Extend AuthService with isAdmin method
(AuthService.prototype as any).isAdmin = function(this: AuthService): boolean {
  return this.getRole() === 'ADMIN';
};

(AuthService.prototype as any).isRecruiter = function(this: AuthService): boolean {
  return this.getRole() === 'RECRUITER';
};

(AuthService.prototype as any).isJobSeeker = function(this: AuthService): boolean {
  return this.getRole() === 'JOB_SEEKER';
};
