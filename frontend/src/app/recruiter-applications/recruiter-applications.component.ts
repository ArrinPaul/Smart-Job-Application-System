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
  template: `
    <div class="page-shell">
      <header class="page-header">
        <div class="container">
          <h1>Recruitment Pipeline</h1>
          <p>Track and manage candidates through each stage of the hiring process.</p>
        </div>
      </header>

      <main class="container">
        <div class="pipeline-nav-panel">
          <div class="tabs-nav">
            <a routerLink="/recruiter/applications/applied" routerLinkActive="active" class="tab-link">
              New ({{ getCount('applied') }})
            </a>
            <a routerLink="/recruiter/applications/shortlisted" routerLinkActive="active" class="tab-link">
              Shortlisted ({{ getCount('shortlisted') }})
            </a>
            <a routerLink="/recruiter/applications/interviews" routerLinkActive="active" class="tab-link">
              Interviews ({{ getCount('interviews') }})
            </a>
            <a routerLink="/recruiter/applications/offers" routerLinkActive="active" class="tab-link">
              Offers ({{ getCount('offers') }})
            </a>
            <a routerLink="/recruiter/applications/hired" routerLinkActive="active" class="tab-link">
              Hired ({{ getCount('hired') }})
            </a>
          </div>
        </div>

        <div class="filter-bar">
          <div class="search-box">
            <input type="text" placeholder="Search by name, job, or status..." (input)="filterApps($event)">
          </div>
        </div>

        <div class="table-container" *ngIf="!loading; else loadingTpl">
          <table *ngIf="filteredApplications.length > 0; else emptyTpl">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Job Position</th>
                <th>Applied Date</th>
                <th>AI Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let app of filteredApplications">
                <td>
                  <div class="user-info">
                    <div class="avatar">{{ app.applicant.fullName?.charAt(0) || app.applicant.username.charAt(0) }}</div>
                    <div>
                      <div class="name">{{ app.applicant.fullName || app.applicant.username }}</div>
                      <div class="email">{{ app.applicant.email }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="job-title">{{ app.job.title }}</div>
                  <div class="job-meta">{{ app.job.location }}</div>
                </td>
                <td>{{ app.appliedAt | date:'mediumDate' }}</td>
                <td>
                  <div class="score-pill" [style.background-color]="getScoreColor(app.aiMatchScore)">
                    {{ app.aiMatchScore ? (app.aiMatchScore + '%') : 'N/A' }}
                  </div>
                </td>
                <td>
                  <span class="status-badge" [attr.data-status]="app.status">
                    {{ getStatusLabel(app.status) }}
                  </span>
                </td>
                <td>
                  <button class="btn-review-action" [routerLink]="['/recruiter/applications', app.id]">
                    Manage Candidate
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #loadingTpl>
          <div class="state-box">
            <div class="spinner"></div>
            <p>Loading pipeline...</p>
          </div>
        </ng-template>

        <ng-template #emptyTpl>
          <div class="state-box">
            <div class="empty-icon">📂</div>
            <h3>No candidates in this stage</h3>
            <p>Select another stage or wait for new applications.</p>
          </div>
        </ng-template>
      </main>
    </div>
  `,
  styles: [`
    .recruiter-page { background: #f4efe6; min-height: 100vh; padding-bottom: 40px; }
    .page-header { background: #fffcf7; padding: 40px 0; border-bottom: 1px solid #d8c8ae; margin-bottom: 30px; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    h1 { margin: 0; color: #1f1d18; font-size: 2.2rem; font-family: 'Fraunces', serif; }
    .page-header p { margin: 8px 0 0; color: #655f51; font-size: 1.1rem; }
    
    .pipeline-nav-panel { margin-bottom: 25px; }
    .tabs-nav { display: flex; gap: 5px; background: #eee4d4; padding: 5px; border-radius: 14px; width: fit-content; }
    .tab-link { padding: 10px 24px; border-radius: 10px; text-decoration: none; color: white; font-weight: 800; transition: all 0.2s; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; background: var(--ink); border: 2px solid var(--ink); }
    .tab-link:hover { transform: translateY(-1px); background: #000; }
    .tab-link.active { background: var(--surface) !important; color: var(--brand) !important; border: 2px solid var(--brand) !important; box-shadow: 0 4px 10px rgba(187, 62, 45, 0.2); }

    .filter-bar { background: #fffcf7; padding: 15px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 6px rgba(56, 39, 20, 0.05); border: 1px solid #d8c8ae; }
    .search-box input { width: 100%; max-width: 400px; padding: 10px 15px; border: 1px solid #d8c8ae; border-radius: 8px; outline: none; background: #f8efdf; font-family: inherit; }
    .search-box input:focus { border-color: #bb3e2d; background: white; }

    .table-container { background: #fffcf7; border-radius: 16px; overflow: hidden; box-shadow: 0 16px 28px rgba(56, 39, 20, 0.1); border: 1px solid #d8c8ae; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { background: #eee4d4; padding: 15px 20px; font-size: 0.75rem; font-weight: 800; color: #1f1d18; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #d8c8ae; }
    td { padding: 18px 20px; border-bottom: 1px solid rgba(216, 200, 174, 0.4); color: #1f1d18; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #fdfaf5; }

    .user-info { display: flex; align-items: center; gap: 12px; }
    .avatar { width: 40px; height: 40px; background: #bb3e2d; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; color: white; }
    .name { font-weight: 800; color: #1f1d18; display: block; }
    .email { font-size: 0.8rem; color: #655f51; }

    .job-title { font-weight: 800; color: #1f1d18; font-family: 'Fraunces', serif; }
    .job-meta { font-size: 0.8rem; color: #655f51; font-weight: 600; }

    .score-pill { display: inline-block; padding: 6px 12px; border-radius: 20px; color: white; font-size: 0.8rem; font-weight: 800; }
    
    .status-badge { padding: 6px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
    .status-badge[data-status="APPLIED"] { background: #ece2d5; color: #5d4e3f; }
    .status-badge[data-status="SHORTLISTED"] { background: #dbf1e3; color: #1e6742; border: 1px solid #b7e4c7; }
    .status-badge[data-status="PHONE_SCREEN"], 
    .status-badge[data-status="TECHNICAL_INTERVIEW"], 
    .status-badge[data-status="ON_SITE_INTERVIEW"] { background: rgba(13, 103, 116, 0.12); color: #0d6774; border: 1px solid rgba(13, 103, 116, 0.2); }
    .status-badge[data-status="OFFER_EXTENDED"] { background: rgba(187, 62, 45, 0.12); color: #bb3e2d; border: 1px solid rgba(187, 62, 45, 0.2); }
    .status-badge[data-status="REJECTED"] { background: #ffe4df; color: #9b251b; border: 1px solid #ffcccb; }
    .status-badge[data-status="HIRED"] { background: #dbf1e3; color: #1e6742; border: 1px solid #10b981; }
    .status-badge[data-status="HOLD"] { background: #f8efdf; color: #655f51; border: 1px dashed #d8c8ae; }

    .btn-review-action { padding: 10px 18px; background: var(--ink); color: white !important; border: 2px solid var(--ink); border-radius: 10px; font-size: 0.8rem; font-weight: 800; cursor: pointer; transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.05em; }
    .btn-review-action:hover { transform: translateY(-2px); background: #000; box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2); }

    .state-box { text-align: center; padding: 80px 0; color: #655f51; }
    .empty-icon { font-size: 4rem; margin-bottom: 20px; opacity: 0.3; }
    .spinner { width: 40px; height: 40px; border: 4px solid #eee4d4; border-top-color: #bb3e2d; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .top-nav { height: 64px; background: linear-gradient(110deg, #1d1a16, #2d2922); border-bottom: 1px solid #43392c; display: flex; align-items: center; padding: 0 40px; gap: 5px; position: sticky; top: 0; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .top-nav a { height: 100%; display: flex; align-items: center; padding: 0 20px; text-decoration: none; color: #f5e7d5; font-weight: 800; border-bottom: 3px solid transparent; transition: all 0.2s; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; }
    .top-nav a:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }
    .top-nav a.active { color: #fff; border-bottom: 0; background: linear-gradient(135deg, #bb3e2d, #962f21); margin: 8px; border-radius: 10px; height: calc(100% - 16px); }
    .nav-spacer { flex: 1; }
    .top-nav button { padding: 8px 16px; border: 1px solid #43392c; border-radius: 8px; background: transparent; color: #f5e7d5; font-weight: 800; cursor: pointer; font-size: 11px; text-transform: uppercase; }
    .top-nav button:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
  `]
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
}
