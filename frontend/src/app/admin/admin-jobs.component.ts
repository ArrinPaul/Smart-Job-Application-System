import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpService } from '../services/http.service';
import { Job } from '../models/job.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-admin-jobs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-jobs.component.html'
})
export class AdminJobsComponent implements OnInit, OnDestroy {
  jobs: Job[] = [];
  isLoading = false;

  private destroy$ = new Subject<void>();

  constructor(private httpService: HttpService) {}

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.isLoading = true;
    this.httpService.getAllJobsAdmin()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: Job[]) => {
          this.jobs = response;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
