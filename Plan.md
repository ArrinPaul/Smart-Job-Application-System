# Smart Job Portal System — Master Prompt (Strictly Document-Faithful)

> This document is built **strictly** from the problem statement provided.
> Nothing has been added beyond what the document specifies.
> Every file name, endpoint, test case, and feature maps 1:1 to the document.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Users of the System](#2-users-of-the-system)
3. [Functional Requirements](#3-functional-requirements)
4. [Technology Stack](#4-technology-stack)
5. [Key Points to Note](#5-key-points-to-note)
6. [Exact Backend Files to Build](#6-exact-backend-files-to-build)
7. [Exact Frontend Files to Build](#7-exact-frontend-files-to-build)
8. [API Endpoints (Exact from Document)](#8-api-endpoints-exact-from-document)
9. [Sample Input & Output (Exact from Document)](#9-sample-input--output-exact-from-document)
10. [Sample Flow (Exact from Document)](#10-sample-flow-exact-from-document)
11. [Test Cases to be Passed (Exact from Document)](#11-test-cases-to-be-passed-exact-from-document)
12. [Phase 1 Master Prompt — Entities & Repositories](#12-phase-1-master-prompt--entities--repositories)
13. [Phase 2 Master Prompt — JWT & Security](#13-phase-2-master-prompt--jwt--security)
14. [Phase 3 Master Prompt — Service Layer](#14-phase-3-master-prompt--service-layer)
15. [Phase 4 Master Prompt — Controllers](#15-phase-4-master-prompt--controllers)
16. [Phase 5 Master Prompt — Frontend Core](#16-phase-5-master-prompt--frontend-core)
17. [Phase 6 Master Prompt — Frontend Feature Components](#17-phase-6-master-prompt--frontend-feature-components)
18. [Phase 7 Master Prompt — Backend Test Cases](#18-phase-7-master-prompt--backend-test-cases)
19. [Master Progress Checklist](#19-master-progress-checklist)

---

## 1. Project Overview

Build an integrated platform designed to streamline the recruitment process by connecting job seekers and recruiters.

- Recruiters can post job openings, manage applications, and track candidates.
- Job seekers can search and apply for jobs.
- The platform ensures efficient hiring workflows and transparent application tracking.

---

## 2. Users of the System

| Role | Responsibilities |
|---|---|
| **Admin** | Manage users, monitor job postings, and oversee platform activity |
| **Recruiter** | Post jobs, review applications, and update candidate status |
| **Job Seeker** | Search jobs, apply, and track application status |

---

## 3. Functional Requirements

These are the exact functional requirements from the document. Every phase prompt below must address all of these:

1. **User Registration & Profile Management** — Users can create accounts, log in, and manage their profiles securely.
2. **Job Management** — Recruiters can create, update, delete, and view job postings.
3. **Job Search & Filtering** — Job seekers can browse and filter jobs based on skills, location, etc.
4. **Application Management** — Job seekers apply to jobs; recruiters manage applications.
5. **Resume Management** — Job seekers upload and manage resumes.
6. **Role-Based Authentication** — Different access levels for Admin, Recruiter, and Job Seeker.
7. **JWT Authorization** — Secure API communication using tokens.
8. **RESTful API & Angular Service Layer** — Backend integration with frontend.

---

## 4. Technology Stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot, JPA, MySQL |
| Frontend | Angular |
| Security | Spring Security, JWT |

---

## 5. Key Points to Note

These must be respected in every phase:

- Secure API endpoints using JWT
- Proper role-based access control
- Scalable design for high job/application volume
- Clean layered architecture

---

## 6. Exact Backend Files to Build

These are the **exact file paths** specified in the document. No extra files should be added.

```
./src/main/java/com/edutech/jobportalsystem/config/SecurityConfig.java

./src/main/java/com/edutech/jobportalsystem/controller/AdminController.java
./src/main/java/com/edutech/jobportalsystem/controller/RecruiterController.java
./src/main/java/com/edutech/jobportalsystem/controller/JobSeekerController.java
./src/main/java/com/edutech/jobportalsystem/controller/AuthController.java

./src/main/java/com/edutech/jobportalsystem/entity/User.java
./src/main/java/com/edutech/jobportalsystem/entity/Job.java
./src/main/java/com/edutech/jobportalsystem/entity/Application.java
./src/main/java/com/edutech/jobportalsystem/entity/Resume.java

./src/main/java/com/edutech/jobportalsystem/jwt/JwtRequestFilter.java
./src/main/java/com/edutech/jobportalsystem/jwt/JwtUtil.java

./src/main/java/com/edutech/jobportalsystem/repository/UserRepository.java
./src/main/java/com/edutech/jobportalsystem/repository/JobRepository.java
./src/main/java/com/edutech/jobportalsystem/repository/ApplicationRepository.java
./src/main/java/com/edutech/jobportalsystem/repository/ResumeRepository.java

./src/main/java/com/edutech/jobportalsystem/service/UserService.java
./src/main/java/com/edutech/jobportalsystem/service/JobService.java
./src/main/java/com/edutech/jobportalsystem/service/ApplicationService.java
./src/main/java/com/edutech/jobportalsystem/service/ResumeService.java
```

**Total: 19 backend files** (plus pom.xml and application.properties for setup)

---

## 7. Exact Frontend Files to Build

These are the **exact file paths** specified in the document. No extra files should be added.

```
./src/app/login/login.component.ts
./src/app/login/login.component.html

./src/app/registration/registration.component.ts
./src/app/registration/registration.component.html

./src/app/job-list/job-list.component.ts
./src/app/job-list/job-list.component.html

./src/app/post-job/post-job.component.ts
./src/app/post-job/post-job.component.html

./src/app/applications/applications.component.ts
./src/app/applications/applications.component.html

./src/app/resume/resume.component.ts
./src/app/resume/resume.component.html

./src/services/http.service.ts
./src/services/auth.service.ts
```

**Total: 14 frontend files**

---

## 8. API Endpoints (Exact from Document)

### For Admin

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register User |
| POST | `/api/auth/login` | Login User |
| GET | `/api/admin/users` | Get All Users |
| GET | `/api/admin/jobs` | Get All Jobs |

### For Recruiters

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/recruiter/job` | Create Job |
| PUT | `/api/recruiter/job/{jobId}` | Update Job |
| DELETE | `/api/recruiter/job/{jobId}` | Delete Job |
| GET | `/api/recruiter/applications` | Get All Applications |
| PUT | `/api/recruiter/application/update/{applicationId}?status=SHORTLISTED` | Update Application Status |

### For Job Seekers

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/jobs` | Search Jobs |
| POST | `/api/job/apply?jobId=1` | Apply for Job |
| POST | `/api/jobseeker/resume` | Upload Resume |
| GET | `/api/jobseeker/applications` | Get My Applications |

---

## 9. Sample Input & Output (Exact from Document)

### POST /api/auth/register
```json
// Recruiter
{ "username": "recruiter1", "password": "12345", "email": "rec1@mail.com", "role": "RECRUITER" }

// Job Seeker
{ "username": "jobseeker1", "password": "12345", "email": "job1@mail.com", "role": "JOB_SEEKER" }
```

### POST /api/auth/login
```json
{ "username": "jobseeker1", "password": "12345" }
```

### POST /api/recruiter/job
```json
{ "title": "Java Developer", "description": "Spring Boot experience required", "location": "Chennai" }
```

### POST /api/job/apply?jobId=1
```json
{ "userId": 1 }
```

### PUT /api/recruiter/application/update/{id}?status=SHORTLISTED
```
(No body required)
```

---

## 10. Sample Flow (Exact from Document)

1. Recruiter registers and logs in
2. Recruiter posts a job
3. Job seeker registers and logs in
4. Job seeker searches and applies
5. Recruiter views applications
6. Recruiter updates status

---

## 11. Test Cases to be Passed (Exact from Document)

### From "Backend Test Cases" section:
| Test Area | What to Test |
|---|---|
| User Registration | Duplicate email validation |
| User Registration | Role assignment correctness |
| Job Posting | Validate job persistence |
| Job Application | Ensure mapping between user and job |
| Application Status Update | Verify recruiter updates |

### From "Test Cases to be Passed" section:
1. User registration and login validation
2. Job posting CRUD operations
3. Job search and filtering
4. Application mapping validation
5. Application status update
6. Role-based API restriction
7. JWT authentication validation

---

## 12. Phase 1 Master Prompt — Entities & Repositories

> **Goal:** Set up the Spring Boot project, configure MySQL, and build all 4 JPA entities and 4 repositories.
> Only the files listed in the document for this layer are generated here.

---

```
You are a senior Spring Boot developer. I am building a Smart Job Portal System.

Your task in this prompt is ONLY: project setup, application.properties, JPA entities,
and repository interfaces.
DO NOT generate services, controllers, JWT classes, or SecurityConfig.

=== PROJECT DETAILS ===
Base Package : com.edutech.jobportalsystem
App Name     : jobportalsystem
Java Version : 17
Build Tool   : Maven
Database     : MySQL

=== STEP 1 — pom.xml ===

Generate a complete pom.xml with:

Parent:
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-parent</artifactId>
  <version>3.2.0</version>

Dependencies needed:
  - spring-boot-starter-web
  - spring-boot-starter-data-jpa
  - spring-boot-starter-security
  - com.mysql:mysql-connector-j (scope: runtime)
  - io.jsonwebtoken:jjwt:0.9.1
  - javax.xml.bind:jaxb-api:2.3.1  ← required for jjwt on Java 17
  - spring-boot-starter-test (scope: test)

Build plugin:
  - spring-boot-maven-plugin

=== STEP 2 — application.properties ===
File: src/main/resources/application.properties

Generate with these exact properties:
  server.port=8080
  spring.datasource.url=jdbc:mysql://localhost:3306/jobportal_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
  spring.datasource.username=root
  spring.datasource.password=root
  spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
  spring.jpa.hibernate.ddl-auto=update
  spring.jpa.show-sql=true
  spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
  jwt.secret=smartjobportalsecretkey2024
  jwt.expiration=86400000
  spring.servlet.multipart.enabled=true
  spring.servlet.multipart.max-file-size=5MB
  spring.servlet.multipart.max-request-size=5MB

=== STEP 3 — Entity: User.java ===
File: ./src/main/java/com/edutech/jobportalsystem/entity/User.java

This entity represents all users in the system: Admin, Recruiter, and Job Seeker.

Fields:
  Long id        → @Id, @GeneratedValue(strategy = GenerationType.IDENTITY)
  String username → @Column(unique = true, nullable = false)
  String password → @Column(nullable = false)  [will be BCrypt-encoded]
  String email    → @Column(unique = true, nullable = false)
  String role     → @Column(nullable = false)
                    Accepted values: "ADMIN", "RECRUITER", "JOB_SEEKER"

Class annotations: @Entity, @Table(name = "users")
Include: no-arg constructor, all-arg constructor, getters and setters for all fields.

=== STEP 4 — Entity: Job.java ===
File: ./src/main/java/com/edutech/jobportalsystem/entity/Job.java

This entity represents job postings created by recruiters.

Fields:
  Long id             → @Id, @GeneratedValue(strategy = GenerationType.IDENTITY)
  String title        → @Column(nullable = false)
  String description  → @Column(columnDefinition = "TEXT")
  String location     → @Column
  User postedBy       → @ManyToOne, @JoinColumn(name = "recruiter_id")
                        Links each job to the recruiter who posted it
  LocalDateTime createdAt → set automatically via @PrePersist

Class annotations: @Entity, @Table(name = "jobs")
Add a @PrePersist method that sets createdAt = LocalDateTime.now()
Include: no-arg constructor, all-arg constructor, getters and setters.

=== STEP 5 — Entity: Application.java ===
File: ./src/main/java/com/edutech/jobportalsystem/entity/Application.java

This entity represents a job seeker's application to a job.

Fields:
  Long id             → @Id, @GeneratedValue(strategy = GenerationType.IDENTITY)
  User applicant      → @ManyToOne, @JoinColumn(name = "applicant_id")
                        The job seeker who applied
  Job job             → @ManyToOne, @JoinColumn(name = "job_id")
                        The job being applied to
  String status       → @Column
                        Default: "APPLIED"
                        Possible values: APPLIED, SHORTLISTED, REJECTED, HIRED
  LocalDateTime appliedAt → set automatically via @PrePersist

Class annotations: @Entity, @Table(name = "applications")
Add a @PrePersist method that sets appliedAt = LocalDateTime.now() and
sets status = "APPLIED" if status is null.
Include: no-arg constructor, all-arg constructor, getters and setters.

=== STEP 6 — Entity: Resume.java ===
File: ./src/main/java/com/edutech/jobportalsystem/entity/Resume.java

This entity stores resumes uploaded by job seekers as binary data.

Fields:
  Long id           → @Id, @GeneratedValue(strategy = GenerationType.IDENTITY)
  User owner        → @OneToOne, @JoinColumn(name = "user_id")
                      Each job seeker has one resume
  String fileName   → @Column
  String fileType   → @Column  (e.g., "application/pdf")
  byte[] data       → @Lob, @Column(columnDefinition = "LONGBLOB")
                      The raw binary file content
  LocalDateTime uploadedAt → set automatically via @PrePersist

Class annotations: @Entity, @Table(name = "resumes")
Add a @PrePersist method that sets uploadedAt = LocalDateTime.now()
Include: no-arg constructor, all-arg constructor, getters and setters.

=== STEP 7 — Repository: UserRepository.java ===
File: ./src/main/java/com/edutech/jobportalsystem/repository/UserRepository.java

Extend JpaRepository<User, Long>

Declare these query methods:
  Optional<User> findByUsername(String username);
  Optional<User> findByEmail(String email);
  Boolean existsByEmail(String email);
  Boolean existsByUsername(String username);

=== STEP 8 — Repository: JobRepository.java ===
File: ./src/main/java/com/edutech/jobportalsystem/repository/JobRepository.java

Extend JpaRepository<Job, Long>

Declare these query methods (to support the Job Search & Filtering requirement):
  List<Job> findByTitleContainingIgnoreCase(String title);
  List<Job> findByLocationContainingIgnoreCase(String location);
  List<Job> findByPostedBy(User recruiter);

=== STEP 9 — Repository: ApplicationRepository.java ===
File: ./src/main/java/com/edutech/jobportalsystem/repository/ApplicationRepository.java

Extend JpaRepository<Application, Long>

Declare these query methods:
  List<Application> findByApplicant(User applicant);
  List<Application> findByJob(Job job);
  List<Application> findByJobIn(List<Job> jobs);
  Boolean existsByApplicantAndJob(User applicant, Job job);

=== STEP 10 — Repository: ResumeRepository.java ===
File: ./src/main/java/com/edutech/jobportalsystem/repository/ResumeRepository.java

Extend JpaRepository<Resume, Long>

Declare:
  Optional<Resume> findByOwner(User owner);

=== STEP 11 — Main Application Class ===
File: src/main/java/com/edutech/jobportalsystem/JobPortalSystemApplication.java

Standard @SpringBootApplication class:
  @SpringBootApplication
  public class JobPortalSystemApplication {
      public static void main(String[] args) {
          SpringApplication.run(JobPortalSystemApplication.class, args);
      }
  }

=== OUTPUT FORMAT ===
For every file:
  - Write the full file path as a comment on line 1: // File: <path>
  - Write the complete Java code with all imports (no wildcards)
  - Do not truncate or leave TODOs

After all files, print:
PHASE 1 COMPLETE — FILES GENERATED:
  ✅ pom.xml
  ✅ application.properties
  ✅ User.java
  ✅ Job.java
  ✅ Application.java
  ✅ Resume.java
  ✅ UserRepository.java
  ✅ JobRepository.java
  ✅ ApplicationRepository.java
  ✅ ResumeRepository.java
  ✅ JobPortalSystemApplication.java

BEFORE RUNNING: Execute in MySQL → CREATE DATABASE jobportal_db;

Generate all steps now, completely and without truncation.
```

---

## 13. Phase 2 Master Prompt — JWT & Security

> **Goal:** Build `JwtUtil.java`, `JwtRequestFilter.java`, `SecurityConfig.java`, and `AuthController.java`.
> These are the exact files listed in the document for JWT and security.
> Also implement `UserService.java` enough to support registration and login (loadUserByUsername).

---

```
You are a senior Spring Boot security engineer.

Phase 1 is complete: all 4 entities and 4 repositories exist.
Your task is Phase 2: JWT infrastructure, SecurityConfig, and AuthController.

Base Package : com.edutech.jobportalsystem
JWT Secret   : read from application.properties → jwt.secret
JWT Expiry   : read from application.properties → jwt.expiration (milliseconds)

The roles used in the system are exactly: ADMIN, RECRUITER, JOB_SEEKER
These are stored as plain strings in the User.role column.
Spring Security expects them prefixed: "ROLE_ADMIN", "ROLE_RECRUITER", "ROLE_JOB_SEEKER"
Prefix "ROLE_" when building Spring Security authorities.

=== STEP 1 — JwtUtil.java ===
File: ./src/main/java/com/edutech/jobportalsystem/jwt/JwtUtil.java

Annotate with @Component.

Inject:
  @Value("${jwt.secret}") private String secretKey;
  @Value("${jwt.expiration}") private long expirationTime;

Implement these methods:

  1. String generateToken(String username, String role)
     - Build a JWT with:
         subject = username
         claim "role" = role
         issuedAt = new Date()
         expiration = new Date(System.currentTimeMillis() + expirationTime)
         signed with SignatureAlgorithm.HS256 and secretKey
     - Return the compact token string

  2. String extractUsername(String token)
     - Parse the token with secretKey
     - Return getBody().getSubject()

  3. String extractRole(String token)
     - Parse the token with secretKey
     - Return getBody().get("role", String.class)

  4. boolean validateToken(String token, UserDetails userDetails)
     - Return true if:
         extractUsername(token).equals(userDetails.getUsername())
         AND token expiration is after new Date()
     - Otherwise return false

  Use io.jsonwebtoken.Jwts and io.jsonwebtoken.Claims from jjwt 0.9.1.

=== STEP 2 — JwtRequestFilter.java ===
File: ./src/main/java/com/edutech/jobportalsystem/jwt/JwtRequestFilter.java

Annotate with @Component.
Extend OncePerRequestFilter.

Inject:
  - JwtUtil jwtUtil
  - UserDetailsService userDetailsService

Implement doFilterInternal:
  1. Get Authorization header from request
  2. If header is null or does not start with "Bearer ", skip to filterChain.doFilter and return
  3. Extract token: header.substring(7)
  4. Extract username: jwtUtil.extractUsername(token)
  5. If username != null AND SecurityContextHolder.getContext().getAuthentication() == null:
       a. Load UserDetails: userDetailsService.loadUserByUsername(username)
       b. If jwtUtil.validateToken(token, userDetails) is true:
            - Create UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities())
            - Set details: new WebAuthenticationDetailsSource().buildDetails(request)
            - Set in SecurityContextHolder
  6. filterChain.doFilter(request, response)

=== STEP 3 — SecurityConfig.java ===
File: ./src/main/java/com/edutech/jobportalsystem/config/SecurityConfig.java

Annotate with @Configuration and @EnableWebSecurity.

Inject:
  - JwtRequestFilter jwtRequestFilter
  - UserDetailsService userDetailsService

Define these beans:

  1. PasswordEncoder passwordEncoder()
     → return new BCryptPasswordEncoder()

  2. AuthenticationManager authenticationManager(AuthenticationConfiguration config)
     → return config.getAuthenticationManager()

  3. SecurityFilterChain securityFilterChain(HttpSecurity http)
     Configure:
       - Disable CSRF
       - Session management: STATELESS
       - Permit the following without authentication:
           POST /api/auth/register
           POST /api/auth/login
       - Restrict by role exactly as the document defines:
           /api/admin/**  → ADMIN role only
           /api/recruiter/** → RECRUITER role only
           /api/jobseeker/** → JOB_SEEKER role only
           /api/jobs → JOB_SEEKER role
           POST /api/job/apply → JOB_SEEKER role
       - All other requests must be authenticated
       - Add JwtRequestFilter before UsernamePasswordAuthenticationFilter
     → return http.build()

=== STEP 4 — UserService.java (Registration + Auth portion) ===
File: ./src/main/java/com/edutech/jobportalsystem/service/UserService.java

Annotate with @Service.
Implement UserDetailsService (Spring Security interface) — this is required by JwtRequestFilter.

Inject:
  - UserRepository userRepository
  - PasswordEncoder passwordEncoder

Implement:

  1. loadUserByUsername(String username)  [override from UserDetailsService]
     - Find user: userRepository.findByUsername(username)
         .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username))
     - Build Spring Security User:
         return new org.springframework.security.core.userdetails.User(
             user.getUsername(),
             user.getPassword(),
             List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()))
         )

  2. registerUser(User user)
     - If existsByUsername → throw RuntimeException("Username already taken")
     - If existsByEmail → throw RuntimeException("Email already registered")
     - Encode password: user.setPassword(passwordEncoder.encode(user.getPassword()))
     - Return userRepository.save(user)

=== STEP 5 — AuthController.java ===
File: ./src/main/java/com/edutech/jobportalsystem/controller/AuthController.java

Annotate with @RestController, @RequestMapping("/api/auth").

Inject:
  - AuthenticationManager authenticationManager
  - UserService userService
  - JwtUtil jwtUtil
  - UserRepository userRepository

Endpoints — these match the document exactly:

  1. POST /api/auth/register
     @RequestBody User user
     - Call userService.registerUser(user)
     - On success: return ResponseEntity.ok(Map.of("message", "User registered successfully"))
     - On RuntimeException: return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()))

  2. POST /api/auth/login
     Create a static inner class or DTO named LoginRequest with fields: String username, String password
     @RequestBody LoginRequest request
     - Call authenticationManager.authenticate(
           new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
       )
     - On BadCredentialsException: return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"))
     - Load user: userRepository.findByUsername(request.getUsername())
     - Generate token: jwtUtil.generateToken(username, user.getRole())
     - Return ResponseEntity.ok(Map.of("token", token, "role", user.getRole(), "username", user.getUsername()))

=== OUTPUT FORMAT ===
For every file:
  - Full file path as a comment on line 1
  - Complete Java code with all imports (no wildcards)
  - No truncation, no TODOs

After all files:
PHASE 2 COMPLETE — FILES GENERATED:
  ✅ JwtUtil.java
  ✅ JwtRequestFilter.java
  ✅ SecurityConfig.java
  ✅ UserService.java (auth portion)
  ✅ AuthController.java

VERIFY: Run app → POST /api/auth/register → POST /api/auth/login → you should receive a JWT token.

Generate all steps now, completely and without truncation.
```

---

## 14. Phase 3 Master Prompt — Service Layer

> **Goal:** Complete all 4 service files listed in the document.
> UserService gets the remaining user-management methods.
> JobService, ApplicationService, ResumeService are fully implemented.

---

```
You are a senior Spring Boot developer.

Phases 1 and 2 are complete. All entities, repositories, JWT classes,
SecurityConfig, and AuthController exist and work.

Your task is Phase 3: complete all service layer files.
These are the exact service files from the document:
  - UserService.java (add remaining methods)
  - JobService.java
  - ApplicationService.java
  - ResumeService.java

Base Package: com.edutech.jobportalsystem

=== STEP 1 — UserService.java (complete the remaining methods) ===
File: ./src/main/java/com/edutech/jobportalsystem/service/UserService.java

The class already has loadUserByUsername and registerUser from Phase 2.
ADD these methods to support the Admin and Profile Management requirements:

  1. List<User> getAllUsers()
     - return userRepository.findAll()
     - This is used by AdminController for GET /api/admin/users

  2. User getUserByUsername(String username)
     - return userRepository.findByUsername(username)
         .orElseThrow(() -> new RuntimeException("User not found"))
     - Supports the "Profile Management" functional requirement

=== STEP 2 — JobService.java ===
File: ./src/main/java/com/edutech/jobportalsystem/service/JobService.java

Annotate with @Service.
Inject: JobRepository jobRepository, UserRepository userRepository

Implement these methods to cover all Job Management and Job Search requirements:

  1. Job createJob(Job job, String recruiterUsername)
     - Find recruiter: userRepository.findByUsername(recruiterUsername)
         .orElseThrow(() -> new RuntimeException("Recruiter not found"))
     - job.setPostedBy(recruiter)
     - return jobRepository.save(job)

  2. Job updateJob(Long jobId, Job updatedJob, String recruiterUsername)
     - Find job: jobRepository.findById(jobId)
         .orElseThrow(() -> new RuntimeException("Job not found"))
     - Update only: title, description, location
     - return jobRepository.save(existingJob)

  3. void deleteJob(Long jobId)
     - jobRepository.deleteById(jobId)

  4. List<Job> getAllJobs()
     - return jobRepository.findAll()
     - Used by GET /api/admin/jobs

  5. List<Job> searchJobs(String title, String location)
     - Implements the "Job Search & Filtering" functional requirement
     - Logic:
         if title is not blank AND location is not blank:
           filter in memory from findAll() by both, OR combine findByTitle + findByLocation
         else if only title is not blank:
           return jobRepository.findByTitleContainingIgnoreCase(title)
         else if only location is not blank:
           return jobRepository.findByLocationContainingIgnoreCase(location)
         else:
           return jobRepository.findAll()

  6. List<Job> getJobsByRecruiter(String recruiterUsername)
     - Find recruiter user
     - return jobRepository.findByPostedBy(recruiter)

=== STEP 3 — ApplicationService.java ===
File: ./src/main/java/com/edutech/jobportalsystem/service/ApplicationService.java

Annotate with @Service.
Inject: ApplicationRepository applicationRepository, UserRepository userRepository,
        JobRepository jobRepository

Implement these methods to cover Application Management:

  1. Application applyForJob(Long jobId, Long userId)
     IMPORTANT: The document's sample input shows { "userId": 1 } in the request body.
     This service method receives the userId directly.
     - Find job: jobRepository.findById(jobId)
         .orElseThrow(() -> new RuntimeException("Job not found"))
     - Find applicant: userRepository.findById(userId)
         .orElseThrow(() -> new RuntimeException("User not found"))
     - If applicationRepository.existsByApplicantAndJob(applicant, job):
         throw RuntimeException("Already applied for this job")
     - Create Application, set applicant and job (status/appliedAt set by @PrePersist)
     - return applicationRepository.save(application)

  2. List<Application> getApplicationsForRecruiter(String recruiterUsername)
     - Find recruiter user
     - Get jobs by recruiter: jobRepository.findByPostedBy(recruiter)
     - return applicationRepository.findByJobIn(jobs)

  3. List<Application> getApplicationsByApplicant(User applicant)
     - return applicationRepository.findByApplicant(applicant)

  4. Application updateApplicationStatus(Long applicationId, String newStatus)
     - Find application: applicationRepository.findById(applicationId)
         .orElseThrow(() -> new RuntimeException("Application not found"))
     - application.setStatus(newStatus)
     - return applicationRepository.save(application)

  5. List<Application> getAllApplications()
     - return applicationRepository.findAll()

=== STEP 4 — ResumeService.java ===
File: ./src/main/java/com/edutech/jobportalsystem/service/ResumeService.java

Annotate with @Service.
Inject: ResumeRepository resumeRepository, UserRepository userRepository

Implement these methods to cover Resume Management:

  1. Resume uploadResume(MultipartFile file, String ownerUsername)
     - Find owner: userRepository.findByUsername(ownerUsername)
         .orElseThrow(() -> new RuntimeException("User not found"))
     - Check if resume already exists for owner: resumeRepository.findByOwner(owner)
       - If exists: update the existing Resume object (overwrite all fields)
       - If not: create new Resume object
     - Set: fileName = file.getOriginalFilename()
     - Set: fileType = file.getContentType()
     - Set: data = file.getBytes()  [wrap in try-catch IOException]
     - Set: owner = owner
     - return resumeRepository.save(resume)

  2. Resume getResumeByUsername(String username)
     - Find user
     - return resumeRepository.findByOwner(user)
         .orElseThrow(() -> new RuntimeException("No resume found for this user"))

=== OUTPUT FORMAT ===
  - Full file path as comment on line 1
  - Complete Java code, all imports, no wildcards
  - No truncation, no TODOs

After all files:
PHASE 3 COMPLETE — FILES GENERATED:
  ✅ UserService.java (completed with getAllUsers, getUserByUsername)
  ✅ JobService.java
  ✅ ApplicationService.java
  ✅ ResumeService.java

Generate all steps now, completely and without truncation.
```

---

## 15. Phase 4 Master Prompt — Controllers

> **Goal:** Build all 4 controllers listed in the document.
> `AuthController` was done in Phase 2. Build the remaining 3 here.
> Every endpoint must match the document exactly.

---

```
You are a senior Spring Boot developer.

Phases 1, 2, and 3 are complete. All entities, repositories, JWT, security,
and services are fully implemented.

Your task is Phase 4: implement the 3 remaining controllers.
(AuthController was already built in Phase 2.)

These are the exact files from the document:
  - AdminController.java
  - RecruiterController.java
  - JobSeekerController.java

Base Package: com.edutech.jobportalsystem

To get the logged-in username from JWT in any controller, use:
  String username = SecurityContextHolder.getContext().getAuthentication().getName();

=== STEP 1 — AdminController.java ===
File: ./src/main/java/com/edutech/jobportalsystem/controller/AdminController.java

Annotate with @RestController, @RequestMapping("/api/admin")
Inject: UserService userService, JobService jobService

Implement exactly these endpoints (as listed in the document):

  1. GET /api/admin/users
     - "Get All Users" — for Admin
     - return ResponseEntity.ok(userService.getAllUsers())

  2. GET /api/admin/jobs
     - "Get All Jobs" — for Admin
     - return ResponseEntity.ok(jobService.getAllJobs())

These two endpoints are protected by SecurityConfig to ADMIN role only.

=== STEP 2 — RecruiterController.java ===
File: ./src/main/java/com/edutech/jobportalsystem/controller/RecruiterController.java

Annotate with @RestController, @RequestMapping("/api/recruiter")
Inject: JobService jobService, ApplicationService applicationService

Implement exactly these endpoints (as listed in the document):

  1. POST /api/recruiter/job      — "Create Job"
     @RequestBody Job job
     - Get logged-in username
     - return ResponseEntity.ok(jobService.createJob(job, username))

  2. PUT /api/recruiter/job/{jobId}   — "Update Job"
     @PathVariable Long jobId, @RequestBody Job updatedJob
     - Get logged-in username
     - return ResponseEntity.ok(jobService.updateJob(jobId, updatedJob, username))

  3. DELETE /api/recruiter/job/{jobId}   — "Delete Job"
     @PathVariable Long jobId
     - jobService.deleteJob(jobId)
     - return ResponseEntity.ok(Map.of("message", "Job deleted successfully"))

  4. GET /api/recruiter/applications   — "Get All Applications"
     - Get logged-in username
     - return ResponseEntity.ok(applicationService.getApplicationsForRecruiter(username))

  5. PUT /api/recruiter/application/update/{applicationId}?status=SHORTLISTED
        — "Update Application Status"
     @PathVariable Long applicationId, @RequestParam String status
     - return ResponseEntity.ok(applicationService.updateApplicationStatus(applicationId, status))

=== STEP 3 — JobSeekerController.java ===
File: ./src/main/java/com/edutech/jobportalsystem/controller/JobSeekerController.java

Annotate with @RestController
Inject: JobService jobService, ApplicationService applicationService, ResumeService resumeService,
        UserRepository userRepository

Implement exactly these endpoints (as listed in the document):

  1. GET /api/jobs   — "Search Jobs"
     @RequestParam(required = false) String title
     @RequestParam(required = false) String location
     - return ResponseEntity.ok(jobService.searchJobs(title, location))

  2. POST /api/job/apply?jobId=1   — "Apply for Job"
     IMPORTANT: The document's sample input for this endpoint is: { "userId": 1 }
     So this endpoint accepts BOTH:
       - @RequestParam Long jobId  (from query parameter)
       - @RequestBody Map<String, Long> body  (containing "userId")
     Extract userId: body.get("userId")
     - Call applicationService.applyForJob(jobId, userId)
     - return ResponseEntity.ok(Map.of("message", "Applied successfully"))

  3. POST /api/jobseeker/resume   — "Upload Resume"
     @RequestParam("file") MultipartFile file
     - Get logged-in username
     - return ResponseEntity.ok(resumeService.uploadResume(file, username))

  4. GET /api/jobseeker/applications   — "Get My Applications"
     - Get logged-in username
     - Find user: userRepository.findByUsername(username)
     - return ResponseEntity.ok(applicationService.getApplicationsByApplicant(user))

=== OUTPUT FORMAT ===
  - Full file path as comment on line 1
  - Complete Java code, all imports, no wildcards
  - Proper HTTP status codes: 200 OK, 400 Bad Request, 404 Not Found
  - Catch RuntimeException and return ResponseEntity.badRequest().body(e.getMessage())

After all files:
PHASE 4 COMPLETE — FILES GENERATED:
  ✅ AdminController.java
  ✅ RecruiterController.java
  ✅ JobSeekerController.java

VERIFY ALL ENDPOINTS: Use Postman to test the full sample flow from the document:
  1. POST /api/auth/register (recruiter)
  2. POST /api/auth/login (recruiter) → get token
  3. POST /api/recruiter/job (with token)
  4. POST /api/auth/register (job seeker)
  5. POST /api/auth/login (job seeker) → get token
  6. GET /api/jobs (with job seeker token)
  7. POST /api/job/apply?jobId=1 with body {"userId":1} (with job seeker token)
  8. GET /api/recruiter/applications (with recruiter token)
  9. PUT /api/recruiter/application/update/1?status=SHORTLISTED (with recruiter token)

Generate all steps now, completely and without truncation.
```

---

## 16. Phase 5 Master Prompt — Frontend Core

> **Goal:** Build the Angular core — `auth.service.ts`, `http.service.ts`,
> `login.component.ts`, `login.component.html`, `registration.component.ts`, `registration.component.html`.
> These are the exact files listed in the document.

---

```
You are a senior Angular developer.

The Spring Boot backend (Phases 1–4) is running on http://localhost:8080.
Your task is Phase 5: Angular core services and Auth UI components.

These are the exact files listed in the document for this phase:
  - src/services/auth.service.ts
  - src/services/http.service.ts
  - src/app/login/login.component.ts
  - src/app/login/login.component.html
  - src/app/registration/registration.component.ts
  - src/app/registration/registration.component.html

The document also requires these frontend functionalities:
  - Registration & Login UI
  - JWT Session Handling
  - Role-Based UI Rendering

Backend base URL: http://localhost:8080
JWT is stored in localStorage after login.

=== STEP 1 — auth.service.ts ===
File: ./src/services/auth.service.ts

This service handles JWT session management (JWT Session Handling requirement).
Annotate with @Injectable({ providedIn: 'root' })

Inject: Router

Storage keys:
  TOKEN_KEY = 'token'
  ROLE_KEY = 'role'
  USERNAME_KEY = 'username'

Methods:

  saveSession(token: string, role: string, username: string): void
    localStorage.setItem('token', token)
    localStorage.setItem('role', role)
    localStorage.setItem('username', username)

  getToken(): string | null
    return localStorage.getItem('token')

  getRole(): string | null
    return localStorage.getItem('role')

  getUsername(): string | null
    return localStorage.getItem('username')

  isLoggedIn(): boolean
    return !!this.getToken()

  logout(): void
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('username')
    this.router.navigate(['/login'])

  isAdmin(): boolean
    return this.getRole() === 'ADMIN'

  isRecruiter(): boolean
    return this.getRole() === 'RECRUITER'

  isJobSeeker(): boolean
    return this.getRole() === 'JOB_SEEKER'

=== STEP 2 — http.service.ts ===
File: ./src/services/http.service.ts

This is the Angular Service Layer (RESTful API & Angular Service Layer requirement).
Annotate with @Injectable({ providedIn: 'root' })

Inject: HttpClient, AuthService

private BASE_URL = 'http://localhost:8080';

Private helper:
  private getAuthHeaders(): HttpHeaders
    return new HttpHeaders({ 'Authorization': 'Bearer ' + this.authService.getToken() })

Auth methods (no Authorization header — public endpoints):
  register(data: any): Observable<any>
    POST ${BASE_URL}/api/auth/register, body: data

  login(data: any): Observable<any>
    POST ${BASE_URL}/api/auth/login, body: data

Job Seeker methods (require Authorization header):
  searchJobs(title?: string, location?: string): Observable<any>
    GET ${BASE_URL}/api/jobs
    Build HttpParams: if title add title param, if location add location param
    Include auth headers

  applyForJob(jobId: number, userId: number): Observable<any>
    IMPORTANT: Document sample shows body { "userId": 1 }
    POST ${BASE_URL}/api/job/apply?jobId=${jobId}
    body: { userId: userId }
    Include auth headers

  uploadResume(file: File): Observable<any>
    POST ${BASE_URL}/api/jobseeker/resume
    Use FormData: formData.append('file', file)
    Header: only Authorization (do NOT set Content-Type — browser sets multipart boundary)

  getMyApplications(): Observable<any>
    GET ${BASE_URL}/api/jobseeker/applications
    Include auth headers

Recruiter methods (require Authorization header):
  createJob(jobData: any): Observable<any>
    POST ${BASE_URL}/api/recruiter/job, body: jobData, auth headers

  updateJob(jobId: number, jobData: any): Observable<any>
    PUT ${BASE_URL}/api/recruiter/job/${jobId}, body: jobData, auth headers

  deleteJob(jobId: number): Observable<any>
    DELETE ${BASE_URL}/api/recruiter/job/${jobId}, auth headers

  getRecruiterApplications(): Observable<any>
    GET ${BASE_URL}/api/recruiter/applications, auth headers

  updateApplicationStatus(applicationId: number, status: string): Observable<any>
    PUT ${BASE_URL}/api/recruiter/application/update/${applicationId}?status=${status}
    auth headers

Admin methods (require Authorization header):
  getAllUsers(): Observable<any>
    GET ${BASE_URL}/api/admin/users, auth headers

  getAllJobsAdmin(): Observable<any>
    GET ${BASE_URL}/api/admin/jobs, auth headers

=== STEP 3 — login.component.ts ===
File: ./src/app/login/login.component.ts

Annotate with @Component({ selector: 'app-login', templateUrl: './login.component.html' })

Inject: HttpService, AuthService, Router

Properties:
  username: string = ''
  password: string = ''
  errorMessage: string = ''
  isLoading: boolean = false

onLogin():
  isLoading = true; errorMessage = ''
  Call httpService.login({ username: this.username, password: this.password })
  On success:
    authService.saveSession(response.token, response.role, response.username)
    Navigate based on role (Role-Based UI Rendering requirement):
      if RECRUITER → router.navigate(['/post-job'])
      if JOB_SEEKER → router.navigate(['/jobs'])
      if ADMIN → router.navigate(['/jobs'])
  On error:
    errorMessage = 'Invalid username or password'
  Finally: isLoading = false

=== STEP 4 — login.component.html ===
File: ./src/app/login/login.component.html

Build the Registration & Login UI:
  - Form with username input [(ngModel)]="username"
  - Password input [(ngModel)]="password"
  - Login button (click)="onLogin()" [disabled]="isLoading"
  - Error message: *ngIf="errorMessage" show errorMessage in red
  - Link to registration page: routerLink="/register"

=== STEP 5 — registration.component.ts ===
File: ./src/app/registration/registration.component.ts

Annotate with @Component({ selector: 'app-registration', templateUrl: './registration.component.html' })

Inject: HttpService, Router

Properties:
  username: string = ''
  password: string = ''
  email: string = ''
  role: string = ''
  successMessage: string = ''
  errorMessage: string = ''
  isLoading: boolean = false
  roleOptions: string[] = ['RECRUITER', 'JOB_SEEKER']
    NOTE: Only RECRUITER and JOB_SEEKER can self-register.
    ADMIN accounts are created separately.

onRegister():
  isLoading = true; errorMessage = ''; successMessage = ''
  Validate all fields filled; if not set errorMessage and return
  Call httpService.register({ username, password, email, role })
  On success:
    successMessage = 'Registration successful! Redirecting to login...'
    setTimeout(() => router.navigate(['/login']), 1500)
  On error:
    errorMessage = error.error?.error || 'Registration failed. Please try again.'
  Finally: isLoading = false

=== STEP 6 — registration.component.html ===
File: ./src/app/registration/registration.component.html

Build the Registration & Login UI:
  - Form with: username, email, password inputs (all [(ngModel)])
  - Role select dropdown with roleOptions *ngFor
  - Register button [disabled]="isLoading"
  - Success message *ngIf="successMessage" in green
  - Error message *ngIf="errorMessage" in red
  - Link to login: routerLink="/login"

=== OUTPUT FORMAT ===
  - Full file path as comment on line 1
  - Complete TypeScript/HTML, all imports
  - No truncation, no TODOs

After all files:
PHASE 5 COMPLETE — FILES GENERATED:
  ✅ auth.service.ts
  ✅ http.service.ts
  ✅ login.component.ts
  ✅ login.component.html
  ✅ registration.component.ts
  ✅ registration.component.html

Generate all steps now, completely and without truncation.
```

---

## 17. Phase 6 Master Prompt — Frontend Feature Components

> **Goal:** Build the remaining 6 frontend files listed in the document.
> These cover: Job Listing & Search Page, Recruiter Dashboard, Job Seeker Dashboard, Resume Upload.

---

```
You are a senior Angular developer.

Phase 5 is complete: auth.service.ts, http.service.ts, login, and registration all work.
Your task is Phase 6: remaining feature components listed in the document.

These are the exact files from the document:
  - src/app/job-list/job-list.component.ts + .html
  - src/app/post-job/post-job.component.ts + .html
  - src/app/applications/applications.component.ts + .html
  - src/app/resume/resume.component.ts + .html

Frontend functionalities from the document to implement:
  - Job Listing & Search Page
  - Recruiter Dashboard (Post Job, Manage Applications)
  - Job Seeker Dashboard (Apply, Track Applications)
  - Resume Upload Interface
  - Role-Based UI Rendering
  - JWT Session Handling

=== STEP 1 — job-list.component.ts ===
File: ./src/app/job-list/job-list.component.ts

This is the Job Listing & Search Page and Job Seeker Dashboard (Apply).

Inject: HttpService, AuthService

Properties:
  jobs: any[] = []
  searchTitle: string = ''
  searchLocation: string = ''
  successMessage: string = ''
  errorMessage: string = ''
  isLoading: boolean = false

ngOnInit():
  loadJobs()

loadJobs():
  isLoading = true
  Call httpService.searchJobs(searchTitle, searchLocation)
  On success: jobs = response
  On error: errorMessage = 'Failed to load jobs'
  Finally: isLoading = false

onSearch():
  Call loadJobs() with current searchTitle and searchLocation values

onApply(jobId: number):
  IMPORTANT: Document sample body is { "userId": 1 }
  Get userId stored in localStorage (stored during login as 'userId')
  userId = Number(localStorage.getItem('userId'))
  Call httpService.applyForJob(jobId, userId)
  On success: successMessage = 'Applied successfully!'
  On error: errorMessage = error.error?.error || 'Failed to apply'

logout():
  authService.logout()

=== STEP 2 — job-list.component.html ===
File: ./src/app/job-list/job-list.component.html

Job Listing & Search Page:
  - Title: "Browse Jobs"
  - Search section: title input, location input, Search button (click)="onSearch()"
  - Loading indicator: *ngIf="isLoading"
  - Job cards *ngFor="let job of jobs":
      Show: title, description, location, created date
      Apply button (click)="onApply(job.id)"
  - Success message *ngIf="successMessage"
  - Error message *ngIf="errorMessage"
  - Logout button (click)="logout()"
  - Link to "My Applications": routerLink="/applications"
  - Link to "Upload Resume": routerLink="/resume"

=== STEP 3 — post-job.component.ts ===
File: ./src/app/post-job/post-job.component.ts

This is the Recruiter Dashboard — Post Job portion.

Inject: HttpService, AuthService, Router

Properties:
  jobTitle: string = ''
  jobDescription: string = ''
  jobLocation: string = ''
  successMessage: string = ''
  errorMessage: string = ''
  isLoading: boolean = false

onPostJob():
  Validate: jobTitle and jobLocation must not be empty
  isLoading = true; errorMessage = ''; successMessage = ''
  Call httpService.createJob({ title: jobTitle, description: jobDescription, location: jobLocation })
  On success:
    successMessage = 'Job posted successfully!'
    Reset: jobTitle = '', jobDescription = '', jobLocation = ''
  On error:
    errorMessage = error.error?.error || 'Failed to post job'
  Finally: isLoading = false

logout():
  authService.logout()

=== STEP 4 — post-job.component.html ===
File: ./src/app/post-job/post-job.component.html

Recruiter Dashboard — Post Job UI:
  - Title: "Post a New Job"
  - Form: Job Title input, Description textarea, Location input
  - Post Job button (click)="onPostJob()" [disabled]="isLoading"
  - Success message *ngIf="successMessage"
  - Error message *ngIf="errorMessage"
  - Link to "Manage Applications": routerLink="/applications"
  - Logout button (click)="logout()"

=== STEP 5 — applications.component.ts ===
File: ./src/app/applications/applications.component.ts

This serves BOTH Recruiter Dashboard (Manage Applications) and
Job Seeker Dashboard (Track Applications) — uses Role-Based UI Rendering.

Inject: HttpService, AuthService

Properties:
  applications: any[] = []
  isRecruiter: boolean = false
  isJobSeeker: boolean = false
  successMessage: string = ''
  errorMessage: string = ''
  isLoading: boolean = false
  statusOptions: string[] = ['APPLIED', 'SHORTLISTED', 'REJECTED', 'HIRED']

ngOnInit():
  isRecruiter = authService.isRecruiter()
  isJobSeeker = authService.isJobSeeker()
  loadApplications()

loadApplications():
  isLoading = true
  If isRecruiter: call httpService.getRecruiterApplications()
  If isJobSeeker: call httpService.getMyApplications()
  On success: applications = response
  On error: errorMessage = 'Failed to load applications'
  Finally: isLoading = false

onUpdateStatus(applicationId: number, newStatus: string):
  Call httpService.updateApplicationStatus(applicationId, newStatus)
  On success:
    successMessage = 'Status updated to: ' + newStatus
    loadApplications()
  On error: errorMessage = 'Failed to update status'

logout():
  authService.logout()

=== STEP 6 — applications.component.html ===
File: ./src/app/applications/applications.component.html

Role-Based UI Rendering:
  - *ngIf="isRecruiter": Title "Manage Applications"
  - *ngIf="isJobSeeker": Title "My Applications"
  - *ngIf="isLoading": Loading indicator
  - *ngIf="applications.length === 0": "No applications found"
  - *ngFor="let app of applications":
      Show: job title, applicant username (if recruiter), status, applied date
      If isRecruiter:
        Status select dropdown [(ngModel)]="app.status" with statusOptions
        Update button (click)="onUpdateStatus(app.id, app.status)"
      If isJobSeeker:
        Display status as text
  - Success message *ngIf="successMessage"
  - Error message *ngIf="errorMessage"
  - Logout button (click)="logout()"

=== STEP 7 — resume.component.ts ===
File: ./src/app/resume/resume.component.ts

This is the Resume Upload Interface.

Inject: HttpService, AuthService

Properties:
  selectedFile: File | null = null
  successMessage: string = ''
  errorMessage: string = ''
  isUploading: boolean = false

onFileSelected(event: Event):
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0):
    selectedFile = input.files[0]

onUpload():
  if (!selectedFile): errorMessage = 'Please select a file'; return
  isUploading = true; errorMessage = ''; successMessage = ''
  Call httpService.uploadResume(selectedFile)
  On success: successMessage = 'Resume uploaded successfully'
  On error: errorMessage = 'Upload failed. Please try again.'
  Finally: isUploading = false

logout():
  authService.logout()

=== STEP 8 — resume.component.html ===
File: ./src/app/resume/resume.component.html

Resume Upload Interface:
  - Title: "Upload Your Resume"
  - File input (change)="onFileSelected($event)" accept=".pdf,.doc,.docx"
  - Display selected file name *ngIf="selectedFile"
  - Upload button (click)="onUpload()" [disabled]="isUploading"
  - Success message *ngIf="successMessage"
  - Error message *ngIf="errorMessage"
  - Link back to jobs: routerLink="/jobs"
  - Logout button (click)="logout()"

=== OUTPUT FORMAT ===
  - Full file path as comment on line 1
  - Complete TypeScript/HTML, all imports
  - Correct Angular directives: *ngIf, *ngFor, [(ngModel)], (click), [disabled], routerLink

After all files:
PHASE 6 COMPLETE — FILES GENERATED:
  ✅ job-list.component.ts + html
  ✅ post-job.component.ts + html
  ✅ applications.component.ts + html
  ✅ resume.component.ts + html

VERIFY the complete sample flow from the document:
  1. Register recruiter → login → post job → view applications → update status
  2. Register job seeker → login → search jobs → apply → view my applications → upload resume

Generate all steps now, completely and without truncation.
```

---

## 18. Phase 7 Master Prompt — Backend Test Cases

> **Goal:** Write the backend test cases specified in the document.
> The document specifies exactly these test areas — nothing more, nothing less.

---

```
You are a senior Spring Boot testing engineer.

All phases (1–6) are complete. Your task is Phase 7: backend tests.

The document specifies these exact test cases. Write tests ONLY for what is listed.

=== BACKEND TEST CASES FROM THE DOCUMENT ===

Section 1 — "Backend Test Cases":
  - User Registration: Duplicate email validation
  - User Registration: Role assignment correctness
  - Job Posting: Validate job persistence
  - Job Application: Ensure mapping between user and job
  - Application Status Update: Verify recruiter updates

Section 2 — "Test Cases to be Passed":
  1. User registration and login validation
  2. Job posting CRUD operations
  3. Job search and filtering
  4. Application mapping validation
  5. Application status update
  6. Role-based API restriction
  7. JWT authentication validation

Base Package: com.edutech.jobportalsystem
Test Package: com.edutech.jobportalsystem (under src/test/java)

Use @ExtendWith(MockitoExtension.class) for unit tests.
Use @SpringBootTest + @AutoConfigureMockMvc for integration tests.
Add H2 in-memory DB for integration tests (add to pom.xml test scope).

=== TEST FILE 1 — UserServiceTest.java ===
File: src/test/java/com/edutech/jobportalsystem/service/UserServiceTest.java

Covers: "User Registration" backend test cases + "User registration and login validation"

Mock: UserRepository, PasswordEncoder
Inject: UserService

Tests:

  1. registerUser_DuplicateEmail_ThrowsException()
     → Covers: "Duplicate email validation"
     - Mock existsByEmail("test@mail.com") returns true
     - Assert RuntimeException thrown with message containing "Email"
     - Verify userRepository.save() is NEVER called

  2. registerUser_RoleAssignedCorrectly()
     → Covers: "Role assignment correctness"
     - Create user with role = "RECRUITER"
     - Mock existsByEmail → false, existsByUsername → false
     - Mock save → return the user
     - Call registerUser(user)
     - Assert returned user.getRole() equals "RECRUITER"

  3. registerUser_PasswordIsEncoded()
     → Covers: "User registration and login validation"
     - Mock passwordEncoder.encode("rawpass") → "encodedpass"
     - Call registerUser
     - Verify passwordEncoder.encode was called
     - Assert saved user's password equals "encodedpass"

  4. loadUserByUsername_ReturnsCorrectAuthorities()
     → Covers: "Role-based API restriction" (verifying correct authority is built)
     - Mock findByUsername → user with role "RECRUITER"
     - Call loadUserByUsername("recruiter1")
     - Assert returned UserDetails has authority "ROLE_RECRUITER"

=== TEST FILE 2 — JobServiceTest.java ===
File: src/test/java/com/edutech/jobportalsystem/service/JobServiceTest.java

Covers: "Job Posting — Validate job persistence" + "Job posting CRUD operations" + "Job search and filtering"

Mock: JobRepository, UserRepository
Inject: JobService

Tests:

  1. createJob_PersistsJobCorrectly()
     → Covers: "Validate job persistence"
     - Mock findByUsername → recruiter user
     - Mock jobRepository.save → returns the job
     - Call createJob(job, "recruiter1")
     - Assert: returned job is not null
     - Assert: job.getPostedBy() equals the recruiter user
     - Verify: jobRepository.save() called exactly once

  2. updateJob_UpdatesFieldsCorrectly()
     → Covers: "Job posting CRUD operations"
     - Mock findById → existing job
     - Mock save → updated job
     - Call updateJob with new title "Senior Dev"
     - Assert returned job title equals "Senior Dev"

  3. deleteJob_CallsRepository()
     → Covers: "Job posting CRUD operations"
     - Call deleteJob(1L)
     - Verify jobRepository.deleteById(1L) called once

  4. searchJobs_ByTitle_ReturnsFilteredList()
     → Covers: "Job search and filtering"
     - Mock findByTitleContainingIgnoreCase("Java") → list of 2 jobs
     - Call searchJobs("Java", null)
     - Assert returned list size = 2

  5. searchJobs_NoFilter_ReturnsAll()
     → Covers: "Job search and filtering"
     - Mock findAll() → list of 3 jobs
     - Call searchJobs(null, null)
     - Assert returned list size = 3

=== TEST FILE 3 — ApplicationServiceTest.java ===
File: src/test/java/com/edutech/jobportalsystem/service/ApplicationServiceTest.java

Covers: "Job Application — Ensure mapping between user and job" +
        "Application Status Update — Verify recruiter updates" +
        "Application mapping validation" + "Application status update"

Mock: ApplicationRepository, UserRepository, JobRepository
Inject: ApplicationService

Tests:

  1. applyForJob_MapsUserAndJobCorrectly()
     → Covers: "Ensure mapping between user and job" + "Application mapping validation"
     - Mock: job found by findById(1L), user found by findById(1L)
     - Mock: existsByApplicantAndJob → false
     - Mock: save → returns application
     - Call applyForJob(1L, 1L)
     - Assert: returned application is not null
     - Assert: application.getApplicant() equals the user
     - Assert: application.getJob() equals the job
     - Verify: applicationRepository.save() called once

  2. applyForJob_AlreadyApplied_ThrowsException()
     → Covers: "Application mapping validation"
     - Mock existsByApplicantAndJob → true
     - Assert RuntimeException thrown
     - Verify: save is NEVER called

  3. updateApplicationStatus_SetsStatusCorrectly()
     → Covers: "Application Status Update — Verify recruiter updates" + "Application status update"
     - Mock findById → existing application with status "APPLIED"
     - Mock save → application
     - Call updateApplicationStatus(1L, "SHORTLISTED")
     - Assert returned application.getStatus() equals "SHORTLISTED"
     - Verify save called once

=== TEST FILE 4 — AuthControllerIntegrationTest.java ===
File: src/test/java/com/edutech/jobportalsystem/controller/AuthControllerIntegrationTest.java

Covers: "User registration and login validation" + "Role-based API restriction" + "JWT authentication validation"

Annotate: @SpringBootTest, @AutoConfigureMockMvc
Use MockMvc.
Use H2 in-memory database (configure in test application.properties).

Tests:

  1. testRegisterAndLogin_Success()
     → Covers: "User registration and login validation"
     - POST /api/auth/register with valid recruiter body
     - Assert: 200 OK
     - POST /api/auth/login with same credentials
     - Assert: 200 OK
     - Assert: response body contains "token"

  2. testRegister_DuplicateEmail_Returns400()
     → Covers: "Duplicate email validation" (integration level)
     - Register user with email "dup@mail.com"
     - Register again with same email
     - Assert: second call returns 400

  3. testAdminEndpoint_WithoutToken_Returns403()
     → Covers: "Role-based API restriction" + "JWT authentication validation"
     - GET /api/admin/users with no Authorization header
     - Assert: 403 (Forbidden) or 401 (Unauthorized)

  4. testAdminEndpoint_WithRecruiterToken_Returns403()
     → Covers: "Role-based API restriction"
     - Register and login as RECRUITER → get token
     - GET /api/admin/users with recruiter token
     - Assert: 403

  5. testRecruiterEndpoint_WithValidToken_Returns200()
     → Covers: "JWT authentication validation"
     - Register and login as RECRUITER → get token
     - POST /api/recruiter/job with token and valid job body
     - Assert: 200 OK

=== TEST CONFIGURATION — application.properties for tests ===
File: src/test/resources/application.properties

  spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1
  spring.datasource.driver-class-name=org.h2.Driver
  spring.datasource.username=sa
  spring.datasource.password=
  spring.jpa.hibernate.ddl-auto=create-drop
  spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
  jwt.secret=testjwtsecretkey2024
  jwt.expiration=86400000

Add to pom.xml (test scope):
  <dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>test</scope>
  </dependency>

=== OUTPUT FORMAT ===
  - Full file path as comment on line 1
  - All test methods with @Test annotation
  - Use JUnit 5: assertEquals, assertThrows, assertNotNull
  - Mock setup in @BeforeEach where shared across tests

After all files:
PHASE 7 COMPLETE — TEST FILES GENERATED:
  ✅ UserServiceTest.java  (4 tests — duplicate email, role assignment, password encoding, authorities)
  ✅ JobServiceTest.java   (5 tests — job persistence, CRUD, search/filtering)
  ✅ ApplicationServiceTest.java (3 tests — mapping, duplicate, status update)
  ✅ AuthControllerIntegrationTest.java (5 tests — registration/login, role restriction, JWT)
  ✅ src/test/resources/application.properties (H2 config)

Run: mvn test → all tests must pass GREEN.

Generate all test files now, completely and without truncation.
```

---

## 19. Master Progress Checklist

Use this to track completion. Every item maps directly to the document.

### Backend Files (exact list from document)
- [ ] `SecurityConfig.java`
- [ ] `AdminController.java`
- [ ] `RecruiterController.java`
- [ ] `JobSeekerController.java`
- [ ] `AuthController.java`
- [ ] `User.java`
- [ ] `Job.java`
- [ ] `Application.java`
- [ ] `Resume.java`
- [ ] `JwtRequestFilter.java`
- [ ] `JwtUtil.java`
- [ ] `UserRepository.java`
- [ ] `JobRepository.java`
- [ ] `ApplicationRepository.java`
- [ ] `ResumeRepository.java`
- [ ] `UserService.java`
- [ ] `JobService.java`
- [ ] `ApplicationService.java`
- [ ] `ResumeService.java`

### Frontend Files (exact list from document)
- [ ] `login.component.ts`
- [ ] `login.component.html`
- [ ] `registration.component.ts`
- [ ] `registration.component.html`
- [ ] `job-list.component.ts`
- [ ] `job-list.component.html`
- [ ] `post-job.component.ts`
- [ ] `post-job.component.html`
- [ ] `applications.component.ts`
- [ ] `applications.component.html`
- [ ] `resume.component.ts`
- [ ] `resume.component.html`
- [ ] `http.service.ts`
- [ ] `auth.service.ts`

### API Endpoints Verified (exact list from document)
- [ ] POST `/api/auth/register`
- [ ] POST `/api/auth/login`
- [ ] GET `/api/admin/users`
- [ ] GET `/api/admin/jobs`
- [ ] POST `/api/recruiter/job`
- [ ] PUT `/api/recruiter/job/{jobId}`
- [ ] DELETE `/api/recruiter/job/{jobId}`
- [ ] GET `/api/recruiter/applications`
- [ ] PUT `/api/recruiter/application/update/{applicationId}?status=SHORTLISTED`
- [ ] GET `/api/jobs`
- [ ] POST `/api/job/apply?jobId=1`
- [ ] POST `/api/jobseeker/resume`
- [ ] GET `/api/jobseeker/applications`

### Test Cases (exact list from document)
- [ ] User registration and login validation
- [ ] Job posting CRUD operations
- [ ] Job search and filtering
- [ ] Application mapping validation
- [ ] Application status update
- [ ] Role-based API restriction
- [ ] JWT authentication validation

### Sample Flow Verified (exact from document)
- [ ] Recruiter registers and logs in
- [ ] Recruiter posts a job
- [ ] Job seeker registers and logs in
- [ ] Job seeker searches and applies
- [ ] Recruiter views applications
- [ ] Recruiter updates status

---

> **19 backend files | 14 frontend files | 13 API endpoints | 7 test categories**
> Every item in this document maps directly and exclusively to the problem statement.