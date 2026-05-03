import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpService } from '../services/http.service';
import { ToastService } from '../services/toast.service';
import { Application, ApplicationStatus } from '../models/job.model';
import { Subject, takeUntil, finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-recruiter-applications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './recruiter-applications.component.html',
  styleUrls: ['./recruiter-applications.component.css']
})
export class RecruiterApplicationsComponent implements OnInit, OnDestroy {
  private httpService = inject(HttpService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  applications: Application[] = [];
  filteredApplications: Application[] = [];
  stats: Record<string, number> = {};
  loading = true;
  loadingStats = true;
  currentStage = 'applied'; 
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // 1. Load stats immediately to show counts
    this.loadStats();

    // 2. React to URL changes (stage switching)
    this.route.url.pipe(takeUntil(this.destroy$)).subscribe(segments => {
      const path = segments.length > 0 ? segments[segments.length - 1].path : 'applied';
      this.currentStage = ['applied', 'shortlisted', 'interviews', 'offers', 'hired'].includes(path) ? path : 'applied';
      
      // Load applications for this specific stage
      this.loadApplications();
    });
  }

  loadStats(): void {
    this.loadingStats = true;
    this.httpService.getRecruiterApplicationStats()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingStats = false)
      )
      .subscribe({
        next: (stats) => this.stats = stats || {},
        error: () => console.error('Failed to load pipeline stats')
      });
  }

  loadApplications(): void {
    this.loading = true;
    this.httpService.getRecruiterApplications(this.currentStage)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (apps) => {
          this.applications = apps || [];
          this.filteredApplications = [...this.applications];
        },
        error: () => this.toastService.showError('Failed to sync pipeline data')
      });
  }

  applyStageFilter(): void {
    // No longer needed as server handles filtering, but kept for search
    this.filteredApplications = [...this.applications];
  }

  getCount(stage: string): number {
    if (this.loadingStats) return 0;
    
    switch (stage) {
      case 'shortlisted':
        return this.stats['SHORTLISTED'] || 0;
      case 'interviews':
        return (this.stats['PHONE_SCREEN'] || 0) + (this.stats['TECHNICAL_INTERVIEW'] || 0) + (this.stats['ON_SITE_INTERVIEW'] || 0);
      case 'offers':
        return this.stats['OFFER_EXTENDED'] || 0;
      case 'hired':
        return this.stats['HIRED'] || 0;
      case 'applied':
      default:
        return this.stats['APPLIED'] || 0;
    }
  }

  getScoreColor(score?: number): string {
    if (!score) return '#d8c8ae';
    if (score >= 80) return '#1e6742';
    if (score >= 50) return '#0d6774';
    return '#bb3e2d';
  }

  getStatusLabel(status: string): string {
    return status.replace(/_/g, ' ');
  }

  filterApps(event: any): void {
    const query = (event.target.value || '').toLowerCase();
    this.applyStageFilter();
    if (query) {
      this.filteredApplications = this.filteredApplications.filter(app => 
        app.applicant.fullName?.toLowerCase().includes(query) ||
        app.applicant.username?.toLowerCase().includes(query) ||
        app.job.title.toLowerCase().includes(query)
      );
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
