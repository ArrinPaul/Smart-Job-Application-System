export interface AdminKpis {
  totalUsers: number;
  totalJobs: number;
  totalApplications: number;
  activeUsers: number;
  activeJobs: number;
  jobsPostedToday: number;
}

export interface AdminSystemStatus {
  apiStatus: string;
  overallHealth: string;
  databaseStatus: string;
  uptimeSeconds: number;
  serverTime: string;
  javaVersion: string;
  healthDetails?: Record<string, unknown>;
}

export interface AdminDashboardSummary {
  generatedAt: string;
  kpis: AdminKpis;
  usersByRole: Record<string, number>;
  applicationsByStatus: Record<string, number>;
  recentJobs: Array<{
    id: number;
    title: string;
    location: string;
    createdAt: string;
    postedBy: string;
  }>;
  metricDefinitions: Record<string, string>;
  systemStatus: AdminSystemStatus;
}
