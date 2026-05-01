import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpService } from '../services/http.service';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';
import { Job } from '../models/job.model';
import { User } from '../models/user.model';
import { Subject, takeUntil, finalize, forkJoin } from 'rxjs';

@Component({
  selector: 'app-application-preview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="preview-container">
      <div class="preview-card">
        <header class="preview-header">
          <button (click)="goBack()" class="back-btn">← Back to Job</button>
          <h1>Application Preview</h1>
          <p>Review your information before submitting to <strong>{{ job?.companyName || 'the recruiter' }}</strong></p>
        </header>

        <div class="preview-content" *ngIf="!loading; else loadingTpl">
          <!-- Job Summary -->
          <section class="summary-section">
            <div class="job-mini-card">
              <h3>{{ job?.title }}</h3>
              <p>{{ job?.location }} · {{ job?.jobType }}</p>
            </div>
          </section>

          <!-- Profile Info -->
          <section class="info-section">
            <h2>Your Profile</h2>
            <div class="profile-preview">
              <div class="profile-field">
                <label>Full Name</label>
                <p>{{ user?.fullName || user?.username }}</p>
              </div>
              <div class="profile-field">
                <label>Email</label>
                <p>{{ user?.email }}</p>
              </div>
              <div class="profile-field">
                <label>Headline</label>
                <p>{{ user?.headline || 'No headline set' }}</p>
              </div>
              <div class="profile-field">
                <label>Skills</label>
                <p>{{ user?.skills || 'No skills listed' }}</p>
              </div>
            </div>
          </section>

          <!-- Resume Info -->
          <section class="info-section">
            <h2>Resume</h2>
            <div class="resume-status" [class.no-resume]="!hasResume">
              <span class="status-icon">{{ hasResume ? '📄' : '⚠️' }}</span>
              <div class="status-text">
                <p><strong>{{ hasResume ? 'Resume attached' : 'No resume found' }}</strong></p>
                <p>{{ hasResume ? 'The recruiter will receive your latest uploaded resume.' : 'Please upload a resume in your profile before applying.' }}</p>
              </div>
              <a *ngIf="!hasResume" routerLink="/profile" class="profile-link">Go to Profile</a>
            </div>
          </section>

          <footer class="preview-footer">
            <p class="terms">By clicking "Confirm & Submit", your profile and resume will be sent to the recruiter.</p>
            <div class="actions">
              <button class="btn-secondary" (click)="goBack()">Cancel & Return</button>
              <button class="btn-publish-final" (click)="submitApplication()" [disabled]="submitting || !hasResume">
                {{ submitting ? 'Submitting...' : 'Confirm & Submit Application' }}
              </button>
            </div>
          </footer>
        </div>

        <ng-template #loadingTpl>
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Preparing your application preview...</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .preview-container {
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
      animation: fadeIn 0.3s ease-out;
    }
    .preview-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      overflow: hidden;
      border: 1px solid #eef2f6;
    }
    .preview-header {
      padding: 30px;
      background: #f8fafc;
      border-bottom: 1px solid #eef2f6;
    }
    .back-btn {
      background: none;
      border: none;
      color: #64748b;
      font-size: 0.9rem;
      cursor: pointer;
      margin-bottom: 15px;
      padding: 0;
    }
    .back-btn:hover { color: #1e293b; }
    h1 { margin: 0; font-size: 1.5rem; color: #1e293b; }
    .preview-header p { margin: 5px 0 0; color: #64748b; }
    .preview-content { padding: 30px; }
    .info-section { margin-top: 30px; }
    h2 { font-size: 1.1rem; color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 15px; }
    .profile-preview { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .profile-field label { display: block; font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .profile-field p { margin: 0; color: #334155; font-weight: 500; }
    .job-mini-card { background: #f1f5f9; padding: 15px; border-radius: 8px; }
    .job-mini-card h3 { margin: 0; font-size: 1rem; color: #1e293b; }
    .job-mini-card p { margin: 5px 0 0; color: #64748b; font-size: 0.9rem; }
    .resume-status { display: flex; align-items: center; gap: 15px; padding: 15px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; }
    .resume-status.no-resume { background: #fef2f2; border-color: #fecaca; }
    .status-icon { font-size: 1.5rem; }
    .status-text p { margin: 0; font-size: 0.9rem; }
    .profile-link { margin-left: auto; color: #ef4444; font-weight: 600; text-decoration: none; font-size: 0.9rem; }
    .preview-footer { margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 25px; }
    .terms { font-size: 0.8rem; color: #94a3b8; text-align: center; margin-bottom: 20px; }
    .actions { display: flex; gap: 15px; justify-content: flex-end; align-items: center; }
    
    .btn-publish-final {
      background: #ff6b35;
      color: white !important;
      border: none;
      padding: 14px 32px;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.2);
    }
    
    .btn-publish-final:disabled {
      background: #fabca5;
      cursor: not-allowed;
    }

    .spinner { width: 30px; height: 30px; border: 3px solid #f1f5f9; border-top-color: #ef4444; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px; }
    .loading-state { text-align: center; padding: 40px 0; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ApplicationPreviewComponent implements OnInit, OnDestroy {
  job: Job | null = null;
  user: User | null = null;
  loading = true;
  submitting = false;
  hasResume = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private httpService: HttpService,
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const slug = params['slug'];
      if (slug) {
        this.loadData(slug);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(slug: string): void {
    this.loading = true;
    
    forkJoin({
      job: this.httpService.getJobBySlug(slug),
      user: this.httpService.getCurrentUser()
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading = false)
    ).subscribe({
      next: (data) => {
        this.job = data.job;
        this.user = data.user;
        this.checkResume();
      },
      error: () => {
        this.toastService.showError('Failed to load application data');
        this.router.navigate(['/jobs']);
      }
    });
  }

  checkResume(): void {
    const userId = this.authService.getUserId();
    if (!userId) return;

    this.httpService.getResumes(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resumes) => {
           this.hasResume = resumes && resumes.length > 0;
        },
        error: () => { 
          // Fallback check: if onboarding is done, they might have profile-based data
          this.hasResume = this.authService.isOnboardingCompleted();
        }
      });
  }

  submitApplication(): void {
    if (!this.job) return;
    
    this.submitting = true;
    this.httpService.applyJob(this.job.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.submitting = false)
      )
      .subscribe({
        next: () => {
          this.toastService.showSuccess('Application submitted successfully!');
          this.router.navigate(['/jobseeker/applications']);
        },
        error: (err) => {
          this.toastService.showError(err.error?.message || 'Failed to submit application');
        }
      });
  }

  goBack(): void {
    if (this.job) {
      this.router.navigate(['/jobs', this.job.slug]);
    } else {
      this.router.navigate(['/jobs']);
    }
  }
}
