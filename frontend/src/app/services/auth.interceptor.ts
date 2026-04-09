// HTTP Interceptor for JWT Token Injection and Error Handling
import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry, tap, timeout } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add JWT token to request if available
    const token = this.authService.getToken();
    if (token && this.isSecurableUrl(req.url)) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Add request timeout and retry logic
    return next.handle(req).pipe(
      timeout(environment.requestTimeout),
      retry({
        count: environment.retryAttempts,
        delay: (error, retryCount) => {
          // Only retry on specific error codes (5xx, timeout)
          if (retryCount < environment.retryAttempts && this.isRetryableError(error)) {
            return timer(environment.retryDelay * retryCount);
          }
          return throwError(() => error);
        }
      }),
      tap((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          // Log successful response in development
          if (!environment.production) {
            console.log('HTTP Response:', event.url, event.status);
          }
        }
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.status === 0) {
      // Network error
      errorMessage = 'Network error. Please check your connection.';
    } else if (error.status === 400) {
      errorMessage = error.error?.message || 'Invalid request';
    } else if (error.status === 401) {
      errorMessage = 'Unauthorized. Please login again.';
      this.authService.logout(); // Clear session on 401
    } else if (error.status === 403) {
      errorMessage = 'Access forbidden. You do not have permission.';
    } else if (error.status === 404) {
      errorMessage = error.error?.message || 'Resource not found';
    } else if (error.status === 500) {
      errorMessage = 'Server error. Please try again later.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }

    // Show toast notification for errors
    this.toastService.showError(errorMessage);

    // Log error in development
    if (!environment.production) {
      console.error('HTTP Error:', error);
    }

    return throwError(() => error);
  }

  private isSecurableUrl(url: string): boolean {
    // Don't add token to login/register endpoints
    return !url.includes('/api/auth/login') && !url.includes('/api/auth/register');
  }

  private isRetryableError(error: any): boolean {
    if (!(error instanceof HttpErrorResponse)) return false;
    // Retry on timeout (0) or 5xx errors, but not on 4xx
    return error.status === 0 || error.status >= 500;
  }
}
