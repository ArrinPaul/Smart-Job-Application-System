import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpService } from '../services/http.service';
import { Application, ApplicationStatus } from '../models/job.model';
import { Subject, takeUntil, finalize, interval, switchMap, of, startWith, Subscription } from 'rxjs';

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

  private pollingSub?: Subscription;

  ngOnInit(): void {
    const id = this.route.snapshot.params['slug']; 
    if (id) {
      this.startPolling(Number(id));
    }
  }

  ngOnDestroy(): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  startPolling(id: number): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }

    // Poll every 5 seconds for status updates while the page is open
    this.pollingSub = interval(5000)
      .pipe(
        startWith(0),
        switchMap(() => {
          if (document.visibilityState === 'visible') {
            return this.httpService.getMyApplications();
          }
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (apps) => {
          const found = apps.find(a => a.id === id);
          if (found) {
            // Only update if status or details changed to avoid flicker
            if (!this.application || 
                JSON.stringify(this.application) !== JSON.stringify(found)) {
              this.application = found;
            }
            this.loading = false;
          } else if (this.loading) {
            this.error = 'Application record not found.';
            this.loading = false;
          }
        },
        error: () => {
          if (this.loading) {
            this.error = 'Failed to load application status.';
            this.loading = false;
          }
        }
      });
  }

  getStepStatus(stage: ApplicationStatus): string {
    if (!this.application) return '';
    
    const currentStatus = this.application.status.toUpperCase() as ApplicationStatus;
    const currentIdx = this.statusFlow.indexOf(currentStatus);
    const targetIdx = this.statusFlow.indexOf(stage);

    if (currentStatus === ApplicationStatus.REJECTED) return '';
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
