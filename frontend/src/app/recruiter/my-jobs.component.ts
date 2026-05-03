import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpService } from '../services/http.service';
import { ToastService } from '../services/toast.service';
import { Job } from '../models/job.model';
import { Subject, takeUntil, finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-my-jobs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-shell">
      <header class="page-header">
        <div class="container">
          <div class="header-main">
            <h1>My Job Postings</h1>
            <button class="btn--primary" routerLink="/post-job">+ Post New Role</button>
          </div>
          <p>View and manage all your active job listings and their statuses.</p>
        </div>
      </header>

      <main class="container">
        <!-- KPI Row -->
        <section class="kpi-grid">
          <div class="kpi-card">
            <h3>Total Postings</h3>
            <p>{{ myJobs.length }}</p>
          </div>
          <div class="kpi-card active-jobs">
            <h3>Active Roles</h3>
            <p>{{ getActiveCount() }}</p>
          </div>
        </section>

        <!-- Listings Grid -->
        <section class="active-listings-section" *ngIf="!loading; else loadingTpl">
          <div class="jobs-grid" *ngIf="myJobs.length > 0; else noJobsTpl">
            <article class="job-management-card" *ngFor="let job of myJobs">
              <div class="card-body">
                <div class="card-main">
                  <h4>{{ job.title }}</h4>
                  <p class="job-meta">📍 {{ job.location }} · Posted {{ job.createdAt | date:'mediumDate' }}</p>
                  <div class="job-pills">
                    <span class="job-pill">{{ job.jobType?.replace('_', ' ') }}</span>
                    <span class="job-pill" [class.status-open]="job.isActive" [class.status-closed]="!job.isActive">
                      {{ job.isActive ? 'Active' : 'Closed' }}
                    </span>
                  </div>
                </div>
                <div class="card-actions">
                  <button type="button" class="btn-status" [class.btn-close]="job.isActive" [class.btn-open]="!job.isActive" (click)="toggleJobStatus(job)">
                    <span>{{ job.isActive ? 'Close Hiring' : 'Open Hiring' }}</span>
                  </button>
                  <button type="button" class="btn-manage" (click)="editJob(job)">
                    <span>Edit</span>
                  </button>
                  <button type="button" class="btn-delete" (click)="deleteJob(job.id)">
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </article>
          </div>
        </section>

        <ng-template #loadingTpl>
          <div class="state-box">
            <div class="spinner"></div>
            <p>Retrieving your job postings...</p>
          </div>
        </ng-template>

        <ng-template #noJobsTpl>
          <div class="empty-state-panel">
            <div class="empty-state">
              <div class="empty-icon">📂</div>
              <h3>No active postings</h3>
              <p>You haven't published any job roles yet. Click the button above to start your first listing.</p>
            </div>
          </div>
        </ng-template>
      </main>
    </div>
  `,
  styles: [`
    .page-header { background: #fffcf7; padding: 40px 0; border-bottom: 1px solid #d8c8ae; margin-bottom: 30px; margin-top: -48px; }
    .header-main { display: flex; justify-content: space-between; align-items: center; }
    h1 { margin: 0; color: #1f1d18; font-size: 2.2rem; font-family: 'Fraunces', serif; }
    .page-header p { margin: 8px 0 0; color: #655f51; font-size: 1.1rem; font-weight: 600; }

    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .kpi-card { background: #fffcf7; border: 1px solid #d8c8ae; border-radius: 20px; padding: 25px; box-shadow: 0 16px 28px rgba(56, 39, 20, 0.05); position: relative; overflow: hidden; }
    .kpi-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: #bb3e2d; }
    .kpi-card h3 { font-size: 0.75rem; text-transform: uppercase; color: #655f51; letter-spacing: 0.1em; font-weight: 800; }
    .kpi-card p { font-size: 2rem; font-weight: 900; color: #1f1d18; margin-top: 5px; font-family: 'Fraunces', serif; }

    .jobs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 24px; }
    .job-management-card { background: #fffcf7; border: 1px solid #d8c8ae; border-radius: 20px; box-shadow: 0 16px 28px rgba(56, 39, 20, 0.08); position: relative; overflow: hidden; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .job-management-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(56, 39, 20, 0.12); border-color: #bb3e2d; }
    .job-management-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: #bb3e2d; }

    .card-body { padding: 25px; display: flex; flex-direction: column; height: 100%; }
    .card-main h4 { margin: 0; font-size: 1.4rem; color: #1f1d18; font-family: 'Fraunces', serif; line-height: 1.2; }
    .job-meta { margin: 8px 0 12px; font-size: 0.9rem; color: #655f51; font-weight: 700; }
    .job-pills { display: flex; gap: 8px; margin-bottom: 20px; }
    .job-pill { padding: 4px 12px; background: #eee4d4; color: #1f1d18; border-radius: 8px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
    .status-open { background: #dbf1e3; color: #1e6742; border: 1px solid #b7e4c7; }
    .status-closed { background: #ffe4df; color: #9b251b; border: 1px solid #ffcccb; }

    .card-actions { display: flex; gap: 12px; margin-top: auto; padding-top: 15px; border-top: 1px solid rgba(216, 200, 174, 0.4); }
    .btn-status { flex: 1.2; padding: 12px 20px; border-radius: 10px; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; cursor: pointer; transition: all 0.2s; border: 2px solid transparent; }
    .btn-close { background: #1f1d18; color: white; border-color: #1f1d18; }
    .btn-close:hover { background: #000; transform: translateY(-1px); }
    .btn-open { background: #dbf1e3; color: #1e6742; border-color: #b7e4c7; }
    .btn-open:hover { background: #b7e4c7; transform: translateY(-1px); }
    
    .btn-manage { flex: 0.8; padding: 12px 20px; background: transparent; color: #1f1d18; border: 2px solid #1f1d18; border-radius: 10px; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
    .btn-manage:hover { background: #eee4d4; transform: translateY(-1px); }
    .btn-delete { padding: 12px 20px; background: transparent; color: #9b251b; border: 2px solid #ffcccb; border-radius: 10px; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; cursor: pointer; }
    .btn-delete:hover { background: #ffe4df; border-color: #9b251b; }

    .empty-state-panel { text-align: center; border: 2px dashed #d8c8ae; background: #f8efdf; padding: 60px; border-radius: 20px; }
    .empty-icon { font-size: 4rem; margin-bottom: 20px; opacity: 0.3; }
    .empty-state h3 { font-family: 'Fraunces', serif; font-size: 1.8rem; color: #1f1d18; margin-bottom: 10px; }
    .empty-state p { color: #655f51; max-width: 400px; margin: 0 auto; font-weight: 600; }

    .state-box { text-align: center; padding: 80px 0; }
    .spinner { width: 40px; height: 40px; border: 4px solid #eee4d4; border-top-color: #bb3e2d; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class MyJobsComponent implements OnInit, OnDestroy {
  private httpService = inject(HttpService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  myJobs: Job[] = [];
  loading = true;
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadMyJobs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMyJobs(): void {
    this.loading = true;
    this.httpService.getRecruiterJobs()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response) => this.myJobs = response,
        error: () => this.toastService.showError('Failed to load your postings')
      });
  }

  getActiveCount(): number {
    return this.myJobs.filter(j => j.isActive).length;
  }

  toggleJobStatus(job: Job): void {
    const action = job.isActive ? 'Close hiring for' : 'Reopen hiring for';
    if (confirm(`${action} "${job.title}"?`)) {
      this.httpService.toggleJobStatus(job.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedJob) => {
            const index = this.myJobs.findIndex(j => j.id === job.id);
            if (index !== -1) {
              this.myJobs[index] = updatedJob;
            }
            this.toastService.showSuccess(`Job ${updatedJob.isActive ? 'opened' : 'closed'} successfully`);
          },
          error: () => this.toastService.showError('Failed to update job status')
        });
    }
  }

  editJob(job: Job): void {
    this.router.navigate(['/post-job'], { queryParams: { edit: job.id } });
  }

  deleteJob(jobId: number): void {
    if (confirm('Permanently remove this job posting?')) {
      this.httpService.deleteJob(jobId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.showSuccess('Posting removed successfully');
            this.loadMyJobs();
          }
        });
    }
  }
}
