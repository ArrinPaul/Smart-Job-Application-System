import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpService } from '../services/http.service';
import { ToastService } from '../services/toast.service';
import { Application, ApplicationStatus } from '../models/job.model';
import { Subject, takeUntil, finalize, interval, switchMap, startWith, of, Subscription, forkJoin } from 'rxjs';
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

  private pollingSub?: Subscription;

  ngOnInit(): void {
    // React to URL changes (stage switching)
    this.route.url.pipe(takeUntil(this.destroy$)).subscribe(segments => {
      const path = segments.length > 0 ? segments[segments.length - 1].path : 'applied';
      const validStages = [
        'applied', 'shortlisted', 'phone_screen', 'technical_interview', 
        'on_site_interview', 'offer_extended', 'hired', 'rejected', 'hold'
      ];
      this.currentStage = validStages.includes(path) ? path : 'applied';
      
      // Start/Restart polling when stage changes
      this.startPolling();
    });
  }

  startPolling(): void {
    // Clear previous polling subscription if it exists
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }

    // Poll stats and applications every 5 seconds
    this.pollingSub = interval(5000)
      .pipe(
        startWith(0),
        switchMap(() => {
          if (document.visibilityState !== 'visible') {
            return of(null);
          }
          // Fetch both stats and stage-specific applications in parallel
          return forkJoin({
            stats: this.httpService.getRecruiterApplicationStats(),
            apps: this.httpService.getRecruiterApplications(this.currentStage)
          });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (result) => {
          if (!result) return;

          this.stats = result.stats || {};
          this.loadingStats = false;

          if (JSON.stringify(this.applications) !== JSON.stringify(result.apps)) {
            this.applications = result.apps || [];
            this.applyStageFilter();
          }
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.loadingStats = false;
        }
      });
  }

  quickReject(app: Application): void {
    if (!confirm(`Are you sure you want to reject ${app.applicant.fullName || app.applicant.username}?`)) return;

    this.httpService.updateApplicationStatus(app.id, 'REJECTED')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.showSuccess('Application rejected');
          // Polling will handle the refresh
        },
        error: () => this.toastService.showError('Failed to reject application')
      });
  }

  applyStageFilter(): void {
    this.filteredApplications = [...this.applications];
  }

  getCount(stage: string): number {
    if (this.loadingStats) return 0;
    
    switch (stage) {
      case 'shortlisted':
        return this.stats['SHORTLISTED'] || 0;
      case 'phone_screen':
        return this.stats['PHONE_SCREEN'] || 0;
      case 'technical_interview':
        return this.stats['TECHNICAL_INTERVIEW'] || 0;
      case 'on_site_interview':
        return this.stats['ON_SITE_INTERVIEW'] || 0;
      case 'offer_extended':
        return this.stats['OFFER_EXTENDED'] || 0;
      case 'hired':
        return this.stats['HIRED'] || 0;
      case 'rejected':
        return this.stats['REJECTED'] || 0;
      case 'hold':
        return this.stats['HOLD'] || 0;
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
