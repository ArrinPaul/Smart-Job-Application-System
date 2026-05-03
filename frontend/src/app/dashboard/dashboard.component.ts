import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpService } from '../services/http.service';
import { AuthService } from '../services/auth.service';
import { ChatService } from '../services/chat.service';
import { TranslationService } from '../services/translation.service';
import { JobRecommendation } from '../models/recommendation.model';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  userName: string = 'User';
  profileCompletionPercent: number = 0;
  jobsViewed: number = 0;
  jobsApplied: number = 0;
  recommendations: JobRecommendation[] = [];
  loading = true;
  error: string | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private httpService: HttpService,
    private authService: AuthService,
    private chatService: ChatService,
    private translationService: TranslationService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openChat(event: Event): void {
    event.preventDefault();
    this.chatService.openChat();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    // Get user info
    const username = this.authService.getUsername();
    if (username) {
      this.userName = username;
    }

    // Load onboarding status for completion percentage
    this.httpService.getOnboardingStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (status) => {
          this.profileCompletionPercent = status.completionPercentage || 0;
        },
        error: () => {}
      });

    // Load recommendations and translate them
    this.httpService.getJobRecommendations(6)
      .pipe(
        takeUntil(this.destroy$),
        switchMap((data: JobRecommendation[]) => {
          if (!data || data.length === 0) return of([]);
          
          // Since JobRecommendation is not a Job object, we translate it manually or adapt
          return forkJoin(data.slice(0, 6).map(rec => 
            forkJoin({
              title: this.translationService.translateText(rec.jobTitle),
              company: this.translationService.translateText(rec.companyName),
              location: this.translationService.translateText(rec.location)
            }).pipe(
              map(trans => ({
                ...rec,
                jobTitle: trans.title,
                companyName: trans.company,
                location: trans.location
              }))
            )
          ));
        })
      )
      .subscribe({
        next: (translatedRecs) => {
          this.recommendations = translatedRecs;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading recommendations:', err);
          this.loading = false;
        }
      });

    // Load applications to get count
    this.httpService.getMyApplications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.jobsApplied = data.length;
        },
        error: () => {
          // Continue without error
        }
      });
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

  getProgressTrackColor(percent: number): string {
    if (percent >= 75) return '#10b981';
    if (percent >= 50) return '#f59e0b';
    return '#ef4444';
  }

  getMatchColor(percent: number): string {
    if (percent >= 80) return '#10b981'; // Green for high match
    if (percent >= 50) return '#f59e0b'; // Orange for medium match
    return '#ef4444'; // Red for low match
  }
}
