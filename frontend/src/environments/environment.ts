// Development environment configuration
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  apiBaseUrl: 'http://localhost:8080/api',
  requestTimeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  api: {
    auth: '/auth',
    jobs: '/jobs',
    jobSeeker: '/job-seeker',
    recruiter: '/recruiter',
    admin: '/admin',
    applications: '/applications',
    users: '/users'
  }
};
