import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpService } from '../services/http.service';
import { Job } from '../models/job.model';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-job-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './job-details.component.html',
  styleUrls: ['./job-details.component.css']
})
export class JobDetailsComponent implements OnInit {
  job: Job | null = null;
  renderedDescription: SafeHtml = '';
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private httpService: HttpService,
    private sanitizer: DomSanitizer,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      if (slug) {
        this.fetchJobDetails(slug);
      }
    });
  }

  fetchJobDetails(slug: string): void {
    this.loading = true;
    this.httpService.getJobBySlug(slug).subscribe({
      next: (job) => {
        this.job = job;
        this.renderedDescription = this.parseMarkdown(job.description);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Could not load job details. It may have been removed.';
        this.loading = false;
        this.toastService.showError('Error loading job details');
      }
    });
  }

  /**
   * Basic Markdown Parser for Pointers and Bold text
   * Handles ### Headers, • Bullets, and **Bold**
   */
  private parseMarkdown(text: string): SafeHtml {
    if (!text) return '';

    let html = text
      // Headers
      .replace(/### (.*)/g, '<h3 class="md-h3">$1</h3>')
      .replace(/## (.*)/g, '<h2 class="md-h2">$1</h2>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Bullet points
      .replace(/• (.*)/g, '<li class="md-li">$1</li>')
      // Line breaks
      .replace(/\n/g, '<br>');

    // Wrap list items in <ul>
    if (html.includes('<li')) {
        // This is a very basic wrapper logic
        html = html.replace(/(<li.*<\/li>)/gs, '<ul class="md-ul">$1</ul>');
    }

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  applyInternally(): void {
    if (this.job) {
        this.httpService.applyJob(this.job.id).subscribe({
            next: () => this.toastService.showSuccess('Applied successfully!'),
            error: () => this.toastService.showError('Failed to apply')
        });
    }
  }

  shareJob(): void {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      this.toastService.showSuccess('Link copied to clipboard!');
    });
  }
}
