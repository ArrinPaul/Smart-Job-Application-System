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
  loading = true;
  currentStage = 'applied'; 
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // 1. Initial Load
    this.loadApplications();

    // 2. React to URL changes (stage switching)
    this.route.url.pipe(takeUntil(this.destroy$)).subscribe(segments => {
      // Use the last segment if it's one of our stages, otherwise default to 'applied'
      const path = segments.length > 0 ? segments[segments.length - 1].path : 'applied';
      this.currentStage = ['applied', 'shortlisted', 'interviews', 'offers', 'hired'].includes(path) ? path : 'applied';
      
      this.applyStageFilter();
    });
  }

  loadApplications(): void {
    this.loading = true;
    this.httpService.getRecruiterApplications()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (apps) => {
          this.applications = apps || [];
          this.applyStageFilter();
        },
        error: () => this.toastService.showError('Failed to sync pipeline data')
      });
  }

  applyStageFilter(): void {
    if (!this.applications) {
      this.filteredApplications = [];
      return;
    }
    
    const targetStage = this.currentStage.toUpperCase();
    
    this.filteredApplications = this.applications.filter(app => {
      const status = (app.status || '').toUpperCase();
      
      switch (targetStage) {
        case 'SHORTLISTED':
          return status === 'SHORTLISTED';
        case 'INTERVIEWS':
          return ['PHONE_SCREEN', 'TECHNICAL_INTERVIEW', 'ON_SITE_INTERVIEW'].includes(status);
        case 'OFFERS':
          return status === 'OFFER_EXTENDED';
        case 'HIRED':
          return status === 'HIRED';
        case 'APPLIED':
        default:
          return status === 'APPLIED';
      }
    });
  }

  getCount(stage: string): number {
    if (!this.applications) return 0;
    
    switch (stage) {
      case 'shortlisted':
        return this.applications.filter(app => (app.status || '').toUpperCase() === 'SHORTLISTED').length;
      case 'interviews':
        return this.applications.filter(app => ['PHONE_SCREEN', 'TECHNICAL_INTERVIEW', 'ON_SITE_INTERVIEW'].includes((app.status || '').toUpperCase())).length;
      case 'offers':
        return this.applications.filter(app => (app.status || '').toUpperCase() === 'OFFER_EXTENDED').length;
      case 'hired':
        return this.applications.filter(app => (app.status || '').toUpperCase() === 'HIRED').length;
      case 'applied':
      default:
        return this.applications.filter(app => (app.status || '').toUpperCase() === 'APPLIED').length;
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
