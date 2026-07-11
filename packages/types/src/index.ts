export type UserRole = 'CANDIDATE' | 'COMPANY';

export type ApplicationStatus =
  | 'RECEIVED'
  | 'IN_REVIEW'
  | 'INTERVIEW'
  | 'REJECTED'
  | 'ACCEPTED';

export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

export interface CandidateProfileDto {
  id: string;
  fullName: string;
  title?: string;
  bio?: string;
  skills: string[];
}

export interface CompanyProfileDto {
  id: string;
  name: string;
  logoUrl?: string;
  description?: string;
  sector?: string;
}

export interface JobDto {
  id: string;
  companyProfileId: string;
  title: string;
  description: string;
  requiredSkills: string[];
  contractType: string;
  location: string;
  status: JobStatus;
}

export interface ApplicationDto {
  id: string;
  jobId: string;
  candidateProfileId: string;
  resumeId: string;
  status: ApplicationStatus;
  matchScore?: number;
}

export interface ResumeAnalysisResult {
  parsedSkills: string[];
  matchScore?: number;
  missingSkills?: string[];
}
