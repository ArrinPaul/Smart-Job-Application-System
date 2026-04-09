# Smart Job Portal System — 4-Vertical Execution Roadmap

This roadmap is reorganized into 4 verticals:
1. Backend
2. Frontend
3. Database
4. Remaining (Testing, Validation, Documentation, Operations)

Status legend:
- Completed = done and present in workspace
- In Progress = partially done
- Pending = not started

## Vertical 1: Backend (Completed with minor verification pending)

### A) Core Setup and Domain Layer (Completed ✅)
- [x] `pom.xml` aligned to Spring Boot 3.2.0 and Java 17
- [x] Main application bootstrapped (`JobPortalSystemApplication.java`)
- [x] Entities created: `User`, `Job`, `Application`, `Resume`
- [x] Repositories created: `UserRepository`, `JobRepository`, `ApplicationRepository`, `ResumeRepository`

### B) Security and Authentication (Completed ✅)
- [x] JWT utility implemented (`JwtUtil.java`)
- [x] JWT filter implemented (`JwtRequestFilter.java`)
- [x] Security configuration implemented (`SecurityConfig.java`)
- [x] Authentication endpoints implemented (`AuthController.java`)

### C) Business Services (Completed ✅)
- [x] `UserService` implemented for auth + user retrieval
- [x] `JobService` implemented for recruiter CRUD + search
- [x] `ApplicationService` implemented for apply/list/status update flows
- [x] `ResumeService` implemented for upload and retrieval

### D) API Controllers (Completed ✅)
- [x] `AdminController` implemented
- [x] `RecruiterController` implemented
- [x] `JobSeekerController` implemented

### E) Backend Verification Tasks (Pending ⏳)
- [ ] Re-verify all 13 required endpoints with real JWT flow
- [ ] Re-validate role restrictions for ADMIN/RECRUITER/JOB_SEEKER on each protected route

## Vertical 2: Frontend (Pending)

### A) Frontend Core (Pending ⏳)
- [ ] `src/services/auth.service.ts`
- [ ] `src/services/http.service.ts`
- [ ] `src/app/login/login.component.ts`
- [ ] `src/app/login/login.component.html`
- [ ] `src/app/registration/registration.component.ts`
- [ ] `src/app/registration/registration.component.html`

### B) Feature Components (Pending ⏳)
- [ ] `src/app/job-list/job-list.component.ts`
- [ ] `src/app/job-list/job-list.component.html`
- [ ] `src/app/post-job/post-job.component.ts`
- [ ] `src/app/post-job/post-job.component.html`
- [ ] `src/app/applications/applications.component.ts`
- [ ] `src/app/applications/applications.component.html`
- [ ] `src/app/resume/resume.component.ts`
- [ ] `src/app/resume/resume.component.html`

### C) Frontend Integration and UX Verification (Pending ⏳)
- [ ] Connect all components to backend endpoints through `http.service.ts`
- [ ] Implement JWT session handling and role-based rendering using `auth.service.ts`
- [ ] Validate recruiter journey end-to-end on UI
- [ ] Validate job seeker journey end-to-end on UI

## Vertical 3: Database (In Progress)

### A) Database Modeling and Mapping (Completed ✅)
- [x] JPA entity mapping for users, jobs, applications, resumes
- [x] Relationship mapping configured (`@ManyToOne`, `@OneToOne`, join columns)
- [x] Audit timestamps handled with `@PrePersist`
- [x] Resume binary storage mapped as `LONGBLOB`

### B) Database Connectivity and Runtime Config (Completed ✅)
- [x] MySQL datasource configuration present in `application.properties`
- [x] Hibernate auto-update enabled (`spring.jpa.hibernate.ddl-auto=update`)
- [x] SQL logging enabled for debugging

### C) Database Operational Readiness (Pending ⏳)
- [ ] Ensure local MySQL database exists: `jobportal_db`
- [ ] Confirm DB credentials are valid for local runtime
- [ ] Run app and verify all required tables are auto-created
- [ ] Validate uniqueness constraints (username, email) at DB level

## Vertical 4: Remaining (Everything Else)

### A) Automated Testing (In Progress)
- [x] Backend test classes exist:
	- `src/test/java/com/edutech/jobportalsystem/service/UserServiceTest.java`
	- `src/test/java/com/edutech/jobportalsystem/service/JobServiceTest.java`
	- `src/test/java/com/edutech/jobportalsystem/service/ApplicationServiceTest.java`
	- `src/test/java/com/edutech/jobportalsystem/controller/AuthControllerIntegrationTest.java`
- [ ] Re-run test suite and confirm all tests pass green
- [ ] Add/fix missing assertions only if any required test case is not covered

### B) Endpoint and Flow Validation (Pending ⏳)
- [ ] Validate all 13 API endpoints against required request/response behavior
- [ ] Validate sample flow sequence:
	- Recruiter register/login
	- Recruiter posts job
	- Job seeker register/login
	- Job seeker searches/applies
	- Recruiter views applications
	- Recruiter updates status

### C) Documentation and Sign-off (Pending ⏳)
- [ ] Update completion matrix for 19 backend files
- [ ] Update completion matrix for 14 frontend files
- [ ] Mark final compliance against 7 required backend test categories
- [ ] Final release readiness check (backend + frontend + database + tests)

## Execution Order (Recommended)
1. Finish Vertical 2 (Frontend implementation)
2. Complete Vertical 3C (Database readiness checks)
3. Complete Vertical 4A and 4B (tests + endpoint verification)
4. Close Vertical 4C (documentation and final sign-off)

## Quick Health Snapshot
- Backend: strong and mostly complete
- Frontend: not started yet
- Database: configured, needs runtime validation
- Remaining validation/testing/docs: partially done, needs closure
