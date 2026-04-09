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
      background: rgba(0, 0, 0, 0.4);
      z-index: 9000;
    }

    .spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .spinner-circle {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: spin 1s linear infinite;
    }

    .spinner-message {
      color: #fff;
      font-size: 16px;
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
