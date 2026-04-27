import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpService } from '../../services/http.service';
import { JobRecommendation } from '../../models/recommendation.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-recommendation-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './recommendation-widget.component.html',
  styleUrls: ['./recommendation-widget.component.css']
})
export class RecommendationWidgetComponent implements OnInit, OnDestroy {
  recommendations: JobRecommendation[] = [];
  loading = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(private httpService: HttpService) {}

  ngOnInit(): void {
    this.loadRecommendations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRecommendations(): void {
    this.loading = true;
    this.error = null;

    this.httpService.getJobRecommendations(5)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.recommendations = data.slice(0, 5);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading recommendations:', err);
          this.error = 'Failed to load recommendations';
          this.loading = false;
        }
      });
  }

  getMatchColor(percentage: number): string {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#f59e0b';
    return '#ef4444';
  }

  formatSalary(amount: number | null): string {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}
