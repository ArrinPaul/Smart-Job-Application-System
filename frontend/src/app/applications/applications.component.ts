// File: ./src/app/applications/applications.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpService } from '../services/http.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { TranslationService } from '../services/translation.service';
import { Application, ApplicationStatus } from '../models/job.model';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './applications.component.html'
})
export class ApplicationsComponent implements OnInit, OnDestroy {
  applications: Application[] = [];
  isRecruiter = false;
  isJobSeeker = false;
  isLoading = false;
  currentPhase = 'active'; // active, interviews, offers, archived
  statusOptions = Object.values(ApplicationStatus);
  private destroy$ = new Subject<void>();

  constructor(
    private httpService: HttpService,
    public authService: AuthService,
    private toastService: ToastService,
    private translationService: TranslationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isRecruiter = this.authService.isRecruiter();
    this.isJobSeeker = this.authService.isJobSeeker();
    
    this.route.url.subscribe(() => {
      const path = this.router.url.split('/').pop() || 'active';
      this.currentPhase = ['active', 'interviews', 'offers', 'archived'].includes(path) ? path : 'active';
      this.loadApplications();
    });
  }

  loadApplications(): void {
    this.isLoading = true;
    const request = this.isRecruiter ? this.httpService.getRecruiterApplications() : this.httpService.getMyApplications();
    
    request.pipe(
      takeUntil(this.destroy$),
      switchMap((response: Application[]) => {
        if (!response || response.length === 0) return of([]);
        
        // Translate job titles and locations in applications
        return forkJoin(response.map(app => 
          forkJoin({
            title: this.translationService.translateText(app.job.title),
            location: this.translationService.translateText(app.job.location)
          }).pipe(
            map(trans => ({
              ...app,
              job: {
                ...app.job,
                title: trans.title,
                location: trans.location
              }
            }))
          )
        ));
      })
    ).subscribe({
      next: (response: Application[]) => {
        this.applications = response;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }


  onUpdateStatus(applicationId: number, newStatus: string): void {
    this.httpService.updateApplicationStatus(applicationId, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.showSuccess('Status updated to: ' + newStatus.replace('_', ' '));
          this.loadApplications();
        }
      });
  }

  downloadResume(resumeId: number, fileName: string): void {
    this.httpService.downloadResume(resumeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.click();
          window.URL.revokeObjectURL(url);
          this.toastService.showSuccess('Resume downloaded');
        },
        error: () => this.toastService.showError('Failed to download resume')
      });
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

