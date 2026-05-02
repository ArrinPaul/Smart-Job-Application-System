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
    <div class="recruiter-page">
      <nav class="top-nav">
        <a routerLink="/post-job">Job Studio</a>
        <a routerLink="/recruiter/applications" class="active">Application Queue</a>
        <a routerLink="/messages">Messages</a>
        <span class="nav-spacer"></span>
        <button type="button" (click)="logout()">Logout</button>
      </nav>

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
    .recruiter-page { background: #f8fafc; min-height: 100vh; padding-bottom: 40px; }
    .page-header { background: white; padding: 40px 0; border-bottom: 1px solid #e2e8f0; margin-bottom: 30px; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    h1 { margin: 0; color: #1e293b; font-size: 2rem; }
    .page-header p { margin: 8px 0 0; color: #64748b; font-size: 1.1rem; }
    
    .pipeline-nav-panel { margin-bottom: 25px; }
    .tabs-nav { display: flex; gap: 5px; background: #e2e8f0; padding: 5px; border-radius: 14px; width: fit-content; }
    .tab-link { padding: 10px 24px; border-radius: 10px; text-decoration: none; color: #64748b; font-weight: 700; transition: all 0.2s; font-size: 0.9rem; }
    .tab-link.active { background: white; color: #1e293b; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }

    .filter-bar { background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .search-box input { width: 100%; max-width: 400px; padding: 10px 15px; border: 1px solid #e2e8f0; border-radius: 6px; outline: none; }
    .search-box input:focus { border-color: #3b82f6; }

    .table-container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { background: #f8fafc; padding: 15px 20px; font-size: 0.8rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; }
    td { padding: 18px 20px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #fdfdfd; }

    .user-info { display: flex; align-items: center; gap: 12px; }
    .avatar { width: 40px; height: 40px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #475569; }
    .name { font-weight: 700; color: #1e293b; display: block; }
    .email { font-size: 0.8rem; color: #64748b; }

    .job-title { font-weight: 700; color: #1e293b; }
    .job-meta { font-size: 0.8rem; color: #64748b; }

    .score-pill { display: inline-block; padding: 6px 12px; border-radius: 20px; color: white; font-size: 0.8rem; font-weight: 800; }
    
    .status-badge { padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
    .status-badge[data-status="APPLIED"] { background: #eff6ff; color: #1e40af; }
    .status-badge[data-status="SHORTLISTED"] { background: #f0fdf4; color: #166534; }
    .status-badge[data-status="PHONE_SCREEN"] { background: #fdf2f8; color: #9d174d; }
    .status-badge[data-status="TECHNICAL_INTERVIEW"] { background: #f5f3ff; color: #5b21b6; }
    .status-badge[data-status="ON_SITE_INTERVIEW"] { background: #ecfeff; color: #155e75; }
    .status-badge[data-status="OFFER_EXTENDED"] { background: #fff7ed; color: #9a3412; }
    .status-badge[data-status="REJECTED"] { background: #fef2f2; color: #991b1b; }
    .status-badge[data-status="HIRED"] { background: #ecfdf5; color: #065f46; border: 1px solid #10b981; }
    .status-badge[data-status="HOLD"] { background: #f8fafc; color: #475569; border: 1px dashed #cbd5e1; }

    .btn-review-action { padding: 10px 18px; background: #1e293b; color: white !important; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 800; cursor: pointer; transition: all 0.2s; }
    .btn-review-action:hover { background: #0f172a; transform: translateY(-1px); }

    .state-box { text-align: center; padding: 80px 0; color: #64748b; }
    .empty-icon { font-size: 4rem; margin-bottom: 20px; opacity: 0.3; }
    .spinner { width: 40px; height: 40px; border: 4px solid #f1f5f9; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .top-nav { height: 64px; background: white; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; padding: 0 40px; gap: 5px; position: sticky; top: 0; z-index: 1000; }
    .top-nav a { height: 100%; display: flex; align-items: center; padding: 0 20px; text-decoration: none; color: #64748b; font-weight: 700; border-bottom: 3px solid transparent; transition: all 0.2s; }
    .top-nav a:hover { color: #1e293b; }
    .top-nav a.active { color: #ff6b35; border-bottom-color: #ff6b35; }
    .nav-spacer { flex: 1; }
    .top-nav button { padding: 8px 16px; border: 1.5px solid #e2e8f0; border-radius: 8px; background: white; color: #1e293b; font-weight: 700; cursor: pointer; }
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
  currentStage = 'applied'; // applied, shortlisted, interviews, offers, hired
  private destroy$ = new Subject<void>();

  constructor() {}

  ngOnInit(): void {
    this.route.url.subscribe(() => {
      const path = this.router.url.split('/').pop() || 'applied';
      this.currentStage = ['applied', 'shortlisted', 'interviews', 'offers', 'hired'].includes(path) ? path : 'applied';
      this.loadApplications();
    });
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
          this.applications = apps;
          this.applyStageFilter();
        },
        error: () => this.toastService.showError('Failed to load applications')
      });
  }

  applyStageFilter(): void {
    switch (this.currentStage) {
      case 'shortlisted':
        this.filteredApplications = this.applications.filter(app => app.status === ApplicationStatus.SHORTLISTED);
        break;
      case 'interviews':
        this.filteredApplications = this.applications.filter(app => 
          [ApplicationStatus.PHONE_SCREEN, ApplicationStatus.TECHNICAL_INTERVIEW, ApplicationStatus.ON_SITE_INTERVIEW].includes(app.status)
        );
        break;
      case 'offers':
        this.filteredApplications = this.applications.filter(app => app.status === ApplicationStatus.OFFER_EXTENDED);
        break;
      case 'hired':
        this.filteredApplications = this.applications.filter(app => app.status === ApplicationStatus.HIRED);
        break;
      case 'applied':
      default:
        this.filteredApplications = this.applications.filter(app => app.status === ApplicationStatus.APPLIED);
        break;
    }
  }

  filterApps(event: any): void {
    const term = event.target.value.toLowerCase();
    this.applyStageFilter();
    this.filteredApplications = this.filteredApplications.filter(app => 
      app.applicant.fullName?.toLowerCase().includes(term) ||
      app.applicant.username.toLowerCase().includes(term) ||
      app.job.title.toLowerCase().includes(term)
    );
  }

  getCount(stage: string): number {
    if (!this.applications.length) return 0;
    
    switch (stage) {
      case 'shortlisted':
        return this.applications.filter(app => app.status === ApplicationStatus.SHORTLISTED).length;
      case 'interviews':
        return this.applications.filter(app => 
          [ApplicationStatus.PHONE_SCREEN, ApplicationStatus.TECHNICAL_INTERVIEW, ApplicationStatus.ON_SITE_INTERVIEW].includes(app.status)
        ).length;
      case 'offers':
        return this.applications.filter(app => app.status === ApplicationStatus.OFFER_EXTENDED).length;
      case 'hired':
        return this.applications.filter(app => app.status === ApplicationStatus.HIRED).length;
      case 'applied':
      default:
        return this.applications.filter(app => app.status === ApplicationStatus.APPLIED).length;
    }
  }

  getScoreColor(score?: number): string {
    if (!score) return '#94a3b8';
    if (score >= 80) return '#10b981';
    if (score >= 50) return '#3b82f6';
    return '#f59e0b';
  }

  getStatusLabel(status: string): string {
    return status.replace(/_/g, ' ');
  }
}
