// User and Authentication Models
export interface User {
  id: number;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt?: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  RECRUITER = 'RECRUITER',
  JOB_SEEKER = 'JOB_SEEKER'
}

export interface LoginRequest {
  username: string;
  password: string;
  captchaToken?: string;
}

export interface LoginResponse {
  role: UserRole;
  username: string;
  id?: number;
  mfaEnabled?: boolean;
  token?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface ErrorResponse {
  status: number;
  message: string;
  path?: string;
  timestamp?: string;
}
