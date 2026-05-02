import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpService } from '../services/http.service';
import { Application, ApplicationStatus } from '../models/job.model';
import { Subject, takeUntil, finalize } from 'rxjs';

@Component({
  selector: 'app-application-preview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-shell">
      <div class="page-header">
        <div class="container">
          <button class="btn-back" routerLink="/applications">← Back to My Applications</button>
          <h2 *ngIf="application">{{ application.job.title }}</h2>
          <p *ngIf="application">{{ application.job.location }} · {{ application.job.jobType }}</p>
        </div>
      </div>

      <main class="container" *ngIf="application; else stateTpl">
        <div class="preview-layout">
          <!-- Main Info -->
          <section class="main-info">
            <div class="card status-card">
              <div class="card-header">
                <h3>Application Status</h3>
                <span class="status-pill" [attr.data-status]="application.status">
                  {{ application.status.replace('_', ' ') }}
                </span>
              </div>
              
              <div class="application-timeline">
                <div *ngFor="let stage of statusFlow" 
                     class="timeline-step" 
                     [ngClass]="getStepStatus(stage)">
                  <div class="step-dot"></div>
                  <span class="step-label">{{ stage.replace('_', ' ') }}</span>
                </div>
              </div>

              <div class="status-description">
                <p class="highlight" [ngSwitch]="application.status">
                  <span *ngSwitchCase="ApplicationStatus.APPLIED">Your application has been received and is waiting for review.</span>
                  <span *ngSwitchCase="ApplicationStatus.SHORTLISTED">Congratulations! You've been shortlisted for the next round.</span>
                  <span *ngSwitchCase="ApplicationStatus.PHONE_SCREEN">A recruiter will contact you soon for a brief phone screening.</span>
                  <span *ngSwitchCase="ApplicationStatus.TECHNICAL_INTERVIEW">Prepare for your technical assessment or interview.</span>
                  <span *ngSwitchCase="ApplicationStatus.ON_SITE_INTERVIEW">You've reached the final interview stage!</span>
                  <span *ngSwitchCase="ApplicationStatus.OFFER_EXTENDED">Great news! An offer has been extended to you. Check your messages.</span>
                  <span *ngSwitchCase="ApplicationStatus.HIRED">Welcome aboard! You've been hired for this position.</span>
                  <span *ngSwitchCase="ApplicationStatus.REJECTED">The recruiter has decided not to move forward with your application at this time.</span>
                  <span *ngSwitchCase="ApplicationStatus.HOLD">Your application is currently on hold for future consideration.</span>
                </p>
              </div>
            </div>

            <div class="card logistics-card" *ngIf="application.interviewDate || application.interviewLocation">
              <h3>Interview Details</h3>
              <div class="logistics-grid">
                <div class="logistic-item" *ngIf="application.interviewDate">
                  <label>Scheduled For</label>
                  <p>{{ application.interviewDate | date:'full' }}</p>
                </div>
                <div class="logistic-item" *ngIf="application.interviewLocation">
                  <label>Location / Link</label>
                  <p>
                    <a *ngIf="isUrl(application.interviewLocation); else textLoc" [href]="application.interviewLocation" target="_blank">
                      Join Meeting 🔗
                    </a>
                    <ng-template #textLoc>{{ application.interviewLocation }}</ng-template>
                  </p>
                </div>
              </div>
            </div>

            <div class="card feedback-card" *ngIf="application.recruiterFeedback">
              <h3>Message from Recruiter</h3>
              <div class="feedback-content">
                <p>{{ application.recruiterFeedback }}</p>
              </div>
            </div>
          </section>

          <!-- Sidebar -->
          <aside class="side-info">
            <div class="card match-card" *ngIf="application.aiMatchScore">
              <h3>Compatibility Score</h3>
              <div class="score-circle">
                <span class="score-num">{{ application.aiMatchScore }}%</span>
              </div>
              <p class="muted">Based on your profile and the job requirements.</p>
            </div>

            <div class="card resume-card" *ngIf="application.resume">
              <h3>Submitted Resume</h3>
              <div class="resume-info">
                <div class="resume-icon">📄</div>
                <p>{{ application.resume.fileName }}</p>
              </div>
              <button class="btn--secondary btn-block" (click)="downloadResume()">Download CV</button>
            </div>
          </aside>
        </div>
      </main>

      <ng-template #stateTpl>
        <div class="container state-container">
          <div class="spinner" *ngIf="loading"></div>
          <p *ngIf="loading">Retrieving application details...</p>
          <div class="error-box" *ngIf="error">
            <h3>Not Found</h3>
            <p>{{ error }}</p>
            <button class="btn--primary" routerLink="/applications">Back to My Applications</button>
          </div>
        </div>
      </ng-template>
    </div>

    <style>
      .preview-layout { display: grid; grid-template-columns: 1fr 320px; gap: 30px; }
      .main-info { display: flex; flex-direction: column; gap: 24px; }
      .side-info { display: flex; flex-direction: column; gap: 24px; }

      .card { background: #fffcf7; border-radius: 20px; padding: 30px; border: 1px solid #d8c8ae; box-shadow: 0 16px 28px rgba(56, 39, 20, 0.1); position: relative; overflow: hidden; }
      .card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: #bb3e2d; }
      
      .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
      h3 { margin: 0; font-family: 'Fraunces', serif; color: #1f1d18; font-size: 1.5rem; }

      .status-pill { padding: 8px 16px; border-radius: 12px; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; background: var(--ink); color: white; }
      .status-pill[data-status="HIRED"] { background: #dbf1e3; color: #1e6742; }
      .status-pill[data-status="REJECTED"] { background: #ffe4df; color: #9b251b; }

      .application-timeline { display: flex; gap: 20px; margin: 20px 0 40px; padding: 25px; background: #f8efdf; border-radius: 16px; border: 1px solid #d8c8ae; overflow-x: auto; }
      .timeline-step { display: flex; flex-direction: column; align-items: center; gap: 12px; opacity: 0.4; min-width: 100px; flex: 1; position: relative; }
      .timeline-step:not(:last-child)::after { content: ''; position: absolute; top: 15px; left: 50%; width: 100%; height: 3px; background: #d8c8ae; }
      
      .step-dot { width: 32px; height: 32px; background: #fffcf7; border-radius: 50%; z-index: 2; border: 4px solid #d8c8ae; display: flex; align-items: center; justify-content: center; transition: all 0.3s; }
      .step-label { font-size: 0.7rem; font-weight: 800; color: #655f51; text-transform: uppercase; text-align: center; }

      .timeline-step.completed { opacity: 1; }
      .timeline-step.completed .step-dot { background: #0d6774; border-color: #0d6774; color: white; }
      .timeline-step.completed .step-dot::after { content: '✓'; font-weight: 900; }
      .timeline-step.completed:not(:last-child)::after { background: #0d6774; }

      .timeline-step.active { opacity: 1; }
      .timeline-step.active .step-dot { background: #bb3e2d; border-color: #bb3e2d; transform: scale(1.2); box-shadow: 0 0 0 6px rgba(187, 62, 45, 0.15); }
      .timeline-step.active .step-label { color: #bb3e2d; }

      .status-description { padding: 20px; background: #fff; border-radius: 12px; border-left: 4px solid #bb3e2d; }
      .status-description p { margin: 0; font-weight: 700; color: #1f1d18; font-size: 1.1rem; }

      .logistics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px; }
      .logistic-item label { display: block; font-size: 0.7rem; font-weight: 800; color: #655f51; text-transform: uppercase; margin-bottom: 6px; }
      .logistic-item p { font-weight: 700; color: #1f1d18; }
      .logistic-item a { color: #0d6774; text-decoration: none; border-bottom: 2px solid #0d6774; }

      .feedback-content { margin-top: 15px; padding: 20px; background: #f8efdf; border-radius: 12px; font-style: italic; color: #1f1d18; line-height: 1.6; }

      .score-circle { width: 120px; height: 120px; border: 10px solid #bb3e2d; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 20px auto; }
      .score-num { font-size: 2.2rem; font-weight: 900; color: #1f1d18; font-family: 'Fraunces', serif; }

      .resume-info { display: flex; align-items: center; gap: 15px; margin: 20px 0; }
      .resume-icon { font-size: 2.5rem; }
      .resume-info p { font-weight: 700; color: #1f1d18; }

      .btn-back { background: none; border: none; color: #655f51; cursor: pointer; font-weight: 800; margin-bottom: 10px; text-transform: uppercase; font-size: 0.9rem; }
      .btn-block { width: 100%; }

      .state-container { text-align: center; padding: 100px 0; }
      .spinner { width: 50px; height: 50px; border: 5px solid #eee4d4; border-top-color: #bb3e2d; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
  `
})
export class ApplicationPreviewComponent implements OnInit, OnDestroy {
  private httpService = inject(HttpService);
  private route = inject(ActivatedRoute);

  application: Application | null = null;
  loading = true;
  error = '';

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

  ngOnInit(): void {
    const id = this.route.snapshot.params['slug']; // Reusing slug param for ID for now, or updating route
    if (id) {
      this.loadApplication(Number(id));
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadApplication(id: number): void {
    this.loading = true;
    this.httpService.getMyApplications()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (apps) => {
          this.application = apps.find(a => a.id === id) || null;
          if (!this.application) this.error = 'Application record not found.';
        },
        error: () => this.error = 'Failed to load application status.'
      });
  }

  getStepStatus(stage: ApplicationStatus): string {
    if (!this.application) return '';
    const currentIdx = this.statusFlow.indexOf(this.application.status.toUpperCase() as ApplicationStatus);
    const targetIdx = this.statusFlow.indexOf(stage);

    if (this.application.status === ApplicationStatus.REJECTED) return '';
    if (currentIdx === targetIdx) return 'active';
    if (targetIdx < currentIdx) return 'completed';
    return '';
  }

  isUrl(str: string): boolean {
    return str.startsWith('http') || str.includes('zoom.us') || str.includes('teams.microsoft');
  }

  downloadResume(): void {
    if (!this.application?.resume?.id) return;
    this.httpService.downloadResume(this.application.resume.id)
      .subscribe(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Application_CV.pdf`;
        a.click();
      });
  }
}
