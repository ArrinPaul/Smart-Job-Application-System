// Production environment configuration
export const environment = {
  production: true,
  // This will be replaced by the build process or can be set via env variables if using a custom build script
  apiUrl: '/api', // Default to relative path for same-domain or proxy setup
  apiBaseUrl: '/api',
  translationEnabled: true,
  translationApiUrl: 'https://libretranslate.de',
  translationTarget: 'en',
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
