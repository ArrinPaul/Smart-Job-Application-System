// File: ./src/app/resume/resume.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpService } from '../../services/http.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-resume',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './resume.component.html'
})
export class ResumeComponent {
  selectedFile: File | null = null;
  successMessage = '';
  errorMessage = '';
  isUploading = false;

  constructor(private httpService: HttpService, private authService: AuthService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  onUpload(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select a file';
      return;
    }
    
    this.isUploading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.httpService.uploadResume(this.selectedFile).subscribe({
      next: () => {
        this.successMessage = 'Resume uploaded successfully';
        this.selectedFile = null; // Clear selection after upload
        this.isUploading = false;
      },
      error: () => {
        this.errorMessage = 'Upload failed. Please try again.';
        this.isUploading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
