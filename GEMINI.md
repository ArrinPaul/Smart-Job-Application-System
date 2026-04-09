# Smart Job Portal System - Project Master Context

This project is built **strictly** according to the "Master Prompt" documentation. Every endpoint, file path, and test case maps 1:1 to the plan.

## Project Information
- **App Name:** jobportalsystem
- **Base Package:** `com.edutech.jobportalsystem`
- **Spring Boot Version:** 3.2.0
- **Java Version:** 17
- **Database:** MySQL (jobportal_db)

## Core Functional Requirements
1. **User Registration & Profile Management:** Secure accounts and role-based profiles.
2. **Job Management:** Recruiters can CRUD job postings.
3. **Job Search & Filtering:** Job seekers filter by skills, location, etc.
4. **Application Management:** Applicants apply; recruiters manage status.
5. **Resume Management:** Binary upload (LONGBLOB) for resumes.
6. **Role-Based Authentication:** ADMIN, RECRUITER, JOB_SEEKER.
7. **JWT Authorization:** Stateless secure API communication.

## Detailed Backend File Map (Strict)
- `config/SecurityConfig.java`
- `controller/AdminController.java`, `RecruiterController.java`, `JobSeekerController.java`, `AuthController.java`
- `entity/User.java`, `Job.java`, `Application.java`, `Resume.java`
- `jwt/JwtRequestFilter.java`, `JwtUtil.java`
- `repository/UserRepository.java`, `JobRepository.java`, `ApplicationRepository.java`, `ResumeRepository.java`
- `service/UserService.java`, `JobService.java`, `ApplicationService.java`, `ResumeService.java`

## Detailed Frontend File Map (Strict)
- `app/login/login.component.[ts|html]`
- `app/registration/registration.component.[ts|html]`
- `app/job-list/job-list.component.[ts|html]`
- `app/post-job/post-job.component.[ts|html]`
- `app/applications/applications.component.[ts|html]`
- `app/resume/resume.component.[ts|html]`
- `services/http.service.ts`, `services/auth.service.ts`

## Technical Constraints (Strict)
- **JWT Secret:** `smartjobportalsecretkey2024`
- **JWT Expiration:** `86400000` (24 hours)
- **Multipart Limit:** `5MB`
- **Hibernate Dialect:** `org.hibernate.dialect.MySQL8Dialect`
- **Auth Authorities:** Roles must be prefixed with `ROLE_` (e.g., `ROLE_RECRUITER`).
