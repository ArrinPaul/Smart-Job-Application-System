import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpService } from '../services/http.service';
import { AdminDashboardSummary } from '../models/admin.model';
import { Chart, registerables } from 'chart.js';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-overview.component.html',
  styleUrl: './admin-overview.component.css'
})
export class AdminOverviewComponent implements OnInit, OnDestroy {
  summary: AdminDashboardSummary | null = null;
  roleEntries: Array<{ key: string; value: number }> = [];
  applicationStatusEntries: Array<{ key: string; value: number }> = [];
  loadError: string | null = null;
  isLoading = false;
  isScraping = false;

  @ViewChild('trendChartCanvas') trendChartCanvas?: ElementRef;
  @ViewChild('recruiterChartCanvas') recruiterChartCanvas?: ElementRef;
  @ViewChild('funnelChartCanvas') funnelChartCanvas?: ElementRef;

  private trendChart: Chart | null = null;
  private recruiterChart: Chart | null = null;
  private funnelChart: Chart | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private httpService: HttpService
  ) {}

  ngOnInit(): void {
    this.loadSummary();
    this.startRealtimeSync();
  }

  private startRealtimeSync(): void {
    // Polling every 30 seconds for real-time updates
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadSummary(true);
      });
  }

  loadSummary(isSilent = false): void {
    if (this.isLoading) return;

    this.isLoading = true;
    this.loadError = null;

    this.httpService.getAdminDashboardSummary().subscribe({
      next: (response: AdminDashboardSummary) => {
        this.summary = response;
        this.processEntries(response);
        this.isLoading = false;
        
        // Use requestAnimationFrame for smoother chart initialization after DOM updates
        requestAnimationFrame(() => {
          setTimeout(() => this.initCharts(), 50);
        });
      },
      error: (error: unknown) => {
        console.error('Unable to load admin dashboard summary', error);
        if (!isSilent) {
          this.loadError = 'Unable to load dashboard summary right now.';
          this.summary = null;
          this.roleEntries = [];
          this.applicationStatusEntries = [];
        }
        this.isLoading = false;
      }
    });
  }

  triggerScraping(): void {
    if (this.isScraping) return;

    this.isScraping = true;
    this.httpService.triggerJobScraping().subscribe({
      next: () => {
        // Wait a bit then reload summary
        setTimeout(() => {
          this.loadSummary(true);
          this.isScraping = false;
        }, 2000);
      },
      error: () => {
        this.isScraping = false;
      }
    });
  }

  processEntries(summary: AdminDashboardSummary): void {
    if (summary.usersByRole) {
      this.roleEntries = Object.entries(summary.usersByRole).map(([key, value]) => ({ key, value }));
    } else {
      this.roleEntries = [];
    }

    if (summary.applicationsByStatus) {
      this.applicationStatusEntries = Object.entries(summary.applicationsByStatus).map(([key, value]) => ({ key, value }));
    } else {
      this.applicationStatusEntries = [];
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'JOB_APPLICANT': return 'Job Applicant';
      case 'RECRUITER': return 'Recruiter';
      case 'ADMIN': return 'Administrator';
      default: return role;
    }
  }

  private initCharts(): void {
    // Only init if we have summary data
    if (!this.summary) return;

    try {
      this.initTrendChart();
      this.initRecruiterActivityChart();
      this.initFunnelChart();
    } catch (error) {
      console.error('Unable to render admin dashboard charts', error);
    }
  }

  private initTrendChart(): void {
    const canvas = this.trendChartCanvas?.nativeElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.trendChart) {
      this.trendChart.destroy();
    }

    const today = new Date();
    const last7Days = this.summary?.jobTrends?.labels?.length ? this.summary.jobTrends.labels : Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const jobData = this.summary?.jobTrends?.data?.length ? this.summary.jobTrends.data : [0, 0, 0, 0, 0, 0, this.summary?.kpis?.jobsPostedToday || 0];

    this.trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: last7Days,
        datasets: [
          {
            label: 'Jobs Posted',
            data: jobData,
            borderColor: '#0f6f88',
            backgroundColor: 'rgba(15, 111, 136, 0.06)',
            borderWidth: 2.5,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: '#0f6f88',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            labels: { usePointStyle: true, boxWidth: 6, font: { size: 12, weight: 'bold' } }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(215, 228, 236, 0.5)' },
            ticks: { font: { size: 12 } }
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 12 } }
          }
        }
      }
    });
  }

  private initRecruiterActivityChart(): void {
    const ctx = this.recruiterChartCanvas?.nativeElement?.getContext('2d');
    if (!ctx) return;

    if (this.recruiterChart) {
      this.recruiterChart.destroy();
    }

    const labels = this.summary?.recruiterActivity?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const recruiterCount = this.summary?.recruiterActivity?.recruiters || [0, 0, 0, 0, 0, 0, 0];
    const jobPostCount = this.summary?.recruiterActivity?.jobs || [0, 0, 0, 0, 0, 0, 0];

    this.recruiterChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Active Recruiters',
            data: recruiterCount,
            backgroundColor: '#0f6f88',
            borderRadius: 8,
            borderSkipped: false
          },
          {
            label: 'Jobs Posted',
            data: jobPostCount,
            backgroundColor: '#e9822b',
            borderRadius: 8,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            labels: { usePointStyle: true, boxWidth: 6, font: { size: 12, weight: 'bold' } }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(215, 228, 236, 0.5)' },
            ticks: { font: { size: 12 } }
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 12 } }
          }
        }
      }
    });
  }

  private initFunnelChart(): void {
    const ctx = this.funnelChartCanvas?.nativeElement?.getContext('2d');
    if (!ctx) return;

    if (this.funnelChart) {
      this.funnelChart.destroy();
    }

    const funnelStages = this.summary?.applicationFunnel?.labels || ['Applied', 'Reviewed', 'Shortlisted', 'Interviewed', 'Offered', 'Hired'];
    const funnelData = this.summary?.applicationFunnel?.data || [0, 0, 0, 0, 0, 0];
    const colors = ['#0f6f88', '#1a8ba8', '#2ba5c0', '#e9822b', '#d47321', '#177146'];

    this.funnelChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: funnelStages,
        datasets: [
          {
            label: 'Conversion Rate',
            data: funnelData,
            backgroundColor: colors,
            borderRadius: 8,
            borderSkipped: false
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: 'rgba(215, 228, 236, 0.5)' },
            ticks: { font: { size: 12 } }
          },
          y: {
            grid: { display: false },
            ticks: { font: { size: 12, weight: 'bold' } }
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.trendChart?.destroy();
    this.recruiterChart?.destroy();
    this.funnelChart?.destroy();
  }
}
