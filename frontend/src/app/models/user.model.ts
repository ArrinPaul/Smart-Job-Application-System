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
}

export interface LoginResponse {
  token: string;
  role: UserRole;
  username: string;
  id?: number;
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
