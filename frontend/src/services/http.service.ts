// File: ./src/services/http.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';
import { User, LoginRequest, LoginResponse, RegisterRequest, UserRole } from '../app/models/user.model';
import { Job, CreateJobRequest, Application, UpdateApplicationStatusRequest } from '../app/models/job.model';

@Injectable({ providedIn: 'root' })
export class HttpService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  // ============ Authentication Endpoints ============

  register(data: RegisterRequest): Observable<User> {
    return this.http.post<User>(
      `${this.baseUrl}${environment.api.auth}/register`,
      data
    );
  }

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.baseUrl}${environment.api.auth}/login`,
      data
    );
  }

  // ============ Job Seeker Endpoints ============

  searchJobs(title?: string, location?: string): Observable<Job[]> {
    let params = new HttpParams();
    if (title?.trim()) {
      params = params.set('title', title);
    }
    if (location?.trim()) {
      params = params.set('location', location);
    }
    return this.http.get<Job[]>(
      `${this.baseUrl}${environment.api.jobs}`,
      { params }
    );
  }

  applyForJob(jobId: number, userId: number): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}${environment.api.jobSeeker}/apply?jobId=${jobId}`,
      { userId }
    );
  }

  uploadResume(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(
      `${this.baseUrl}${environment.api.jobSeeker}/resume`,
      formData
    );
  }

  getMyApplications(): Observable<Application[]> {
    return this.http.get<Application[]>(
      `${this.baseUrl}${environment.api.jobSeeker}/applications`
    );
  }

  // ============ Recruiter Endpoints ============

  createJob(jobData: CreateJobRequest): Observable<Job> {
    return this.http.post<Job>(
      `${this.baseUrl}${environment.api.recruiter}/job`,
      jobData
    );
  }

  updateJob(jobId: number, jobData: CreateJobRequest): Observable<Job> {
    return this.http.put<Job>(
      `${this.baseUrl}${environment.api.recruiter}/job/${jobId}`,
      jobData
    );
  }

  deleteJob(jobId: number): Observable<any> {
    return this.http.delete<any>(
      `${this.baseUrl}${environment.api.recruiter}/job/${jobId}`
    );
  }

  getRecruiterApplications(): Observable<Application[]> {
    return this.http.get<Application[]>(
      `${this.baseUrl}${environment.api.recruiter}/applications`
    );
  }

  getRecruiterJobs(): Observable<Job[]> {
    return this.http.get<Job[]>(
      `${this.baseUrl}${environment.api.recruiter}/jobs`
    );
  }

  updateApplicationStatus(applicationId: number, status: string): Observable<Application> {
    return this.http.put<Application>(
      `${this.baseUrl}${environment.api.recruiter}/application/update/${applicationId}?status=${status}`,
      null
    );
  }

  // ============ Admin Endpoints ============

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(
      `${this.baseUrl}${environment.api.admin}/users`
    );
  }

  getAllJobsAdmin(): Observable<Job[]> {
    return this.http.get<Job[]>(
      `${this.baseUrl}${environment.api.admin}/jobs`
    );
  }
}
