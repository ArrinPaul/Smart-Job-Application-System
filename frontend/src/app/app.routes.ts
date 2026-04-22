import { Routes } from '@angular/router';
import { AuthGuard } from './services/auth.guard';
import { RoleGuard } from './services/auth.guard';
import { UserRole } from './models/user.model';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./registration/registration.component').then(m => m.RegistrationComponent)
  },
  {
    path: 'jobs',
    loadComponent: () => import('./job-list/job-list.component').then(m => m.JobListComponent),
    canActivate: [AuthGuard]
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
    data: { roles: [UserRole.RECRUITER, UserRole.JOB_SEEKER] }
  },
  {
    path: 'resume',
    loadComponent: () => import('./resume/resume.component').then(m => m.ResumeComponent),
    canActivate: [RoleGuard],
    data: { roles: [UserRole.JOB_SEEKER] }
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
