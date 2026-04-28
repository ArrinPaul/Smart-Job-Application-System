import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse, RegisterRequest, User } from '../models/user.model';
import { Job, Application, UpdateApplicationStatusRequest } from '../models/job.model';
import { AdminDashboardSummary, AdminSystemStatus } from '../models/admin.model';

/**
 * HTTP Service for all API communication
 */
@Injectable({
  providedIn: 'root'
})
export class HttpService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ==================== AUTHENTICATION ====================

  /**
   * Register a new user
   */
  register(request: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/register`, request);
  }

  /**
   * Login user and get JWT token
   */
  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, request);
  }

  completeOnboarding(profileData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/onboarding/complete`, profileData);
  }

  /**
   * Get onboarding status and progress
   */
  getOnboardingStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/onboarding/status`);
  }

  /**
   * Get current onboarding/profile data for the user
   */
  getOnboardingProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/onboarding/profile`);
  }

  /**
   * Save onboarding step data
   */
  saveOnboardingStep(step: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/onboarding/step/${step}`, data);
  }

  /**
   * Complete onboarding final step
   */
  completeOnboardingFinal(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/onboarding/step/5`, {});
  }

  /**
   * Skip onboarding
   */
  skipOnboarding(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/onboarding/skip`, {});
  }

  /**
   * Logout user and clear auth cookie
   */
  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/logout`, {});
  }

  // ==================== JOB MANAGEMENT ====================

  /**
   * Get all jobs with optional filtering
   */
  getJobs(searchTitle?: string, searchLocation?: string): Observable<Job[]> {
    let url = `${this.apiUrl}/jobs`;
    const params = new URLSearchParams();
    if (searchTitle) params.append('title', searchTitle);
    if (searchLocation) params.append('location', searchLocation);
    if (params.toString()) {
      url += '?' + params.toString();
    }
    return this.http.get<Job[]>(url);
  }

  /**
   * Get single job by ID
   */
  getJob(id: number): Observable<Job> {
    return this.http.get<Job>(`${this.apiUrl}/jobs/${id}`);
  }

  /**
   * Get single job by slug
   */
  getJobBySlug(slug: string): Observable<Job> {
    return this.http.get<Job>(`${this.apiUrl}/jobs/${slug}`);
  }

  /**
   * Create new job (Recruiter only)
   */
  createJob(job: any): Observable<Job> {
    return this.http.post<Job>(`${this.apiUrl}/recruiter/jobs`, job);
  }

  /**
   * Update job (Recruiter only)
   */
  updateJob(id: number, job: any): Observable<Job> {
    return this.http.put<Job>(`${this.apiUrl}/recruiter/jobs/${id}`, job);
  }

  /**
   * Get recruiter's own jobs
   */
  getRecruiterJobs(): Observable<Job[]> {
    return this.http.get<Job[]>(`${this.apiUrl}/recruiter/jobs`);
  }

  /**
   * Delete job (Recruiter only)
   */
  deleteJob(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/recruiter/jobs/${id}`);
  }

  // ==================== APPLICATIONS ====================

  /**
   * Get applications
   */
  getApplications(userId?: number): Observable<Application[]> {
    let url = `${this.apiUrl}/applications`;
    if (userId) url += `?userId=${userId}`;
    return this.http.get<Application[]>(url);
  }

  /**
   * Get recruiter's job applications
   */
  getRecruiterApplications(): Observable<Application[]> {
    return this.http.get<Application[]>(`${this.apiUrl}/recruiter/applications`);
  }

  /**
   * Get Job Applicant's own applications
   */
  getMyApplications(): Observable<Application[]> {
    return this.http.get<Application[]>(`${this.apiUrl}/jobseeker/applications`);
  }

  /**
   * Apply to a job
   */
  applyJob(jobId: number, resumeId?: number): Observable<Application> {
    return this.http.post<Application>(`${this.apiUrl}/job/apply`, { jobId, resumeId });
  }

  /**
   * Update application status (Recruiter only)
   */
  updateApplicationStatus(applicationId: number, status: string): Observable<Application> {
    const request = { status };
    return this.http.put<Application>(`${this.apiUrl}/recruiter/applications/${applicationId}/status`, request);
  }

  // ==================== RESUME ====================

  /**
   * Upload resume file
   */
  uploadResume(file: File, fileName: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', fileName);
    return this.http.post(`${this.apiUrl}/jobseeker/resume`, formData);
  }

  /**
   * Get user's resumes
   */
  getResumes(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/resume/user/${userId}`);
  }

  /**
   * Download resume
   */
  downloadResume(resumeId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/resume/${resumeId}`, { responseType: 'blob' });
  }

  /**
   * Delete resume
   */
  deleteResume(resumeId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/resume/${resumeId}`);
  }

  /**
   * Get job recommendations for current user
   */
  getJobRecommendations(limit: number = 10): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/jobseeker/recommendations?limit=${limit}`);
  }

  // ==================== ADMIN ====================

  /**
   * Get all users (Admin only)
   */
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/admin/users`);
  }

  /**
   * Get all jobs (Admin only)
   */
  getAllJobsAdmin(): Observable<Job[]> {
    return this.http.get<Job[]>(`${this.apiUrl}/admin/jobs`);
  }

  /**
   * Get admin dashboard summary
   */
  getAdminDashboardSummary(): Observable<AdminDashboardSummary> {
    return this.http.get<AdminDashboardSummary>(`${this.apiUrl}/admin/dashboard/summary`);
  }

  /**
   * Get admin system status
   */
  getAdminSystemStatus(): Observable<AdminSystemStatus> {
    return this.http.get<AdminSystemStatus>(`${this.apiUrl}/admin/system/status`);
  }

  /**
   * Manually trigger job scraping (Admin only)
   */
  triggerJobScraping(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/admin/scrape-now`, {});
  }

  /**
   * Get smart insights for a job (Job Applicant only)
   */
  getJobMatchInsights(jobId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/jobseeker/insights/match/${jobId}`);
  }

  /**
   * Delete user (Admin only)
   */
  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/users/${userId}`);
  }

  /**
   * Get user details by ID (Admin only)
   */
  getUserById(userId: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/admin/users/${userId}`);
  }

  /**
   * Update user role (Admin only)
   */
  updateUserRole(userId: number, newRole: string): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/admin/users/${userId}/role`, { role: newRole });
  }

  /**
   * Update user password (Admin only)
   */
  updateUserPassword(userId: number, newPassword: string): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/admin/users/${userId}/password`, { password: newPassword });
  }

  /**
   * Update user details (Admin only)
   */
  updateUser(userId: number, userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/admin/users/${userId}`, userData);
  }

  /**
   * Delete job (Admin only)
   */
  deleteJobAdmin(jobId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/jobs/${jobId}`);
  }

  /**
   * Update job (Admin only)
   */
  updateJobAdmin(jobId: number, jobData: any): Observable<Job> {
    return this.http.put<Job>(`${this.apiUrl}/admin/jobs/${jobId}`, jobData);
  }
}
