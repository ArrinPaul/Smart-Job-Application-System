export interface JobRecommendation {
  jobId: number;
  jobTitle: string;
  companyName: string;
  location: string;
  workType: string;
  salaryMin: number;
  salaryMax: number;
  matchPercentage: number;
  matchReasons: string[];
  aiExplanation?: string;
  slug: string;
}

export interface JobMatchInsights {
  jobId: number;
  jobTitle: string;
  compatibilityScore: number;
  matchLevel: string;
  topMatches: string[];
  improvementAreas: string[];
  recommendations: string[];
  aiInsights?: string;
  error?: string;
}
