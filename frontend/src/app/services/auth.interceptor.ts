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
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.isApiUrl(req.url)) {
      const setHeaders: Record<string, string> = {};
      const token = this.authService.getToken();

      if (token) {
        setHeaders['Authorization'] = `Bearer ${token}`;
      }

      if (this.authService.isMfaEnabled() && this.isSensitiveMethod(req.method)) {
        const otpCode = this.authService.getMfaOtpCode();
        if (otpCode) {
          setHeaders['X-OTP-Code'] = otpCode;
        }
      }

      req = req.clone({
        withCredentials: true,
        setHeaders
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
    let errorMessage = 'An unexpected error occurred';
    let errorType = 'error';

    // Log the error to console
    if (!environment.production) {
      console.error(`[HTTP ${error.status}] ${error.url}`, error);
    }

    // Extract error from backend response (structured format)
    if (error.error) {
      if (typeof error.error === 'object') {
        errorMessage = error.error.message || error.error.error || errorMessage;
      } else if (typeof error.error === 'string' && error.error.length < 200) {
        errorMessage = error.error;
      }
    }

    // Handle specific HTTP status codes
    switch (error.status) {
      case 0:
        errorMessage = 'Network error - unable to connect to server. Please check your connection.';
        errorType = 'error';
        break;

      case 400:
        errorMessage = errorMessage !== 'An unexpected error occurred' ? errorMessage : 'Invalid request - please check your input.';
        errorType = 'warning';
        break;

      case 401:
        if (error.url?.includes('/auth/login')) {
          errorMessage = errorMessage !== 'An unexpected error occurred' ? errorMessage : 'Invalid credentials or email not verified';
        } else if (error.error?.error === 'MFA Required') {
          errorMessage = 'Multi-factor authentication required for this action.';
          // Do NOT logout for MFA required
        } else {
          errorMessage = 'Session expired or authentication failed - please login again';
          // Only logout if it's not an MFA requirement and not a login attempt
          console.warn('[AuthInterceptor] 401 Unauthorized - logging out', error.url);
          this.authService.logout();
        }
        errorType = 'error';
        break;

      case 403:
        errorMessage = 'Access denied - you do not have permission for this action.';
        errorType = 'error';
        // Safety redirect: if access is denied, send user to their respective dashboard
        const role = this.authService.getRole();
        if (role === 'RECRUITER') {
          this.router.navigate(['/post-job']);
        } else if (role === 'JOB_SEEKER') {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/']);
        }
        break;

      case 404:
        errorMessage = `Resource not found: ${error.url ? new URL(error.url).pathname : 'unknown'}`;
        errorType = 'warning';
        break;

      case 429:
        errorMessage = 'Too many requests - please slow down and try again later.';
        errorType = 'warning';
        break;

      case 500:
        errorMessage = 'Internal server error - something went wrong on our end. We are investigating.';
        if (!environment.production && error.error?.message) {
          errorMessage += ` (${error.error.message})`;
        }
        errorType = 'error';
        break;

      case 503:
        errorMessage = 'Service unavailable - the server is temporarily down for maintenance.';
        errorType = 'error';
        break;

      default:
        if (error.status >= 500) {
          errorMessage = 'Server error - please try again later.';
        } else if (error.status >= 400) {
          errorMessage = errorMessage !== 'An unexpected error occurred' ? errorMessage : 'Request failed - please check and try again.';
          errorType = 'warning';
        }
    }

    // Show appropriate toast notification
    if (errorType === 'error') {
      this.toastService.showError(errorMessage);
    } else {
      this.toastService.showWarning(errorMessage);
    }

    // Log detailed error in development
    if (!environment.production) {
      console.group(`Detailed Error: ${error.status} ${error.statusText}`);
      console.error('URL:', error.url);
      console.error('Message:', errorMessage);
      console.error('Raw Error:', error);
      if (error.error) console.error('Error Body:', error.error);
      console.groupEnd();
    }

    return throwError(() => error);
  }

  private isApiUrl(url: string): boolean {
    return url.includes('/api/');
  }

  private isRetryableError(error: any): boolean {
    if (!(error instanceof HttpErrorResponse)) return false;
    // Retry on timeout (0) or 5xx errors, but not on 4xx
    return error.status === 0 || error.status >= 500;
  }

  private isSensitiveMethod(method: string): boolean {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
  }
}
