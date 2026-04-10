// File: ./src/app/resume/resume.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpService } from '../services/http.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { ResumeMetadata } from '../models/job.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-resume',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './resume.component.html'
})
export class ResumeComponent implements OnInit, OnDestroy {
  selectedFile: File | null = null;
  isUploading = false;
  resume: ResumeMetadata | null = null;
  hasResume = false;
  private destroy$ = new Subject<void>();

  constructor(
    private httpService: HttpService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadUserResume();
  }

  loadUserResume(): void {
    const userId = this.authService.getUserId();
    if (userId) {
      this.httpService.getResumes(userId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (resumes: ResumeMetadata[]) => {
            if (resumes && resumes.length > 0) {
              this.resume = resumes[0];
              this.hasResume = true;
            }
          }
        });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      if (!allowedTypes.includes(file.type)) {
        this.toastService.showError('Only PDF and Word documents (.pdf, .doc, .docx) are allowed');
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        this.toastService.showError('File size must be less than 5MB');
        return;
      }

      this.selectedFile = file;
      this.toastService.showInfo(`Selected: ${file.name}`);
    }
  }

  onUpload(): void {
    if (!this.selectedFile) {
      this.toastService.showWarning('Please select a file');
      return;
    }
    
    this.isUploading = true;
      this.httpService.uploadResume(this.selectedFile, this.selectedFile.name)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.showSuccess('Resume uploaded successfully');
          this.selectedFile = null;
          this.isUploading = false;
          this.loadUserResume();
          // Clear file input
          const fileInput = document.getElementById('fileInput') as HTMLInputElement;
          if (fileInput) {
            fileInput.value = '';
          }
        },
        error: () => {
          this.isUploading = false;
        }
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
