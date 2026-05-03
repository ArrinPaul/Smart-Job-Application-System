// Development environment configuration
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  apiBaseUrl: 'http://localhost:8080/api',
  translationEnabled: true,
  translationApiUrl: 'http://localhost:8080/api/public',
  translationTarget: 'English',
  requestTimeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  api: {
    auth: '/auth',
    jobs: '/jobs',
    jobApplicant: '/job-seeker',
    recruiter: '/recruiter',
    admin: '/admin',
    applications: '/applications',
    users: '/users'
  }
};
