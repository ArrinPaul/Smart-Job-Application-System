import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpService } from '../services/http.service';
import { ToastService } from '../services/toast.service';
import { Application, ApplicationStatus } from '../models/job.model';
import { Subject, takeUntil, finalize, interval, switchMap, startWith, of, Subscription, forkJoin } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-applications.component.html',
  styleUrls: ['./my-applications.component.css']
})
export class MyApplicationsComponent implements OnInit, OnDestroy {
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
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const stage = params.get('stage');
      const validStages = [
        'applied', 'shortlisted', 'phone_screen', 'technical_interview',
        'on_site_interview', 'offer_extended', 'hired', 'rejected', 'hold'
      ];
      this.currentStage = stage && validStages.includes(stage) ? stage : 'applied';
      this.startPolling();
    });
  }

  startPolling(): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }

    this.pollingSub = interval(5000)
      .pipe(
        startWith(0),
        switchMap(() => {
          if (document.visibilityState !== 'visible') {
            return of(null);
          }
          return forkJoin({
            stats: this.httpService.getApplicationStats(),
            apps: this.httpService.getMyApplications(this.currentStage)
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

  getStatusLabel(status: string): string {
    return status.replace(/_/g, ' ');
  }

  filterApps(event: any): void {
    const query = (event.target.value || '').toLowerCase();
    this.applyStageFilter();
    if (query) {
      this.filteredApplications = this.filteredApplications.filter(app =>
        app.job.title.toLowerCase().includes(query)
      );
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
