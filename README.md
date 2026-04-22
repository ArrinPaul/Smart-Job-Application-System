# Smart Job Portal System

The Smart Job Portal System is an integrated platform designed to streamline the recruitment process by connecting job seekers and recruiters.

## Features

- **User Registration & Profile Management**: Secure account creation and management for all users.
- **Job Management**: Recruiters can post, update, and delete job openings.
- **Job Search & Filtering**: Job seekers can easily browse and filter jobs based on skills and location.
- **Application Management**: Transparent workflow for job seekers to apply and recruiters to manage applications.
- **Resume Management**: Secure resume upload and management for job seekers.
- **Role-Based Access Control**: Tailored experiences for Admins, Recruiters, and Job Seekers.
- **Secure Authentication**: Implementation of JWT for stateless and secure API communication.

## Technology Stack

- **Backend**: Spring Boot 3.2.0, Spring Data JPA, PostgreSQL (Supabase)
- **Frontend**: Angular
- **Security**: Spring Security, JSON Web Token (JWT)
- **Language**: Java 17

## Project Structure

- `backend/`: Spring Boot application.
- `frontend/`: Angular application.

## Prerequisites

- JDK 17
- Maven
- PostgreSQL (Supabase)
- Node.js & npm (for Angular)

## Database Status

- This project is database-integrated with PostgreSQL using Spring Data JPA.
- Runtime schema management uses Flyway migrations + Hibernate validate.
- App startup runs migration `backend/src/main/resources/db/migration/supabase/V1__init_job_portal.sql`.

## Getting Started

### Backend Setup - Local Development

1. Navigate to the `backend` directory.
2. Copy `.env.example` to `.env` and update with your database credentials:
   ```bash
   cp .env.example .env
   ```
3. For local development, run the H2-backed helper script:
   ```powershell
   .\run-local.ps1 -Profile local
   ```
4. Configure PostgreSQL/Supabase values in `.env` when you want to run against Supabase:
   ```properties
   SPRING_PROFILES_ACTIVE=supabase
   SUPABASE_DB_HOST=aws-1-ap-northeast-1.pooler.supabase.com
   SUPABASE_DB_PORT=6543
   SUPABASE_DB_NAME=postgres
   SUPABASE_DB_USER=postgres.xsroytgypeekyuixhysy
   SUPABASE_DB_PASSWORD=YOUR_PASSWORD
   SERVER_PORT=8080
   HIKARI_MAX_POOL=20
   ```
5. Run the application directly with Maven if you prefer that path:
   ```bash
   mvn clean spring-boot:run
   ```

### Backend Setup - Supabase PostgreSQL (Optional)

1. In Supabase, create a project and copy your database connection details (host, port, db, user, password).
2. Apply migration from this repository in Supabase SQL Editor:
   - `supabase/migrations/20260420_000001_init_job_portal.sql`
3. Configure backend environment (copy from `.env.example`):
   ```properties
   SPRING_PROFILES_ACTIVE=supabase
   SUPABASE_DB_HOST=...
   SUPABASE_DB_PORT=5432
   SUPABASE_DB_NAME=postgres
   SUPABASE_DB_USER=postgres
   SUPABASE_DB_PASSWORD=...
   ```
4. Start backend as usual:
   ```bash
   mvn clean spring-boot:run
   ```

Notes:
- Supabase anon key is for frontend client access, not for backend JDBC DB connection.
- Backend profile for Supabase is defined in `backend/src/main/resources/application-supabase.properties`.

### Backend Setup - Deployment Notes

1. Set `SPRING_PROFILES_ACTIVE=supabase` in deployment environment.
2. Set the Supabase DB environment variables from `.env.example`.
3. Flyway migration runs automatically during startup.

### Frontend Setup

1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Update API URL in `src/environments/environment.ts` (for development) and `environment.prod.ts` (for production):
   ```typescript
   export const environment = {
     apiBaseUrl: 'http://localhost:8080/api', // for local
     // or for Railway: https://yourapp.railway.app/api
   };
   ```
4. Start the development server:
   ```bash
   ng serve
   # or
   npm start
   ```
5. Serve the production build from the Angular browser output:
   ```bash
   ng build
   npx serve dist/jobportal-frontend/browser
   ```
