// File: ./src/app/post-job/post-job.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpService } from '../services/http.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Job, CreateJobRequest } from '../models/job.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-post-job',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './post-job.component.html'
})
export class PostJobComponent implements OnInit, OnDestroy {
  jobTitle = '';
  jobDescription = '';
  jobLocation = '';
  employmentType = 'Full-time';
  experienceLevel = 'Mid-level';
  workMode = 'Remote';
  salaryRange = '';
  mustHaveSkillsInput = '';
  niceToHaveSkillsInput = '';
  interviewProcess = '2 rounds (technical + culture)';
  screeningQuestions: string[] = [
    'What is one project where you shipped production code recently?',
    'Why does this role fit your career goals?'
  ];
  newQuestion = '';

  readonly employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
  readonly experienceLevels = ['Entry-level', 'Mid-level', 'Senior', 'Lead'];
  readonly workModes = ['Remote', 'Hybrid', 'On-site'];

  isLoading = false;
  
  myJobs: Job[] = [];
  editingJobId: number | null = null;
  private destroy$ = new Subject<void>();
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private httpService: HttpService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMyJobs();
    this.startAutoRefresh();
  }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => {
      if (!this.isLoading) {
        this.loadMyJobs();
      }
    }, 10000);
  }

  loadMyJobs(): void {
    this.httpService.getRecruiterJobs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: Job[]) => {
          this.myJobs = response;
        },
        error: () => {
          // Error handled by interceptor toast
        }
      });
  }

  onPostJob(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    const enrichedDescription = this.buildEnrichedDescription();

    const jobData: CreateJobRequest = {
      title: this.jobTitle,
      description: enrichedDescription,
      location: this.jobLocation
    };

    if (this.editingJobId) {
      this.httpService.updateJob(this.editingJobId, jobData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.showSuccess('Job updated successfully!');
            this.resetForm();
            this.loadMyJobs();
          },
          error: () => {
            this.isLoading = false;
          }
        });
    } else {
      this.httpService.createJob(jobData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.showSuccess('Job posted successfully!');
            this.resetForm();
            this.loadMyJobs();
          },
          error: () => {
            this.isLoading = false;
          }
        });
    }
  }

  editJob(job: Job): void {
    this.editingJobId = job.id;
    this.jobTitle = job.title;
    this.jobDescription = this.extractOriginalDescription(job.description);
    this.jobLocation = job.location;
    window.scrollTo(0, 0);
  }

  addScreeningQuestion(): void {
    const value = this.newQuestion.trim();
    if (!value) {
      return;
    }

    this.screeningQuestions = [...this.screeningQuestions, value];
    this.newQuestion = '';
  }

  removeScreeningQuestion(index: number): void {
    this.screeningQuestions = this.screeningQuestions.filter((_, i) => i !== index);
  }

  quickAddQuestion(question: string): void {
    if (!this.screeningQuestions.includes(question)) {
      this.screeningQuestions = [...this.screeningQuestions, question];
    }
  }

  get mustHaveSkills(): string[] {
    return this.csvToList(this.mustHaveSkillsInput);
  }

  get niceToHaveSkills(): string[] {
    return this.csvToList(this.niceToHaveSkillsInput);
  }

  get totalStructuredFields(): number {
    let filled = 0;
    if (this.salaryRange.trim()) filled++;
    if (this.mustHaveSkills.length > 0) filled++;
    if (this.niceToHaveSkills.length > 0) filled++;
    if (this.interviewProcess.trim()) filled++;
    if (this.screeningQuestions.length > 0) filled++;
    return filled;
  }

  getActiveJobsCount(): number {
    return this.myJobs.length;
  }

  deleteJob(jobId: number): void {
    if (confirm('Are you sure you want to delete this job?')) {
      this.httpService.deleteJob(jobId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.showSuccess('Job deleted successfully');
            this.loadMyJobs();
          },
          error: () => {
            // Error handled by interceptor toast
          }
        });
    }
  }

  private validateForm(): boolean {
    if (!this.jobTitle.trim()) {
      this.toastService.showWarning('Job title is required');
      return false;
    }
    if (!this.jobDescription.trim()) {
      this.toastService.showWarning('Job description is required');
      return false;
    }
    if (!this.jobLocation.trim()) {
      this.toastService.showWarning('Job location is required');
      return false;
    }
    if (this.screeningQuestions.length === 0) {
      this.toastService.showWarning('Add at least one screening question');
      return false;
    }
    return true;
  }

  resetForm(): void {
    this.jobTitle = '';
    this.jobDescription = '';
    this.jobLocation = '';
    this.employmentType = 'Full-time';
    this.experienceLevel = 'Mid-level';
    this.workMode = 'Remote';
    this.salaryRange = '';
    this.mustHaveSkillsInput = '';
    this.niceToHaveSkillsInput = '';
    this.interviewProcess = '2 rounds (technical + culture)';
    this.screeningQuestions = [
      'What is one project where you shipped production code recently?',
      'Why does this role fit your career goals?'
    ];
    this.newQuestion = '';
    this.editingJobId = null;
    this.isLoading = false;
  }

  private csvToList(value: string): string[] {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  private buildEnrichedDescription(): string {
    const mustHave = this.mustHaveSkills;
    const niceToHave = this.niceToHaveSkills;
    const questions = this.screeningQuestions
      .map((q, idx) => `${idx + 1}. ${q}`)
      .join('\n');

    return [
      this.jobDescription.trim(),
      '',
      '--- Role Details ---',
      `Employment Type: ${this.employmentType}`,
      `Experience Level: ${this.experienceLevel}`,
      `Work Mode: ${this.workMode}`,
      this.salaryRange.trim() ? `Salary Range: ${this.salaryRange.trim()}` : null,
      mustHave.length ? `Must-Have Skills: ${mustHave.join(', ')}` : null,
      niceToHave.length ? `Nice-to-Have Skills: ${niceToHave.join(', ')}` : null,
      this.interviewProcess.trim() ? `Interview Process: ${this.interviewProcess.trim()}` : null,
      '',
      '--- Screening Questions ---',
      questions
    ]
      .filter((line): line is string => !!line)
      .join('\n');
  }

  private extractOriginalDescription(description: string): string {
    const markerIndex = description.indexOf('\n--- Role Details ---');
    if (markerIndex === -1) {
      return description;
    }

    return description.slice(0, markerIndex).trim();
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}
