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
      // Markdown links [text](url)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="md-link">$1</a>')
      // Headers
      .replace(/### (.*)/g, '<h3 class="md-h3">$1</h3>')
      .replace(/## (.*)/g, '<h2 class="md-h2">$1</h2>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Bullet points
      .replace(/• (.*)/g, '<li class="md-li">$1</li>')
      // Line breaks (preserve structure, convert \n to <br> but keep \n\n as paragraph break)
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    // Wrap in paragraphs if not already
    if (!html.includes('<p>') && !html.includes('<h')) {
      html = '<p>' + html + '</p>';
    }

    // Wrap list items in <ul>
    if (html.includes('<li')) {
      html = html.replace(/(<li.*?<\/li>)/gs, (match) => {
        return '<ul class="md-ul">' + match + '</ul>';
      });
    }

    // Add styling to links
    html = html.replace(/<a href/g, '<a class="md-link" href');

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
