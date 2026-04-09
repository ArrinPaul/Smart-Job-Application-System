// Toast/Notification Service for user feedback
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts$ = new BehaviorSubject<Toast[]>([]);
  private nextId = 0;

  getToasts(): Observable<Toast[]> {
    return this.toasts$.asObservable();
  }

  showSuccess(message: string, duration: number = 3000): void {
    this.show(message, 'success', duration);
  }

  showError(message: string, duration: number = 5000): void {
    this.show(message, 'error', duration);
  }

  showWarning(message: string, duration: number = 4000): void {
    this.show(message, 'warning', duration);
  }

  showInfo(message: string, duration: number = 3000): void {
    this.show(message, 'info', duration);
  }

  private show(message: string, type: 'success' | 'error' | 'warning' | 'info', duration: number): void {
    const id = `toast-${this.nextId++}`;
    const toast: Toast = { id, message, type, duration };

    const currentToasts = this.toasts$.value;
    this.toasts$.next([...currentToasts, toast]);

    // Auto-dismiss after duration
    setTimeout(() => this.dismiss(id), duration);
  }

  private dismiss(id: string): void {
    const currentToasts = this.toasts$.value;
    this.toasts$.next(currentToasts.filter(t => t.id !== id));
  }

  dismissAll(): void {
    this.toasts$.next([]);
  }
}
