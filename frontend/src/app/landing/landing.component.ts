import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { HttpService } from '../services/http.service';
import { UserRole } from '../models/user.model';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {
  stats = {
    totalJobs: 0,
    totalUsers: 0,
    matchRate: 95,
    matchingSpeedMs: 12
  };

  // State for Job Portal Modules
  activeModule = 'search';
  modules = [
    { id: 'search', title: 'Neural Search', desc: 'Find roles based on skill intent, not just keywords.' },
    { id: 'track', title: 'Live Tracker', desc: 'Real-time status of every application and recruiter view.' },
    { id: 'chat', title: 'Talent Messenger', desc: 'Direct, secure communication with hiring managers.' }
  ];

  // State for AI Smart Tools
  activeAiTool = 0;
  aiTools = [
    { title: 'Resume Score AI', desc: 'Get an instant breakdown of how your profile matches specific market demands.' },
    { title: 'Match Velocity', desc: 'Our neural engine identifies your career trajectory and predicts your next best move.' },
    { title: 'Skill Bridge', desc: 'Identifies gaps in your skill graph and recommends targeted paths to close them.' }
  ];

  constructor(
    private authService: AuthService, 
    private router: Router,
    private httpService: HttpService
  ) {}

  setModule(moduleId: string): void {
    this.activeModule = moduleId;
  }

  cycleAiTool(): void {
    this.activeAiTool = (this.activeAiTool + 1) % this.aiTools.length;
  }

  ngOnInit(): void {
    this.loadStats();
    if (this.authService.isLoggedIn()) {
      const role = this.authService.getRole();
      const onboardingCompleted = this.authService.isOnboardingCompleted();
      const currentUrl = this.router.url;

      if (!onboardingCompleted && role !== UserRole.ADMIN) {
        if (currentUrl !== '/onboarding') {
          this.router.navigate(['/onboarding']);
        }
      } else {
        this.navigateBasedOnRole(role);
      }
    }
  }

  loadStats(): void {
    this.httpService.getPortalStats().subscribe({
      next: (data) => {
        this.stats = {
          totalJobs: data.totalJobs || 0,
          totalUsers: data.totalUsers || 0,
          matchRate: data.matchRate || 95,
          matchingSpeedMs: data.matchingSpeedMs || 12
        };
      },
      error: () => {
        // Fallback to reasonable defaults if API fails
        this.stats = {
          totalJobs: 2500,
          totalUsers: 10000,
          matchRate: 95,
          matchingSpeedMs: 12
        };
      }
    });
  }

  private navigateBasedOnRole(role: UserRole | null): void {
    const currentUrl = this.router.url;
    let targetUrl = '';

    switch (role) {
      case UserRole.RECRUITER:
        targetUrl = '/post-job';
        break;
      case UserRole.JOB_SEEKER:
        targetUrl = '/dashboard';
        break;
      case UserRole.ADMIN:
        targetUrl = '/admin';
        break;
    }

    if (targetUrl && currentUrl !== targetUrl) {
      this.router.navigate([targetUrl]);
    }
  }
}
