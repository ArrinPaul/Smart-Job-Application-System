// Loading Spinner Component
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isLoading" class="spinner-overlay">
      <div class="spinner">
        <div class="spinner-circle"></div>
        <p *ngIf="message" class="spinner-message">{{ message }}</p>
      </div>
    </div>
  `,
  styles: [`
    .spinner-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      background:
        radial-gradient(circle at center, rgba(255, 252, 247, 0.36), rgba(45, 34, 26, 0.72));
      z-index: 9000;
      backdrop-filter: blur(2px);
    }

    .spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 18px;
      padding: 26px 28px;
      border-radius: 18px;
      border: 1px solid rgba(255, 255, 255, 0.35);
      background: rgba(33, 28, 23, 0.7);
      box-shadow: 0 16px 28px rgba(0, 0, 0, 0.24);
    }

    .spinner-circle {
      width: 54px;
      height: 54px;
      border: 4px solid rgba(255, 255, 255, 0.28);
      border-radius: 50%;
      border-top-color: #f3b56f;
      border-right-color: #bb3e2d;
      animation: spin 0.9s linear infinite;
    }

    .spinner-message {
      color: #fff3e3;
      font-size: 15px;
      font-weight: 600;
      margin: 0;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `]
})
export class SpinnerComponent {
  @Input() isLoading = false;
  @Input() message = '';
}
