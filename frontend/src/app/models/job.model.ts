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
  internalNotes?: string;
  interviewDate?: string;
  interviewLocation?: string;
  recruiterFeedback?: string;
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
  PHONE_SCREEN = 'PHONE_SCREEN',
  TECHNICAL_INTERVIEW = 'TECHNICAL_INTERVIEW',
  ON_SITE_INTERVIEW = 'ON_SITE_INTERVIEW',
  OFFER_EXTENDED = 'OFFER_EXTENDED',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
  HOLD = 'HOLD'
}

export interface UpdateApplicationStatusRequest {
  status: ApplicationStatus;
}

export interface UpdateApplicationDetailsRequest {
  status?: ApplicationStatus;
  internalNotes?: string;
  interviewDate?: string;
  interviewLocation?: string;
  recruiterFeedback?: string;
}
