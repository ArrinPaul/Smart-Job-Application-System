import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegistrationComponent } from './registration/registration.component';
import { JobListComponent } from './job-list/job-list.component';
import { PostJobComponent } from './post-job/post-job.component';
import { ApplicationsComponent } from './applications/applications.component';
import { ResumeComponent } from './resume/resume.component';
import { AuthGuard } from '../services/auth.guard';
import { RoleGuard } from '../services/auth.guard';
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
  }
];
