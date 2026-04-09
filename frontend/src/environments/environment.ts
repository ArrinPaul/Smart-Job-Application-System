// Development environment configuration
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080',
  api: {
    auth: '/api/auth',
    jobs: '/api/jobs',
    recruiter: '/api/recruiter',
    jobSeeker: '/api/jobseeker',
    admin: '/api/admin'
  },
  // Token configuration
  tokenKey: 'auth_token',
  roleKey: 'user_role',
  usernameKey: 'username',
  userIdKey: 'user_id',
  
  // API timeouts (in milliseconds)
  requestTimeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
};
