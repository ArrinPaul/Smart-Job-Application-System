import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpService } from '../services/http.service';
import { ToastService } from '../services/toast.service';
import { Application, ApplicationStatus } from '../models/job.model';
import { Subject, takeUntil, finalize } from 'rxjs';

@Component({
  selector: 'app-applicant-review',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="review-page" *ngIf="application; else stateTpl">
      <nav class="top-nav">
        <a routerLink="/post-job">Job Studio</a>
        <a routerLink="/recruiter/applications" class="active">Application Queue</a>
        <a routerLink="/messages">Messages</a>
        <span class="nav-spacer"></span>
        <button type="button" (click)="logout()">Logout</button>
      </nav>

      <header class="review-header">
        <div class="container header-content">
          <div class="left">
            <button class="btn-back" routerLink="/recruiter/applications">← Back to List</button>
            <h1>Review Applicant</h1>
          </div>
          <div class="right status-actions">
            <span class="current-status" [attr.data-status]="application.status">
              Current Status: <strong>{{ application.status }}</strong>
            </span>
          </div>
        </div>
      </header>

      <main class="container main-layout">
        <!-- Sidebar: Applicant Profile Card -->
        <aside class="profile-sidebar">
          <div class="profile-card">
            <div class="profile-head">
              <div class="avatar-large">{{ application.applicant.fullName?.charAt(0) || application.applicant.username.charAt(0) }}</div>
              <h2>{{ application.applicant.fullName || application.applicant.username }}</h2>
              <p class="headline">{{ application.applicant.headline || 'Job Seeker' }}</p>
            </div>
            
            <div class="profile-info">
              <div class="info-item">
                <label>Email</label>
                <p>{{ application.applicant.email }}</p>
              </div>
              <div class="info-item">
                <label>Location</label>
                <p>{{ application.applicant.location || 'Not specified' }}</p>
              </div>
              <div class="info-item">
                <label>Skills</label>
                <div class="skills-tags">
                  <span *ngFor="let skill of getSkills()" class="skill-tag">{{ skill }}</span>
                </div>
              </div>
            </div>

            <div class="action-panel">
              <button class="btn-message" (click)="messageApplicant()">Message Candidate</button>
            </div>
          </div>

          <div class="score-card" *ngIf="application.aiMatchScore">
            <h3>AI Match Compatibility</h3>
            <div class="score-circle" [style.border-color]="getScoreColor(application.aiMatchScore)">
              <span class="score-num">{{ application.aiMatchScore }}%</span>
            </div>
            <p class="score-text">Based on job requirements and candidate profile.</p>
          </div>
        </aside>

        <!-- Main Content: Resume & Decisions -->
        <section class="review-content">
          <div class="card job-summary">
            <h3>Position applied for:</h3>
            <div class="job-ref">
              <strong>{{ application.job.title }}</strong>
              <span>{{ application.job.location }} · {{ application.job.jobType }}</span>
            </div>
          </div>

          <div class="card resume-viewer">
            <div class="card-header">
              <h3>Resume / CV</h3>
              <button class="btn-download" *ngIf="application.resume?.id" (click)="downloadResume()">
                Download PDF 📥
              </button>
            </div>
            
            <div class="resume-placeholder" *ngIf="application.resume; else noResumeTpl">
              <div class="resume-icon">📄</div>
              <p>Resume is attached to this application.</p>
              <p class="muted">Click download to view the full document.</p>
            </div>
            <ng-template #noResumeTpl>
              <div class="no-resume">
                <p>⚠️ No resume file was attached to this application.</p>
              </div>
            </ng-template>
          </div>

          <!-- Decision Bar -->
          <div class="card decision-card">
            <h3>Decision & Workflow</h3>
            <p>Update the application status as you move through the hiring process.</p>
            
            <div class="decision-buttons">
              <button class="btn-shortlist" 
                      [disabled]="application.status === 'SHORTLISTED'"
                      (click)="updateStatus('SHORTLISTED')">
                Shortlist Candidate
              </button>
              <button class="btn-hire" 
                      [disabled]="application.status === 'HIRED'"
                      (click)="updateStatus('HIRED')">
                Mark as Hired
              </button>
              <button class="btn-reject" 
                      [disabled]="application.status === 'REJECTED'"
                      (click)="updateStatus('REJECTED')">
                Reject Application
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>

    <ng-template #stateTpl>
      <div class="container state-container">
        <div class="spinner" *ngIf="loading"></div>
        <p *ngIf="loading">Loading application details...</p>
        <div class="error-box" *ngIf="error">
          <h3>Error</h3>
          <p>{{ error }}</p>
          <button class="btn-back" routerLink="/recruiter/applications">Back to Applications</button>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .review-page { background: #f8fafc; min-height: 100vh; padding-bottom: 60px; }
    .review-header { background: white; border-bottom: 1px solid #e2e8f0; padding: 25px 0; position: sticky; top: 0; z-index: 100; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    .header-content { display: flex; justify-content: space-between; align-items: center; }
    
    .btn-back { background: none; border: none; color: #64748b; cursor: pointer; font-weight: 500; margin-bottom: 5px; display: block; }
    h1 { margin: 0; font-size: 1.5rem; color: #1e293b; }

    .current-status { padding: 8px 16px; border-radius: 8px; font-size: 0.9rem; }
    .current-status[data-status="APPLIED"] { background: #dbeafe; color: #1e40af; }
    .current-status[data-status="SHORTLISTED"] { background: #dcfce7; color: #166534; }
    .current-status[data-status="REJECTED"] { background: #fee2e2; color: #991b1b; }
    .current-status[data-status="HIRED"] { background: #fef9c3; color: #854d0e; }

    .main-layout { display: grid; grid-template-columns: 350px 1fr; gap: 30px; margin-top: 30px; }

    .profile-card, .score-card, .card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; padding: 25px; margin-bottom: 20px; }
    
    .profile-head { text-align: center; margin-bottom: 25px; }
    .avatar-large { width: 80px; height: 80px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 700; color: #475569; margin: 0 auto 15px; }
    .profile-head h2 { margin: 0; font-size: 1.25rem; color: #1e293b; }
    .headline { margin: 5px 0 0; color: #64748b; font-size: 0.9rem; }

    .info-item { margin-bottom: 20px; }
    .info-item label { display: block; font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; font-weight: 700; margin-bottom: 5px; }
    .info-item p { margin: 0; color: #334155; font-weight: 500; }

    .skills-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 5px; }
    .skill-tag { background: #f1f5f9; color: #475569; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; }

    .btn-message { width: 100%; padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    
    .score-card { text-align: center; }
    .score-circle { width: 100px; height: 100px; border: 8px solid #eee; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 20px auto; }
    .score-num { font-size: 1.5rem; font-weight: 800; color: #1e293b; }
    .score-text { font-size: 0.8rem; color: #64748b; }

    .job-summary { background: #f1f5f9; border-left: 5px solid #3b82f6; }
    .job-ref { margin-top: 10px; display: flex; flex-direction: column; }
    .job-ref strong { font-size: 1.1rem; color: #1e293b; }
    .job-ref span { color: #64748b; font-size: 0.9rem; }

    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .btn-download { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600; }
    
    .resume-viewer { min-height: 200px; }
    .resume-placeholder { text-align: center; padding: 40px 0; background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 8px; }
    .resume-icon { font-size: 3rem; margin-bottom: 10px; }
    .no-resume { text-align: center; padding: 30px; color: #991b1b; }

    .decision-buttons { display: flex; gap: 15px; margin-top: 20px; }
    .decision-buttons button { flex: 1; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; transition: opacity 0.2s; }
    .decision-buttons button:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-shortlist { background: #10b981; color: white; }
    .btn-hire { background: #f59e0b; color: white; }
    .btn-reject { background: #ef4444; color: white; }

    .state-container { text-align: center; padding: 100px 0; }
    .spinner { width: 40px; height: 40px; border: 4px solid #f1f5f9; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ApplicantReviewComponent implements OnInit, OnDestroy {
  application: Application | null = null;
  loading = true;
  error = '';
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private httpService: HttpService,
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadApplication(id);
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadApplication(id: number): void {
    this.loading = true;
    // We need a way to get a single application. 
    // For now we'll filter from all recruiter applications.
    this.httpService.getRecruiterApplications()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (apps) => {
          this.application = apps.find(a => a.id === Number(id)) || null;
          if (!this.application) this.error = 'Application not found';
        },
        error: () => this.error = 'Failed to load application details'
      });
  }

  getSkills(): string[] {
    return this.application?.applicant.skills?.split(',').map(s => s.trim()) || [];
  }

  updateStatus(status: string): void {
    if (!this.application) return;

    this.httpService.updateApplicationStatus(this.application.id, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.application!.status = updated.status;
          this.toastService.showSuccess(`Application ${status.toLowerCase()} successfully`);
        },
        error: () => this.toastService.showError('Failed to update status')
      });
  }

  downloadResume(): void {
    if (!this.application?.resume?.id) return;
    
    this.httpService.downloadResume(this.application.resume.id)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Resume_${this.application?.applicant.fullName || 'Applicant'}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => this.toastService.showError('Failed to download resume')
      });
  }

  messageApplicant(): void {
    if (this.application?.applicant.id) {
      this.router.navigate(['/messages'], { 
        queryParams: { 
          userId: this.application.applicant.id,
          jobId: this.application.job.id
        } 
      });
    }
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 50) return '#3b82f6';
    return '#f59e0b';
  }
}
