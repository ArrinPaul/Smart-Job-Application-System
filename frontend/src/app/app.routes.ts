import { Routes } from '@angular/router';
import { AuthGuard } from './services/auth.guard';
import { RoleGuard } from './services/auth.guard';
import { OnboardingGuard } from './services/onboarding.guard';
import { UserRole } from './models/user.model';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./registration/registration.component').then(m => m.RegistrationComponent)
  },
  {
    path: 'about',
    loadComponent: () => import('./about/about.component').then(m => m.AboutComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [RoleGuard],
    data: { roles: [UserRole.JOB_SEEKER] }
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./onboarding/onboarding.component').then(m => m.OnboardingComponent),
    canActivate: [OnboardingGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'jobs',
    loadComponent: () => import('./job-list/job-list.component').then(m => m.JobListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'jobs/:slug',
    loadComponent: () => import('./job-details/job-details.component').then(m => m.JobDetailsComponent)
  },
  {
    path: 'jobs/:slug/apply',
    loadComponent: () => import('./application-preview/application-preview.component').then(m => m.ApplicationPreviewComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'recommendations',
    loadComponent: () => import('./recommendations/recommendations.component').then(m => m.RecommendationsComponent),
    canActivate: [RoleGuard],
    data: { roles: [UserRole.JOB_SEEKER] }
  },
  {
    path: 'post-job',
    loadComponent: () => import('./post-job/post-job.component').then(m => m.PostJobComponent),
    canActivate: [RoleGuard],
    data: { roles: [UserRole.RECRUITER] }
  },
  {
    path: 'applications',
    loadComponent: () => import('./applications/applications.component').then(m => m.ApplicationsComponent),
    canActivate: [RoleGuard],
    data: { roles: [UserRole.RECRUITER, UserRole.JOB_SEEKER] },
    children: [
      { path: '', redirectTo: 'active', pathMatch: 'full' },
      { path: 'active', loadComponent: () => import('./applications/applications.component').then(m => m.ApplicationsComponent) },
      { path: 'interviews', loadComponent: () => import('./applications/applications.component').then(m => m.ApplicationsComponent) },
      { path: 'offers', loadComponent: () => import('./applications/applications.component').then(m => m.ApplicationsComponent) },
      { path: 'archived', loadComponent: () => import('./applications/applications.component').then(m => m.ApplicationsComponent) }
    ]
  },
  {
    path: 'recruiter/applications',
    loadComponent: () => import('./recruiter-applications/recruiter-applications.component').then(m => m.RecruiterApplicationsComponent),
    canActivate: [RoleGuard],
    data: { roles: [UserRole.RECRUITER] },
    children: [
      { path: '', redirectTo: 'applied', pathMatch: 'full' },
      { path: 'applied', loadComponent: () => import('./recruiter-applications/recruiter-applications.component').then(m => m.RecruiterApplicationsComponent) },
      { path: 'shortlisted', loadComponent: () => import('./recruiter-applications/recruiter-applications.component').then(m => m.RecruiterApplicationsComponent) },
      { path: 'interviews', loadComponent: () => import('./recruiter-applications/recruiter-applications.component').then(m => m.RecruiterApplicationsComponent) },
      { path: 'offers', loadComponent: () => import('./recruiter-applications/recruiter-applications.component').then(m => m.RecruiterApplicationsComponent) },
      { path: 'hired', loadComponent: () => import('./recruiter-applications/recruiter-applications.component').then(m => m.RecruiterApplicationsComponent) }
    ]
  },
  {
    path: 'recruiter/applications/:id',
    loadComponent: () => import('./applicant-review/applicant-review.component').then(m => m.ApplicantReviewComponent),
    canActivate: [RoleGuard],
    data: { roles: [UserRole.RECRUITER] }
  },
  {
    path: 'resume',
    loadComponent: () => import('./resume/resume.component').then(m => m.ResumeComponent),
    canActivate: [RoleGuard],
    data: { roles: [UserRole.JOB_SEEKER] }
  },
  {
    path: 'messages',
    loadComponent: () => import('./messages/messages.component').then(m => m.MessagesComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin-shell.component').then(m => m.AdminShellComponent),
    canActivate: [RoleGuard],
    data: { roles: [UserRole.ADMIN] },
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./admin/admin-overview.component').then(m => m.AdminOverviewComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./admin/admin-users.component').then(m => m.AdminUsersComponent)
      },
      {
        path: 'jobs',
        loadComponent: () => import('./admin/admin-jobs.component').then(m => m.AdminJobsComponent)
      },
      {
        path: 'system',
        loadComponent: () => import('./admin/admin-system.component').then(m => m.AdminSystemComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
