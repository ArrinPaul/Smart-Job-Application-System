// Toast/Notification Display Component
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../services/toast.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of toasts"
        [class]="'toast toast-' + toast.type"
      >
        <div class="toast-content">
          <span class="toast-message">{{ toast.message }}</span>
          <button (click)="dismissToast(toast.id)" class="toast-close">&times;</button>
        </div>
        <div class="toast-progress" [style.animation-duration.ms]="toast.duration"></div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 18px;
      right: 18px;
      z-index: 9999;
      pointer-events: none;
    }

    .toast {
      margin-bottom: 12px;
      padding: 16px;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.55);
      box-shadow: 0 14px 24px rgba(56, 39, 20, 0.2);
      animation: slideIn 0.3s ease-in-out;
      pointer-events: auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-width: 300px;
      max-width: 500px;
      position: relative;
      overflow: hidden;
    }

    .toast-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      gap: 12px;
    }

    .toast-message {
      flex: 1;
      font-size: 14px;
      font-weight: 600;
      line-height: 1.45;
    }

    .toast-close {
      background: none;
      border: none;
      color: currentColor;
      cursor: pointer;
      font-size: 22px;
      padding: 0;
      opacity: 0.75;
      transition: opacity 0.2s;
      box-shadow: none;
    }

    .toast-close:hover {
      opacity: 1;
    }

    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 4px;
      background: currentColor;
      border-radius: 0 0 14px 0;
      animation: progress linear forwards;
    }

    .toast-success {
      background-color: #ecf7ef;
      color: #1b5f3c;
      border-left: 4px solid #287548;
    }

    .toast-error {
      background-color: #ffebe8;
      color: #7a251c;
      border-left: 4px solid #b83629;
    }

    .toast-warning {
      background-color: #fff4df;
      color: #7a5a20;
      border-left: 4px solid #c4831e;
    }

    .toast-info {
      background-color: #e6f4f6;
      color: #165967;
      border-left: 4px solid #17768a;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes progress {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private destroy$ = new Subject<void>();

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.getToasts()
      .pipe(takeUntil(this.destroy$))
      .subscribe(toasts => {
        this.toasts = toasts;
      });
  }

  dismissToast(id: string): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
