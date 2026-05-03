import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse, RegisterRequest, User } from '../models/user.model';
import { Job, Application, UpdateApplicationStatusRequest, UpdateApplicationDetailsRequest } from '../models/job.model';
import { AdminDashboardSummary, AdminSystemStatus } from '../models/admin.model';
import { JobRecommendation, JobMatchInsights } from '../models/recommendation.model';

/**
 * HTTP Service for all API communication
 */
@Injectable({
  providedIn: 'root'
})
export class HttpService {
  private apiUrl = environment.apiUrl;
  private onboardingStatus$: Observable<any> | null = null;

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
   * Update current user profile
   */
  updateProfile(profileData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/onboarding/complete`, profileData);
  }

  /**
   * Get onboarding status and progress
   */
  getOnboardingStatus(): Observable<any> {
    if (!this.onboardingStatus$) {
      this.onboardingStatus$ = this.http.get(`${this.apiUrl}/auth/onboarding/status`).pipe(
        shareReplay(1)
      );
    }
    return this.onboardingStatus$;
  }

  /**
   * Clear onboarding status cache
   */
  clearOnboardingCache(): void {
    this.onboardingStatus$ = null;
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
    this.clearOnboardingCache();
    return this.http.post(`${this.apiUrl}/auth/onboarding/step/${step}`, data);
  }

  /**
   * Complete onboarding final step
   */
  completeOnboardingFinal(): Observable<any> {
    this.clearOnboardingCache();
    return this.http.post(`${this.apiUrl}/auth/onboarding/step/5`, {});
  }

  /**
   * Get current user profile data
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/onboarding/profile`);
  }

  /**
   * Skip onboarding
   */
  skipOnboarding(): Observable<any> {
    this.clearOnboardingCache();
    return this.http.post(`${this.apiUrl}/auth/onboarding/skip`, {});
  }

  /**
   * Logout user and clear auth cookie
   */
  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/logout`, {});
  }

  /**
   * Get public portal statistics for the landing page
   */
  getPortalStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/public/portal-stats`);
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
   * Translate a job's content on demand
   */
  translateJob(jobId: number): Observable<{ success: boolean; message: string; job: Job }> {
    return this.http.post<{ success: boolean; message: string; job: Job }>(
      `${this.apiUrl}/jobs/${jobId}/translate`,
      {}
    );
  }

  /**
   * Get a translation preview without saving changes
   */
  getTranslationPreview(jobId: number): Observable<{ original: Record<string, string>; translated: Record<string, string>; hasChanges: boolean }> {
    return this.http.get<{ original: Record<string, string>; translated: Record<string, string>; hasChanges: boolean }>(
      `${this.apiUrl}/jobs/${jobId}/translate-preview`
    );
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
  getRecruiterApplications(stage?: string): Observable<Application[]> {
    let url = `${this.apiUrl}/recruiter/applications`;
    if (stage) url += `?stage=${stage}`;
    return this.http.get<Application[]>(url);
  }

  /**
   * Get recruiter's application pipeline statistics
   */
  getRecruiterApplicationStats(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.apiUrl}/recruiter/applications/stats`);
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

  /**
   * Update detailed application information (Recruiter only)
   */
  updateApplicationDetails(applicationId: number, request: UpdateApplicationDetailsRequest): Observable<Application> {
    return this.http.put<Application>(`${this.apiUrl}/recruiter/applications/${applicationId}/details`, request);
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
  getJobRecommendations(limit: number = 10): Observable<JobRecommendation[]> {
    return this.http.get<JobRecommendation[]>(`${this.apiUrl}/jobseeker/recommendations?limit=${limit}`);
  }

  // ==================== ADMIN ====================

  /**
   * Get all users (Admin only)
   */
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/admin/users`);
  }

  /**
   * Get all jobs (Admin only) with optional filtering
   */
  getAllJobsAdmin(title?: string, location?: string): Observable<Job[]> {
    let url = `${this.apiUrl}/admin/jobs`;
    const params = new URLSearchParams();
    if (title) params.append('title', title);
    if (location) params.append('location', location);
    
    if (params.toString()) {
      url += '?' + params.toString();
    }
    return this.http.get<Job[]>(url);
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
  getJobMatchInsights(jobId: number): Observable<JobMatchInsights> {
    return this.http.get<JobMatchInsights>(`${this.apiUrl}/jobseeker/insights/match/${jobId}`);
  }

  /**
   * Delete user (Admin only)
   */
  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/users/${userId}`);
  }

  /**
   * Get user details by ID (General access)
   */
  getUserById(userId: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${userId}`);
  }

  /**
   * Get user details by ID (Admin only - keeping for admin features if needed)
   */
  getUserByIdAdmin(userId: number): Observable<User> {
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

  // ==================== CHATBOT ====================

  /**
   * Send a message to the AI chatbot
   */
  sendMessage(message: string, jobId?: number): Observable<{ response: string }> {
    const payload: any = { message };
    if (jobId) payload.jobId = jobId.toString();
    return this.http.post<{ response: string }>(`${this.apiUrl}/chat/message`, payload);
  }

  /**
   * Get chat history for the current user
   */
  getChatHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/chat/history`);
  }
}
