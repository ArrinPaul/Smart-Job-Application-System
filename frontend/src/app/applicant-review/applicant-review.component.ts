import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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
      <header class="review-header">
        <div class="container header-content">
          <div class="left">
            <button class="btn-back" routerLink="/recruiter/applications">← Back to List</button>
            <h1>Manage Candidate</h1>
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
              <button class="btn-message" (click)="messageApplicant()">Direct Message</button>
            </div>
          </div>

          <div class="score-card" *ngIf="application.aiMatchScore">
            <h3>Match Insights</h3>
            <div class="score-circle" [style.border-color]="getScoreColor(application.aiMatchScore)">
              <span class="score-num">{{ application.aiMatchScore }}%</span>
            </div>
            <p class="score-text">Compatibility based on role requirements.</p>
          </div>

          <div class="card workflow-card">
            <div class="card-header-small">
              <h3>Advance Pipeline</h3>
              <span class="skip-hint">Skip steps if needed</span>
            </div>
            
            <div class="transition-grid">
              <!-- Regular Next Step -->
              <button *ngFor="let status of nextPossibleStatuses" 
                      class="btn-status"
                      (click)="updateStatus(status)">
                Next: {{ status.replace('_', ' ') }}
              </button>
            </div>

            <div class="skip-section" *ngIf="skippableStatuses.length > 0">
              <hr class="divider">
              <label class="section-label">Fast Track to Stage:</label>
              <div class="skip-grid">
                <button *ngFor="let status of skippableStatuses" 
                        class="btn-skip"
                        (click)="updateStatus(status)">
                  {{ status.replace('_', ' ') }}
                </button>
              </div>
            </div>

            <hr class="divider">
            <div class="danger-actions">
               <button class="btn-outline-danger" (click)="updateStatus(ApplicationStatus.REJECTED)">Reject</button>
               <button class="btn-outline-warning" (click)="updateStatus(ApplicationStatus.HOLD)">On Hold</button>
            </div>
          </div>
        </aside>

        <!-- Main Content: Management Panels -->
        <section class="review-content">
          <div class="tabs-nav">
             <button [class.active]="activeTab === 'profile'" (click)="activeTab = 'profile'">Profile & Resume</button>
             <button [class.active]="activeTab === 'notes'" (click)="activeTab = 'notes'">Internal Notes</button>
             <button [class.active]="activeTab === 'interview'" (click)="activeTab = 'interview'">Scheduling</button>
          </div>

          <div class="tab-content">
            <!-- PROFILE TAB -->
            <div *ngIf="activeTab === 'profile'" class="animate-in">
              <div class="card job-summary">
                <h3>Role Information</h3>
                <div class="job-ref">
                  <strong>{{ application.job.title }}</strong>
                  <span>{{ application.job.location }} · {{ application.job.jobType }}</span>
                </div>
              </div>

              <div class="card resume-viewer">
                <div class="card-header">
                  <h3>Curriculum Vitae</h3>
                  <button class="btn-download" *ngIf="application.resume?.id" (click)="downloadResume()">
                    Download CV
                  </button>
                </div>
                
                <div class="resume-placeholder" *ngIf="application.resume; else noResumeTpl">
                  <div class="resume-icon">📄</div>
                  <p>The candidate's resume is ready for review.</p>
                </div>
                <ng-template #noResumeTpl>
                  <div class="no-resume">
                    <p>No resume was provided with this application.</p>
                  </div>
                </ng-template>
              </div>
            </div>

            <!-- NOTES TAB -->
            <div *ngIf="activeTab === 'notes'" class="animate-in">
              <div class="card">
                <h3>Team Evaluation</h3>
                <p class="muted">Private notes for internal hiring team evaluation.</p>
                <textarea 
                  [(ngModel)]="internalNotes" 
                  rows="10" 
                  class="styled-textarea" 
                  placeholder="Record initial feedback, phone screen outcomes, or background check results..."></textarea>
                <div class="card-footer">
                  <button class="btn-primary" [disabled]="isSaving" (click)="saveDetails()">
                    {{ isSaving ? 'Processing...' : 'Save Evaluation' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- INTERVIEW TAB -->
            <div *ngIf="activeTab === 'interview'" class="animate-in">
              <div class="card interview-scheduler">
                <h3>Interview Logistics</h3>
                <div class="form-grid">
                  <div class="form-group">
                    <label>Schedule Date & Time</label>
                    <input type="datetime-local" [(ngModel)]="interviewDate" class="styled-input">
                  </div>
                  <div class="form-group">
                    <label>Meeting Link / Room</label>
                    <input type="text" [(ngModel)]="interviewLocation" class="styled-input" placeholder="e.g. Zoom link or Office location">
                  </div>
                </div>
              </div>

              <div class="card">
                <h3>Interview Feedback</h3>
                <textarea 
                  [(ngModel)]="recruiterFeedback" 
                  rows="6" 
                  class="styled-textarea" 
                  placeholder="Provide detailed feedback from the interview and rationale for the next step..."></textarea>
                <div class="card-footer">
                   <button class="btn-primary" [disabled]="isSaving" (click)="saveDetails()">
                    {{ isSaving ? 'Processing...' : 'Sync Logistics' }}
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
        <p *ngIf="loading">Retrieving candidate data...</p>
        <div class="error-box" *ngIf="error">
          <h3>Error</h3>
          <p>{{ error }}</p>
          <button class="btn-back" routerLink="/recruiter/applications">Return to List</button>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .review-page { background: #f4efe6; min-height: 100vh; padding-bottom: 60px; }
    .review-header { background: #fffcf7; border-bottom: 1px solid #d8c8ae; padding: 25px 0; position: sticky; top: 72px; z-index: 100; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    .header-content { display: flex; justify-content: space-between; align-items: center; }
    
    .btn-back { background: none; border: none; color: #655f51; cursor: pointer; font-weight: 800; margin-bottom: 5px; display: block; font-size: 0.9rem; text-transform: uppercase; }
    h1 { margin: 0; font-size: 2rem; color: #1f1d18; font-weight: 800; font-family: 'Fraunces', serif; }

    /* Status Stepper */
    .status-stepper { display: flex; gap: 8px; }
    .step { padding: 8px 16px; background: #eee4d4; border-radius: 20px; font-size: 0.7rem; font-weight: 800; color: #655f51; transition: all 0.3s; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid transparent; }
    .step.active { background: linear-gradient(135deg, #bb3e2d, #962f21); color: #fffcf7; transform: scale(1.05); box-shadow: 0 4px 10px rgba(187, 62, 45, 0.2); }
    .step.completed { background: #dbf1e3; color: #1e6742; border-color: #b7e4c7; }

    .main-layout { display: grid; grid-template-columns: 320px 1fr; gap: 30px; margin-top: 30px; }

    .profile-card, .score-card, .card, .workflow-card { background: #fffcf7; border-radius: 20px; box-shadow: 0 2px 6px rgba(56, 39, 20, 0.05); border: 1px solid #d8c8ae; padding: 25px; margin-bottom: 24px; position: relative; overflow: hidden; }
    .profile-card::before, .score-card::before, .card::before, .workflow-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: #bb3e2d; }
    
    .profile-head { text-align: center; margin-bottom: 25px; }
    .avatar-large { width: 90px; height: 90px; background: linear-gradient(135deg, #bb3e2d, #962f21); border-radius: 24px; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; font-weight: 800; color: white; margin: 0 auto 15px; box-shadow: 0 10px 20px rgba(187, 62, 45, 0.2); }
    .profile-head h2 { margin: 0; font-size: 1.4rem; color: #1f1d18; font-family: 'Fraunces', serif; }
    .headline { margin: 5px 0 0; color: #655f51; font-size: 0.9rem; font-weight: 700; }

    .info-item { margin-bottom: 20px; }
    .info-item label { display: block; font-size: 0.7rem; color: #655f51; text-transform: uppercase; font-weight: 800; margin-bottom: 6px; letter-spacing: 0.1em; }
    .info-item p { margin: 0; color: #1f1d18; font-weight: 700; font-size: 1rem; }

    .skills-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .skill-tag { background: rgba(13, 103, 116, 0.1); color: #0d6774; padding: 4px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 800; border: 1px solid rgba(13, 103, 116, 0.15); }

    .btn-message { width: 100%; padding: 14px; background: #1f1d18; color: #f5e7d5; border: none; border-radius: 12px; font-weight: 800; cursor: pointer; transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.8rem; }
    .btn-message:hover { background: #000; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
    
    .score-card { text-align: center; }
    .score-circle { width: 110px; height: 110px; border: 10px solid #eee4d4; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 20px auto; transition: all 0.5s; }
    .score-num { font-size: 1.8rem; font-weight: 900; color: #1f1d18; font-family: 'Fraunces', serif; }
    .score-text { font-size: 0.8rem; color: #655f51; font-weight: 600; line-height: 1.4; }

    .workflow-card h3 { margin-bottom: 5px; font-size: 1.1rem; color: #1f1d18; font-family: 'Fraunces', serif; }
    .card-header-small { margin-bottom: 20px; }
    .skip-hint { font-size: 0.7rem; color: #655f51; font-weight: 700; text-transform: uppercase; }

    .transition-grid { display: flex; flex-direction: column; gap: 10px; }
    .btn-status { padding: 14px; border-radius: 12px; border: 2px solid var(--brand); background: var(--surface); color: var(--brand); font-weight: 800; font-size: 0.85rem; cursor: pointer; text-align: center; transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 4px 12px rgba(187, 62, 45, 0.15); }
    .btn-status:hover { background: white; transform: translateY(-2px); box-shadow: 0 8px 16px rgba(187, 62, 45, 0.2); }

    .skip-section { margin-top: 5px; }
    .section-label { display: block; font-size: 0.65rem; font-weight: 900; color: #655f51; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; }
    .skip-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .btn-skip { padding: 8px 12px; border-radius: 8px; border: 1px solid #d8c8ae; background: #1f1d18; color: white; font-size: 0.65rem; font-weight: 800; cursor: pointer; text-transform: uppercase; transition: all 0.2s; opacity: 0.85; }
    .btn-skip:hover { opacity: 1; background: #000; transform: scale(1.02); }

    .divider { margin: 20px 0; border: none; border-top: 1px solid #d8c8ae; }
    .danger-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .btn-outline-danger { padding: 10px; border-radius: 10px; border: 2px solid #ffcccb; background: transparent; color: #9b251b; font-size: 0.75rem; font-weight: 800; cursor: pointer; text-transform: uppercase; }
    .btn-outline-warning { padding: 10px; border-radius: 10px; border: 2px solid #d8c8ae; background: transparent; color: #655f51; font-size: 0.75rem; font-weight: 800; cursor: pointer; text-transform: uppercase; }

    /* Tabs */
    .tabs-nav { display: flex; gap: 8px; margin-bottom: 24px; background: #eee4d4; padding: 6px; border-radius: 14px; width: fit-content; }
    .tabs-nav button { padding: 10px 24px; border-radius: 10px; border: none; background: transparent; color: #655f51; font-weight: 800; cursor: pointer; transition: all 0.2s; font-size: 0.9rem; text-transform: uppercase; }
    .tabs-nav button.active { background: white; color: #1f1d18; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }

    .job-summary { border-left: 6px solid #bb3e2d; background: #fffcf7; }
    .job-ref { margin-top: 12px; display: flex; flex-direction: column; gap: 4px; }
    .job-ref strong { font-size: 1.4rem; color: #1f1d18; font-family: 'Fraunces', serif; }
    .job-ref span { color: #655f51; font-size: 0.95rem; font-weight: 700; }

    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .btn-download { background: #eee4d4; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-size: 0.85rem; font-weight: 800; color: #1f1d18; transition: all 0.2s; text-transform: uppercase; }
    .btn-download:hover { background: #d8c8ae; transform: translateY(-1px); }
    
    .resume-viewer { min-height: 250px; }
    .resume-placeholder { text-align: center; padding: 50px 0; background: #f8efdf; border: 2.5px dashed #d8c8ae; border-radius: 16px; }
    .resume-icon { font-size: 3.5rem; margin-bottom: 12px; }
    .no-resume { text-align: center; padding: 40px; color: #9b251b; background: #ffe4df; border-radius: 12px; font-weight: 700; }

    .styled-textarea { width: 100%; padding: 15px; border-radius: 12px; border: 1px solid #d8c8ae; background: #f8efdf; font-family: inherit; font-size: 1rem; resize: vertical; transition: all 0.2s; }
    .styled-textarea:focus { border-color: #bb3e2d; background: white; outline: none; box-shadow: 0 0 0 4px rgba(187, 62, 45, 0.1); }
    
    .styled-input { width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #d8c8ae; font-family: inherit; font-size: 0.95rem; background: #f8efdf; transition: all 0.2s; }
    .styled-input:focus { border-color: #bb3e2d; background: white; outline: none; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 10px; }
    .form-group label { display: block; font-size: 0.75rem; font-weight: 800; color: #655f51; margin-bottom: 8px; }

    .card-footer { margin-top: 25px; display: flex; justify-content: flex-end; }
    .btn-primary { padding: 12px 32px; background: linear-gradient(135deg, #bb3e2d, #962f21); color: white; border: none; border-radius: 12px; font-weight: 800; cursor: pointer; transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.05em; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(187, 62, 45, 0.3); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    .animate-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .state-container { text-align: center; padding: 100px 0; }
    .spinner { width: 50px; height: 50px; border: 5px solid #eee4d4; border-top-color: #bb3e2d; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Top Nav (Dark Theme) */
    .top-nav { height: 64px; background: linear-gradient(110deg, #1d1a16, #2d2922); border-bottom: 1px solid #43392c; display: flex; align-items: center; padding: 0 40px; gap: 5px; position: sticky; top: 0; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .top-nav a { height: 100%; display: flex; align-items: center; padding: 0 20px; text-decoration: none; color: #f5e7d5; font-weight: 800; border-bottom: 3px solid transparent; transition: all 0.2s; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; }
    .top-nav a:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }
    .top-nav a.active { color: #fff; border-bottom: 0; background: linear-gradient(135deg, #bb3e2d, #962f21); margin: 8px; border-radius: 10px; height: calc(100% - 16px); }
    .nav-spacer { flex: 1; }
    .top-nav button { padding: 8px 16px; border: 1px solid #43392c; border-radius: 8px; background: transparent; color: #f5e7d5; font-weight: 800; cursor: pointer; font-size: 11px; text-transform: uppercase; }
  `]
})
export class ApplicantReviewComponent implements OnInit, OnDestroy {
  private httpService = inject(HttpService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

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

  constructor() {}

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
              const date = new Date(this.application.interviewDate);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              this.interviewDate = `${year}-${month}-${day}T${hours}:${minutes}`;
            }
          } else {
            this.error = 'Candidate record not found.';
          }
        },
        error: () => this.error = 'Failed to load candidate details.'
      });
  }

  get nextPossibleStatuses(): ApplicationStatus[] {
    if (!this.application) return [];
    
    const currentStatus = this.application.status.toUpperCase() as ApplicationStatus;
    const currentIndex = this.statusFlow.indexOf(currentStatus);
    
    if (currentIndex === -1) {
       if (currentStatus === ApplicationStatus.HOLD) return [ApplicationStatus.SHORTLISTED];
       return [ApplicationStatus.SHORTLISTED];
    }
    
    // Suggest the next 1 step as primary
    return this.statusFlow.slice(currentIndex + 1, currentIndex + 2);
  }

  get skippableStatuses(): ApplicationStatus[] {
    if (!this.application) return [];
    
    const currentStatus = this.application.status.toUpperCase() as ApplicationStatus;
    const currentIndex = this.statusFlow.indexOf(currentStatus);
    
    if (currentIndex === -1) return [];

    // All steps after the next possible one
    return this.statusFlow.slice(currentIndex + 2);
  }

  isStepCompleted(step: ApplicationStatus): boolean {
    if (!this.application) return false;
    const currentStatus = this.application.status.toUpperCase() as ApplicationStatus;
    const targetIndex = this.statusFlow.indexOf(step);
    const currentIndex = this.statusFlow.indexOf(currentStatus);
    
    if (currentStatus === ApplicationStatus.REJECTED) return false;
    if (currentStatus === ApplicationStatus.HIRED) return true;
    
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
          this.toastService.showSuccess(`Pipeline updated: Candidate moved to ${status.replace('_', ' ')}`);
        },
        error: () => this.toastService.showError('Failed to update pipeline stage.')
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
          this.application = { ...this.application!, ...updated };
          this.toastService.showSuccess('Evaluation details synced successfully.');
        },
        error: () => this.toastService.showError('Failed to save evaluation.')
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
          a.download = `CV_${this.application?.applicant.fullName || 'Candidate'}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => this.toastService.showError('Failed to download CV.')
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
    if (score >= 80) return '#1e6742';
    if (score >= 50) return '#0d6774';
    return '#bb3e2d';
  }
}
