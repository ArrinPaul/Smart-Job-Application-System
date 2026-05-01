// Job and Application Models
export interface Job {
  id: number;
  title: string;
  description: string;
  location: string;
  jobType?: string;
  workType?: string;
  experienceRequired?: number;
  requiredSkills?: string;
  educationRequired?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  isActive?: boolean;
  applicationLink?: string;
  companyName?: string;
  howToApply?: string;
  slug: string;
  postedBy?: {
    id: number;
    username: string;
    companyName?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateJobRequest {
  title: string;
  description: string;
  location: string;
  jobType?: string;
  workType?: string;
  experienceRequired?: number;
  requiredSkills?: string;
  educationRequired?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  applicationLink?: string;
  companyName?: string;
  howToApply?: string;
}

export interface Application {
  id: number;
  applicant: {
    id: number;
    username: string;
    email: string;
    fullName?: string;
    headline?: string;
    location?: string;
    skills?: string;
  };
  job: {
    id: number;
    title: string;
    location: string;
    jobType?: string;
  };
  status: ApplicationStatus;
  appliedAt?: string;
  updatedAt?: string;
  aiMatchScore?: number;
  resume?: ResumeMetadata;
}

export interface ResumeMetadata {
  id: number;
  fileName: string;
  fileType?: string;
  uploadedAt?: string;
}

export enum ApplicationStatus {
  APPLIED = 'APPLIED',
  SHORTLISTED = 'SHORTLISTED',
  REJECTED = 'REJECTED',
  HIRED = 'HIRED'
}

export interface UpdateApplicationStatusRequest {
  status: ApplicationStatus;
}
