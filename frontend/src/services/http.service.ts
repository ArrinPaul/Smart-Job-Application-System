// File: ./src/services/http.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class HttpService {
  private BASE_URL = 'http://localhost:8080';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': 'Bearer ' + this.authService.getToken()
    });
  }

  // Public endpoints
  register(data: any): Observable<any> {
    return this.http.post(`${this.BASE_URL}/api/auth/register`, data);
  }

  login(data: any): Observable<any> {
    return this.http.post(`${this.BASE_URL}/api/auth/login`, data);
  }

  // Job Seeker endpoints
  searchJobs(title?: string, location?: string): Observable<any> {
    let params = new HttpParams();
    if (title) {
      params = params.set('title', title);
    }
    if (location) {
      params = params.set('location', location);
    }
    return this.http.get(`${this.BASE_URL}/api/jobs`, {
      headers: this.getAuthHeaders(),
      params: params
    });
  }

  applyForJob(jobId: number, userId: number): Observable<any> {
    return this.http.post(`${this.BASE_URL}/api/job/apply?jobId=${jobId}`, { userId: userId }, {
      headers: this.getAuthHeaders()
    });
  }

  uploadResume(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.BASE_URL}/api/jobseeker/resume`, formData, {
      headers: this.getAuthHeaders()
    });
  }

  getMyApplications(): Observable<any> {
    return this.http.get(`${this.BASE_URL}/api/jobseeker/applications`, {
      headers: this.getAuthHeaders()
    });
  }

  // Recruiter endpoints
  createJob(jobData: any): Observable<any> {
    return this.http.post(`${this.BASE_URL}/api/recruiter/job`, jobData, {
      headers: this.getAuthHeaders()
    });
  }

  updateJob(jobId: number, jobData: any): Observable<any> {
    return this.http.put(`${this.BASE_URL}/api/recruiter/job/${jobId}`, jobData, {
      headers: this.getAuthHeaders()
    });
  }

  deleteJob(jobId: number): Observable<any> {
    return this.http.delete(`${this.BASE_URL}/api/recruiter/job/${jobId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getRecruiterApplications(): Observable<any> {
    return this.http.get(`${this.BASE_URL}/api/recruiter/applications`, {
      headers: this.getAuthHeaders()
    });
  }

  getRecruiterJobs(): Observable<any> {
    return this.http.get(`${this.BASE_URL}/api/recruiter/jobs`, {
      headers: this.getAuthHeaders()
    });
  }

  updateApplicationStatus(applicationId: number, status: string): Observable<any> {
    return this.http.put(`${this.BASE_URL}/api/recruiter/application/update/${applicationId}?status=${status}`, null, {
      headers: this.getAuthHeaders()
    });
  }

  // Admin endpoints
  getAllUsers(): Observable<any> {
    return this.http.get(`${this.BASE_URL}/api/admin/users`, {
      headers: this.getAuthHeaders()
    });
  }

  getAllJobsAdmin(): Observable<any> {
    return this.http.get(`${this.BASE_URL}/api/admin/jobs`, {
      headers: this.getAuthHeaders()
    });
  }
}
