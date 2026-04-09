# Smart Job Portal System — Project Roadmap

## Phase 1: Entities & Repositories (COMPLETED ✅)
- [x] Step 1: `pom.xml` (Aligned with 3.2.0 and JAXB)
- [x] Step 2: `application.properties` (Aligned for JWT secret and multipart)
- [x] Step 3: `User` entity (Aligned)
- [x] Step 4: `Job` entity (Aligned)
- [x] Step 5: `Application` entity (Aligned)
- [x] Step 6: `Resume` entity (Aligned)
- [x] Step 7: `UserRepository` (Added `existsByUsername`)
- [x] Step 8: `JobRepository` (Added `findByLocationContainingIgnoreCase`)
- [x] Step 9: `ApplicationRepository` (Added `findByJobIn`)
- [x] Step 10: `ResumeRepository` (Aligned)
- [x] Step 11: `JobPortalSystemApplication` (Aligned)

## Phase 2: JWT & Security (COMPLETED ✅)
- [x] Step 1: `JwtUtil.java` (generateToken, extractUsername, extractRole, validateToken)
- [x] Step 2: `JwtRequestFilter.java` (doFilterInternal)
- [x] Step 3: `SecurityConfig.java` (Stateless, role-based protection)
- [x] Step 4: `UserService.java` (Auth part - loadByUsername, registerUser)
- [x] Step 5: `AuthController.java` (POST register, POST login)

## Phase 3: Service Layer (COMPLETED ✅)
- [x] `UserService.java` (Complete - getAllUsers, getUserByUsername)
- [x] `JobService.java` (createJob, updateJob, deleteJob, getAllJobs, searchJobs, getJobsByRecruiter)
- [x] `ApplicationService.java` (applyForJob, getApplicationsForRecruiter, getApplicationsByApplicant, updateStatus, getAllApplications)
- [x] `ResumeService.java` (uploadResume, getResumeByUsername)

## Phase 4: Controllers
- [ ] `AdminController.java` (GET /api/admin/users, GET /api/admin/jobs)
- [ ] `RecruiterController.java` (Job CRUD, applications list, status update)
- [ ] `JobSeekerController.java` (search jobs, apply, upload resume, my applications)

## Phase 5: Frontend Core
- [ ] `auth.service.ts` (Session storage: token, role, username)
- [ ] `http.service.ts` (Angular service layer for all backend APIs)
- [ ] `login.component.[ts|html]` (Auth UI)
- [ ] `registration.component.[ts|html]` (Auth UI)

## Phase 6: Frontend Feature Components
- [ ] `job-list.component.[ts|html]` (Browse & Search)
- [ ] `post-job.component.[ts|html]` (Recruiter Dashboard - Post Job)
- [ ] `applications.component.[ts|html]` (Track & Manage Applications)
- [ ] `resume.component.[ts|html]` (Resume Upload Interface)

## Phase 7: Backend Test Cases
- [ ] `UserServiceTest.java` (Registration, Role assignment)
- [ ] `JobServiceTest.java` (Job persistence, CRUD, search)
- [ ] `ApplicationServiceTest.java` (Mapping validation, Status update)
- [ ] `AuthControllerIntegrationTest.java` (JWT, role restriction)

## Final Master Checklist
- [ ] Verify 19 Backend Files
- [ ] Verify 14 Frontend Files
- [ ] Verify 13 API Endpoints
- [ ] Verify 7 Backend Test Areas
- [ ] Verify Sample Flow from Document
