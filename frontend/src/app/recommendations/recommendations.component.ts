import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpService } from '../services/http.service';
import { JobRecommendation } from '../models/recommendation.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './recommendations.component.html',
  styleUrls: ['./recommendations.component.css']
})
export class RecommendationsComponent implements OnInit, OnDestroy {
  recommendations: JobRecommendation[] = [];
  loading = true;
  error: string | null = null;
  selectedRecommendation: JobRecommendation | null = null;
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

    this.httpService.getJobRecommendations(20)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.recommendations = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading recommendations:', err);
          this.error = 'Failed to load job recommendations. Please try again later.';
          this.loading = false;
        }
      });
  }

  selectRecommendation(recommendation: JobRecommendation): void {
    this.selectedRecommendation = this.selectedRecommendation?.jobId === recommendation.jobId 
      ? null 
      : recommendation;
  }

  getMatchColor(percentage: number): string {
    if (percentage >= 80) return '#10b981'; // Green
    if (percentage >= 60) return '#f59e0b'; // Amber
    if (percentage >= 50) return '#ef4444'; // Red
    return '#6b7280'; // Gray
  }

  getMatchLabel(percentage: number): string {
    if (percentage >= 80) return 'Excellent Match';
    if (percentage >= 60) return 'Good Match';
    if (percentage >= 50) return 'Fair Match';
    return 'Low Match';
  }

  formatSalary(amount: number | null): string {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  }

  applyForJob(jobId: number, event: Event): void {
    event.stopPropagation();
    // Emit event or navigate to job details with apply action
    console.log('Apply for job:', jobId);
  }

  shareRecommendation(recommendation: JobRecommendation, event: Event): void {
    event.stopPropagation();
    const text = `Check out this job that matches my profile ${recommendation.matchPercentage}%: ${recommendation.jobTitle} at ${recommendation.companyName}`;
    
    if (navigator.share) {
      navigator.share({
        title: recommendation.jobTitle,
        text: text
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(text).then(() => {
        alert('Job details copied to clipboard!');
      });
    }
  }
}
