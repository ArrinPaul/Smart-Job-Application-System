import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpService } from '../services/http.service';
import { ToastService } from '../services/toast.service';
import { Application, ApplicationStatus, UpdateApplicationDetailsRequest } from '../models/job.model';
import { Subject, takeUntil, finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-applicant-review',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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
            <div class="status-stepper">
               <div *ngFor="let step of statusFlow" 
                    class="step" 
                    [class.active]="application.status === step"
                    [class.completed]="isStepCompleted(step)">
                 <span class="step-label">{{ step.replace('_', ' ') }}</span>
               </div>
            </div>
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

          <div class="card workflow-card">
            <h3>Workflow Transitions</h3>
            <div class="transition-grid">
              <button *ngFor="let status of nextPossibleStatuses" 
                      class="btn-status"
                      [attr.data-status]="status"
                      (click)="updateStatus(status)">
                Move to {{ status.replace('_', ' ') }}
              </button>
            </div>
            <hr class="divider">
            <div class="danger-actions">
               <button class="btn-outline-danger" (click)="updateStatus(ApplicationStatus.REJECTED)">Reject Candidate</button>
               <button class="btn-outline-warning" (click)="updateStatus(ApplicationStatus.HOLD)">Place on Hold</button>
            </div>
          </div>
        </aside>

        <!-- Main Content: Management Panels -->
        <section class="review-content">
          <div class="tabs-nav">
             <button [class.active]="activeTab === 'profile'" (click)="activeTab = 'profile'">Profile & Resume</button>
             <button [class.active]="activeTab === 'notes'" (click)="activeTab = 'notes'">Internal Notes</button>
             <button [class.active]="activeTab === 'interview'" (click)="activeTab = 'interview'">Interview & Feedback</button>
          </div>

          <div class="tab-content">
            <!-- PROFILE TAB -->
            <div *ngIf="activeTab === 'profile'" class="animate-in">
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
            </div>

            <!-- NOTES TAB -->
            <div *ngIf="activeTab === 'notes'" class="animate-in">
              <div class="card">
                <h3>Internal Team Notes</h3>
                <p class="muted">These notes are private and never visible to the applicant.</p>
                <textarea 
                  [(ngModel)]="internalNotes" 
                  rows="12" 
                  class="styled-textarea" 
                  placeholder="Add details about background checks, initial thoughts, or team feedback..."></textarea>
                <div class="card-footer">
                  <button class="btn-primary" [disabled]="isSaving" (click)="saveDetails()">
                    {{ isSaving ? 'Saving...' : 'Save Notes' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- INTERVIEW TAB -->
            <div *ngIf="activeTab === 'interview'" class="animate-in">
              <div class="card interview-scheduler">
                <h3>Schedule Interview</h3>
                <div class="form-grid">
                  <div class="form-group">
                    <label>Date & Time</label>
                    <input type="datetime-local" [(ngModel)]="interviewDate" class="styled-input">
                  </div>
                  <div class="form-group">
                    <label>Location / Meeting Link</label>
                    <input type="text" [(ngModel)]="interviewLocation" class="styled-input" placeholder="e.g. Zoom Link or Office Room">
                  </div>
                </div>
              </div>

              <div class="card">
                <h3>Recruiter Feedback & Decision Rationale</h3>
                <textarea 
                  [(ngModel)]="recruiterFeedback" 
                  rows="6" 
                  class="styled-textarea" 
                  placeholder="Summarize the interview outcomes and why you've decided to move forward or reject..."></textarea>
                <div class="card-footer">
                   <button class="btn-primary" [disabled]="isSaving" (click)="saveDetails()">
                    {{ isSaving ? 'Saving...' : 'Update Interview Info' }}
                  </button>
                </div>
              </div>
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
    .review-page { background: #f4f7f6; min-height: 100vh; padding-bottom: 60px; }
    .review-header { background: white; border-bottom: 1px solid #e2e8f0; padding: 20px 0; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    .header-content { display: flex; justify-content: space-between; align-items: center; }
    
    .btn-back { background: none; border: none; color: #64748b; cursor: pointer; font-weight: 600; margin-bottom: 5px; display: block; font-size: 0.9rem; }
    h1 { margin: 0; font-size: 1.6rem; color: #1e293b; font-weight: 800; }

    /* Status Stepper */
    .status-stepper { display: flex; gap: 10px; }
    .step { padding: 6px 12px; background: #e2e8f0; border-radius: 20px; font-size: 0.75rem; font-weight: 700; color: #64748b; opacity: 0.6; transition: all 0.3s; text-transform: uppercase; letter-spacing: 0.5px; }
    .step.active { background: #3b82f6; color: white; opacity: 1; transform: scale(1.1); box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3); }
    .step.completed { background: #10b981; color: white; opacity: 0.9; }

    .main-layout { display: grid; grid-template-columns: 320px 1fr; gap: 30px; margin-top: 30px; }

    .profile-card, .score-card, .card, .workflow-card { background: white; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #edf2f7; padding: 25px; margin-bottom: 24px; }
    
    .profile-head { text-align: center; margin-bottom: 25px; }
    .avatar-large { width: 90px; height: 90px; background: #3b82f6; border-radius: 24px; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; font-weight: 800; color: white; margin: 0 auto 15px; box-shadow: 0 10px 20px rgba(59, 130, 246, 0.2); }
    .profile-head h2 { margin: 0; font-size: 1.3rem; color: #1e293b; }
    .headline { margin: 5px 0 0; color: #64748b; font-size: 0.9rem; font-weight: 500; }

    .info-item { margin-bottom: 20px; }
    .info-item label { display: block; font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 800; margin-bottom: 6px; letter-spacing: 0.5px; }
    .info-item p { margin: 0; color: #334155; font-weight: 600; font-size: 0.95rem; }

    .skills-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .skill-tag { background: #eff6ff; color: #3b82f6; padding: 4px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; }

    .btn-message { width: 100%; padding: 14px; background: #1e293b; color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
    .btn-message:hover { background: #0f172a; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
    
    .score-card { text-align: center; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); }
    .score-circle { width: 110px; height: 110px; border: 10px solid #eee; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 20px auto; transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .score-num { font-size: 1.8rem; font-weight: 900; color: #1e293b; }
    .score-text { font-size: 0.8rem; color: #64748b; font-weight: 500; line-height: 1.4; }

    .workflow-card h3 { margin-bottom: 15px; font-size: 1rem; }
    .transition-grid { display: flex; flex-direction: column; gap: 10px; }
    .btn-status { padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; color: #1e293b; font-weight: 700; font-size: 0.85rem; cursor: pointer; text-align: left; transition: all 0.2s; }
    .btn-status:hover { border-color: #3b82f6; background: #f0f7ff; color: #3b82f6; }
    .divider { margin: 20px 0; border: none; border-top: 1px solid #edf2f7; }
    .danger-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .btn-outline-danger { padding: 10px; border-radius: 8px; border: 1.5px solid #fee2e2; background: white; color: #ef4444; font-size: 0.75rem; font-weight: 800; cursor: pointer; }
    .btn-outline-warning { padding: 10px; border-radius: 8px; border: 1.5px solid #fef3c7; background: white; color: #d97706; font-size: 0.75rem; font-weight: 800; cursor: pointer; }

    /* Tabs */
    .tabs-nav { display: flex; gap: 5px; margin-bottom: 24px; background: #e2e8f0; padding: 5px; border-radius: 14px; width: fit-content; }
    .tabs-nav button { padding: 10px 24px; border-radius: 10px; border: none; background: transparent; color: #64748b; font-weight: 700; cursor: pointer; transition: all 0.2s; font-size: 0.9rem; }
    .tabs-nav button.active { background: white; color: #1e293b; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }

    .job-summary { background: #f8fafc; border-left: 6px solid #3b82f6; }
    .job-ref { margin-top: 12px; display: flex; flex-direction: column; gap: 4px; }
    .job-ref strong { font-size: 1.2rem; color: #1e293b; }
    .job-ref span { color: #64748b; font-size: 0.95rem; font-weight: 500; }

    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .btn-download { background: #f8fafc; border: 1.5px solid #e2e8f0; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-size: 0.85rem; font-weight: 700; transition: all 0.2s; }
    .btn-download:hover { background: #edf2f7; transform: translateY(-1px); }
    
    .resume-viewer { min-height: 250px; }
    .resume-placeholder { text-align: center; padding: 50px 0; background: #f8fafc; border: 2.5px dashed #cbd5e1; border-radius: 16px; }
    .resume-icon { font-size: 3.5rem; margin-bottom: 12px; }
    .no-resume { text-align: center; padding: 40px; color: #991b1b; background: #fff5f5; border-radius: 12px; }

    .styled-textarea { width: 100%; padding: 15px; border-radius: 12px; border: 1.5px solid #e2e8f0; background: #fbfcfb; font-family: inherit; font-size: 1rem; resize: vertical; min-height: 120px; transition: all 0.2s; }
    .styled-textarea:focus { border-color: #3b82f6; background: white; outline: none; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
    
    .styled-input { width: 100%; padding: 12px 16px; border-radius: 10px; border: 1.5px solid #e2e8f0; font-family: inherit; font-size: 0.95rem; transition: all 0.2s; }
    .styled-input:focus { border-color: #3b82f6; outline: none; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 10px; }
    .form-group label { display: block; font-size: 0.8rem; font-weight: 700; color: #64748b; margin-bottom: 8px; }

    .card-footer { margin-top: 25px; display: flex; justify-content: flex-end; }
    .btn-primary { padding: 12px 32px; background: #3b82f6; color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
    .btn-primary:hover { background: #2563eb; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    .animate-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .state-container { text-align: center; padding: 100px 0; }
    .spinner { width: 50px; height: 50px; border: 5px solid #f1f5f9; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Top Nav (Recruiter Consistent) */
    .top-nav { height: 64px; background: white; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; padding: 0 40px; gap: 5px; position: sticky; top: 0; z-index: 1000; }
    .top-nav a { height: 100%; display: flex; align-items: center; padding: 0 20px; text-decoration: none; color: #64748b; font-weight: 700; border-bottom: 3px solid transparent; transition: all 0.2s; }
    .top-nav a:hover { color: #1e293b; }
    .top-nav a.active { color: #ff6b35; border-bottom-color: #ff6b35; }
    .nav-spacer { flex: 1; }
    .top-nav button { padding: 8px 16px; border: 1.5px solid #e2e8f0; border-radius: 8px; background: white; color: #1e293b; font-weight: 700; cursor: pointer; }
  `]
})
export class ApplicantReviewComponent implements OnInit, OnDestroy {
  application: Application | null = null;
  loading = true;
  isSaving = false;
  error = '';
  activeTab = 'profile';
  
  // Form fields
  internalNotes = '';
  recruiterFeedback = '';
  interviewDate = '';
  interviewLocation = '';

  ApplicationStatus = ApplicationStatus;
  statusFlow = [
    ApplicationStatus.APPLIED,
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.PHONE_SCREEN,
    ApplicationStatus.TECHNICAL_INTERVIEW,
    ApplicationStatus.ON_SITE_INTERVIEW,
    ApplicationStatus.OFFER_EXTENDED,
    ApplicationStatus.HIRED
  ];

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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadApplication(id: number): void {
    this.loading = true;
    this.httpService.getRecruiterApplications()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (apps) => {
          this.application = apps.find(a => a.id === Number(id)) || null;
          if (this.application) {
            this.internalNotes = this.application.internalNotes || '';
            this.recruiterFeedback = this.application.recruiterFeedback || '';
            this.interviewLocation = this.application.interviewLocation || '';
            if (this.application.interviewDate) {
              // Convert to local datetime-local format (YYYY-MM-DDTHH:mm)
              const date = new Date(this.application.interviewDate);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              this.interviewDate = `${year}-${month}-${day}T${hours}:${minutes}`;
            }
          } else {
            this.error = 'Application not found';
          }
        },
        error: () => this.error = 'Failed to load application details'
      });
  }

  get nextPossibleStatuses(): ApplicationStatus[] {
    if (!this.application) return [];
    
    // Find index of current status in flow
    const currentIndex = this.statusFlow.indexOf(this.application.status);
    if (currentIndex === -1) return [ApplicationStatus.SHORTLISTED]; // Default fallback
    
    // Suggest the next 2 steps and specific major steps
    const next = this.statusFlow.slice(currentIndex + 1, currentIndex + 3);
    
    // If not in the flow (like HOLD), suggest SHORTLISTED or APPLIED
    if (currentIndex === -1 && this.application.status === ApplicationStatus.HOLD) {
      return [ApplicationStatus.SHORTLISTED];
    }
    
    return next;
  }

  isStepCompleted(step: ApplicationStatus): boolean {
    if (!this.application) return false;
    const targetIndex = this.statusFlow.indexOf(step);
    const currentIndex = this.statusFlow.indexOf(this.application.status);
    
    if (this.application.status === ApplicationStatus.REJECTED) return false;
    if (this.application.status === ApplicationStatus.HIRED) return true;
    
    return targetIndex < currentIndex;
  }

  getSkills(): string[] {
    return this.application?.applicant.skills?.split(',').map(s => s.trim()) || [];
  }

  updateStatus(status: ApplicationStatus): void {
    if (!this.application) return;

    this.isSaving = true;
    this.httpService.updateApplicationStatus(this.application.id, status)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSaving = false)
      )
      .subscribe({
        next: (updated) => {
          this.application!.status = updated.status;
          this.toastService.showSuccess(`Application moved to ${status.replace('_', ' ')}`);
        },
        error: () => this.toastService.showError('Failed to update status')
      });
  }

  saveDetails(): void {
    if (!this.application) return;

    this.isSaving = true;
    const request: UpdateApplicationDetailsRequest = {
      internalNotes: this.internalNotes,
      recruiterFeedback: this.recruiterFeedback,
      interviewLocation: this.interviewLocation
    };

    if (this.interviewDate) {
      request.interviewDate = new Date(this.interviewDate).toISOString();
    }

    this.httpService.updateApplicationDetails(this.application.id, request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSaving = false)
      )
      .subscribe({
        next: (updated) => {
          // Merge results
          this.application = { ...this.application!, ...updated };
          this.toastService.showSuccess('Application details updated successfully');
        },
        error: () => this.toastService.showError('Failed to save details')
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

  logout(): void {
    this.authService.logout();
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 50) return '#3b82f6';
    return '#f59e0b';
  }
}
