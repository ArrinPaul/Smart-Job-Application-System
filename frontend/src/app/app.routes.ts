import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegistrationComponent } from './registration/registration.component';
import { JobListComponent } from './job-list/job-list.component';
import { PostJobComponent } from './post-job/post-job.component';
import { ApplicationsComponent } from './applications/applications.component';
import { ResumeComponent } from './resume/resume.component';
import { AdminShellComponent } from './admin/admin-shell.component';
import { AdminOverviewComponent } from './admin/admin-overview.component';
import { AdminUsersComponent } from './admin/admin-users.component';
import { AdminJobsComponent } from './admin/admin-jobs.component';
import { AdminSystemComponent } from './admin/admin-system.component';
import { AuthGuard } from './services/auth.guard';
import { RoleGuard } from './services/auth.guard';
import { UserRole } from './models/user.model';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegistrationComponent },
  {
    path: 'jobs',
    component: JobListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'post-job',
    component: PostJobComponent,
    canActivate: [RoleGuard],
    data: { roles: [UserRole.RECRUITER] }
  },
  {
    path: 'applications',
    component: ApplicationsComponent,
    canActivate: [RoleGuard],
    data: { roles: [UserRole.RECRUITER, UserRole.JOB_SEEKER] }
  },
  {
    path: 'resume',
    component: ResumeComponent,
    canActivate: [RoleGuard],
    data: { roles: [UserRole.JOB_SEEKER] }
  },
  {
    path: 'admin',
    component: AdminShellComponent,
    canActivate: [RoleGuard],
    data: { roles: [UserRole.ADMIN] },
    children: [
      { path: '', component: AdminOverviewComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'jobs', component: AdminJobsComponent },
      { path: 'system', component: AdminSystemComponent }
    ]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
