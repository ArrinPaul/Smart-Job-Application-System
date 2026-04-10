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
    let errorMessage = 'An unexpected error occurred';
    let errorType = 'error';

    console.error('[HTTP Error]', error.status, error);

    // Extract error from backend response (structured format)
    if (error.error && typeof error.error === 'object') {
      errorMessage = error.error.message || error.error.error || errorMessage;
    }

    // Handle specific HTTP status codes
    switch (error.status) {
      case 0:
        // Network error / timeout
        errorMessage = '⚠️ Network error - unable to connect to server. Please check your connection.';
        errorType = 'error';
        break;

      case 400:
        // Bad request
        errorMessage = error.error?.message || '❌ Invalid input - please check your data and try again';
        errorType = 'warning';
        break;

      case 401:
        // Unauthorized
        errorMessage = error.error?.message || '🔐 Session expired - please login again';
        errorType = 'error';
        this.authService.logout(); // Clear session on 401
        break;

      case 403:
        // Forbidden
        errorMessage = error.error?.message || '🚫 Access denied - you do not have permission to perform this action';
        errorType = 'error';
        break;

      case 404:
        // Not found
        errorMessage = error.error?.message || '🔍 Resource not found';
        errorType = 'warning';
        break;

      case 409:
        // Conflict (e.g., duplicate email)
        errorMessage = error.error?.message || '⚠️ This resource already exists';
        errorType = 'warning';
        break;

      case 422:
        // Unprocessable entity
        errorMessage = error.error?.message || '⚠️ Unable to process your request - please check the data';
        errorType = 'warning';
        break;

      case 500:
        // Server error
        errorMessage = '❌ Server error - our team is working on it. Please try again later.';
        errorType = 'error';
        break;

      case 502:
      case 503:
      case 504:
        // Gateway errors
        errorMessage = '⚠️ Server is temporarily unavailable. Please try again in a few moments.';
        errorType = 'error';
        break;

      default:
        if (error.status >= 500) {
          errorMessage = '❌ Server error - please try again later.';
          errorType = 'error';
        } else if (error.status >= 400) {
          errorMessage = error.error?.message || '❌ Request failed - please check and try again';
          errorType = 'warning';
        }
    }

    // Show appropriate toast notification based on error type
    if (errorType === 'error') {
      this.toastService.showError(errorMessage);
    } else if (errorType === 'warning') {
      this.toastService.showWarning(errorMessage);
    }

    // Log detailed error in development
    if (!environment.production) {
      console.error('[Detailed Error]', {
        status: error.status,
        statusText: error.statusText,
        message: errorMessage,
        body: error.error,
        url: error.url
      });
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
