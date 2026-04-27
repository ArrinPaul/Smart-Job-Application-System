import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpService } from '../services/http.service';
import { AdminSystemStatus } from '../models/admin.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-admin-system',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-system.component.html',
  styleUrl: './admin-system.component.css'
})
export class AdminSystemComponent implements OnInit, OnDestroy {
  status: AdminSystemStatus | null = null;
  isLoading = false;

  private destroy$ = new Subject<void>();

  constructor(private httpService: HttpService) {}

  ngOnInit(): void {
    this.loadSystemStatus();
  }

  loadSystemStatus(): void {
    this.isLoading = true;
    this.httpService.getAdminSystemStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: AdminSystemStatus) => {
          this.status = response;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  get healthDetailsEntries(): Array<{ key: string; value: unknown }> {
    if (!this.status?.healthDetails) {
      return [];
    }

    return Object.entries(this.status.healthDetails).map(([key, value]) => ({ key, value }));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
