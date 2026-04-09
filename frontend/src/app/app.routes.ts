import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegistrationComponent } from './registration/registration.component';
import { JobListComponent } from './job-list/job-list.component';
import { PostJobComponent } from './post-job/post-job.component';
import { ApplicationsComponent } from './applications/applications.component';
import { ResumeComponent } from './resume/resume.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegistrationComponent },
  { path: 'jobs', component: JobListComponent },
  { path: 'post-job', component: PostJobComponent },
  { path: 'applications', component: ApplicationsComponent },
  { path: 'resume', component: ResumeComponent }
];
