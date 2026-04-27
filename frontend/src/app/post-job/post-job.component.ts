// File: ./src/app/post-job/post-job.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
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
  templateUrl: './post-job.component.html',
  styleUrls: ['./post-job.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class PostJobComponent implements OnInit, OnDestroy {
  // Wizard State
  currentStep = 1;
  totalSteps = 5;

  // Form Data
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
    }, 15000);
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

  // Wizard Navigation
  nextStep(): void {
    if (this.validateStep(this.currentStep)) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        window.scrollTo(0, 0);
      }
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo(0, 0);
    }
  }

  goToStep(step: number): void {
    if (step < this.currentStep) {
      this.currentStep = step;
      window.scrollTo(0, 0);
    } else if (step === this.currentStep + 1) {
      this.nextStep();
    }
  }

  validateStep(step: number): boolean {
    switch(step) {
      case 1:
        if (!this.jobTitle.trim()) {
          this.toastService.showWarning('Job title is required');
          return false;
        }
        if (!this.jobLocation.trim()) {
          this.toastService.showWarning('Location is required');
          return false;
        }
        return true;
      case 2:
        if (!this.jobDescription.trim()) {
          this.toastService.showWarning('Job description is required');
          return false;
        }
        return true;
      case 3:
        if (!this.mustHaveSkillsInput.trim()) {
          this.toastService.showWarning('Please add at least one must-have skill');
          return false;
        }
        return true;
      case 4:
        if (this.screeningQuestions.length === 0) {
          this.toastService.showWarning('Please add at least one screening question');
          return false;
        }
        return true;
      default:
        return true;
    }
  }

  onPostJob(): void {
    if (!this.validateStep(1) || !this.validateStep(2) || !this.validateStep(3) || !this.validateStep(4)) {
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
            this.finishPosting();
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
            this.finishPosting();
          },
          error: () => {
            this.isLoading = false;
          }
        });
    }
  }

  finishPosting(): void {
    this.resetForm();
    this.loadMyJobs();
    this.currentStep = 1;
    window.scrollTo(0, 0);
  }

  editJob(job: Job): void {
    this.editingJobId = job.id;
    this.jobTitle = job.title;
    this.jobDescription = this.extractOriginalDescription(job.description);
    this.jobLocation = job.location;
    // Potentially extract more if role details were structured
    this.currentStep = 1;
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

  getTabLabel(step: number): string {
    const labels: { [key: number]: string } = {
      1: 'Basics',
      2: 'Role',
      3: 'Requirements',
      4: 'Questions',
      5: 'Review'
    };
    return labels[step] || '';
  }

  getTabIcon(step: number): string {
    const icons: { [key: number]: string } = {
      1: '📋',
      2: '✍️',
      3: '🛠️',
      4: '❓',
      5: '🚀'
    };
    return icons[step] || '';
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
