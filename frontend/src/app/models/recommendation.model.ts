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
}
