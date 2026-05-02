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
  templateUrl: './application-preview.component.html',
  styleUrls: ['./application-preview.component.css']
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
