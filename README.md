# Smart Job Portal System

[![Project Status: Active](https://img.shields.io/badge/status-active-success.svg)](https://github.com/your-repo/smart-job-portal-system)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A modern, production-ready recruitment platform that connects job seekers, recruiters, and administrators with real-time data synchronization and intelligent job scraping.

---

## Table of Contents

- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development Setup](#local-development-setup)
- [API Endpoints](#api-endpoints)
- [Security](#security)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Key Features

- **Role-Based Access Control**: Separate interfaces and permissions for Administrators, Recruiters, and Job Seekers.
- **Full Job Lifecycle Management**: Recruiters can post, edit, archive, and manage job listings.
- **Intelligent Job Search**: Job seekers can search and filter jobs by title, location, and other criteria.
- **Seamless Application Workflow**: Candidates can apply for jobs, upload resumes, and track their application status.
- **Comprehensive Admin Dashboard**: Real-time analytics, user management, and system health monitoring.
- **Automated Job Scraping**: A scheduled service scrapes jobs from external portals like Indeed and normalizes the data.
- **Step-by-Step User Onboarding**: A guided process for new users to complete their profiles.

## System Architecture

The system is composed of three main components: a **Spring Boot Backend**, an **Angular Frontend**, and a **PostgreSQL Database** (managed via Supabase).

```
+------------------+      +---------------------+      +-------------------+
|                  |      |                     |      |                   |
|  Angular         | <=>  |  Spring Boot        | <=>  |  Supabase         |
|  Frontend        |      |  Backend (API)      |      |  (PostgreSQL)     |
|  (Port 4200)     |      |  (Port 8080)        |      |                   |
|                  |      |                     |      |                   |
+------------------+      +---------------------+      +-------------------+
        ^                           ^
        |                           |
        +---------------------------+
        |
        |  RESTful API Communication
        |  (JSON via HTTP/S)
        |
```

- **Frontend**: A responsive single-page application (SPA) built with Angular that provides the user interface.
- **Backend**: A powerful RESTful API built with Spring Boot that handles all business logic, data processing, and authentication.
- **Database**: A PostgreSQL database hosted on Supabase, with schema migrations managed by Flyway.

---

## Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Backend** | Spring Boot 3, Java 21 | Core framework for building the robust, high-performance API. |
| **Frontend** | Angular 17, TypeScript | Modern framework for the client-side single-page application. |
| **Database** | PostgreSQL (Supabase) | Scalable, open-source object-relational database. |
| **Authentication**| Spring Security, JWT | Secure, stateless authentication using JSON Web Tokens stored in `HttpOnly` cookies. |
| **Migrations** | Flyway | Manages database schema evolution reliably across all environments. |
| **Job Scraping** | Jsoup, Selenium | Tools for extracting job data from external websites. |
| **Build Tools** | Maven (Backend), npm (Frontend) | Dependency management and build automation. |

---

## Getting Started

### Prerequisites

- **Java 21** (or higher)
- **Maven 3.9** (or higher)
- **Node.js 20** (or higher) & npm
- **Git**
- A **Supabase Account** (for database hosting)

### Local Development Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/your-repo/smart-job-portal-system.git
cd smart-job-portal-system
```

#### 2. Configure Backend (Supabase)

1.  **Create a Supabase Project**: Go to [Supabase](https://supabase.com/) and create a new project.
2.  **Get Database Credentials**: Navigate to `Project Settings > Database` to find your connection details (Host, Port, DB name, etc.).
3.  **Create an Environment File**: In the `backend/` directory, create a `.env` file and add your Supabase credentials. **Note:** Do not commit this file.

    ```env
    # backend/.env
    SPRING_PROFILES_ACTIVE=supabase
    SUPABASE_DB_HOST=db.<your-project-ref>.supabase.co
    SUPABASE_DB_PORT=5432
    SUPABASE_DB_NAME=postgres
    SUPABASE_DB_USER=postgres
    SUPABASE_DB_PASSWORD=<your-db-password>
    ```

#### 3. Run the Backend

Open a terminal in the `backend/` directory and run the application. Flyway will automatically run the database migrations on startup.

```powershell
# For PowerShell
cd backend
./run-local.ps1 -Profile supabase
```
Or using Maven directly:
```bash
# Make sure your .env file is loaded or export the variables manually
mvn spring-boot:run
```
The backend API will be available at `http://localhost:8080`.

#### 4. Configure Frontend

The frontend reads its API URL from an environment file.

1.  **Navigate to Frontend**: `cd ../frontend`
2.  **Install Dependencies**: `npm install`
3.  **Run the Development Server**: `ng serve`

The frontend application will be available at `http://localhost:4200`.

---

## API Endpoints

The following are the primary API endpoints. All are prefixed with `/api`.

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/auth/register` | Creates a new user account. | Public |
| `POST` | `/auth/login` | Authenticates a user and returns a JWT. | Public |
| `POST` | `/auth/logout` | Clears the user's session. | Authenticated |
| `GET` | `/jobs` | Retrieves a list of all active jobs. | Public |
| `GET` | `/jobs/{slug}` | Retrieves a single job by its slug. | Public |
| `POST` | `/recruiter/jobs` | Creates a new job listing. | Recruiter |
| `POST` | `/jobseeker/apply` | Applies for a job. | Job Seeker |
| `GET` | `/admin/dashboard/summary` | Retrieves analytics for the admin dashboard. | Admin |

---

## Security

- **Stateless Authentication**: Uses JWTs stored in secure, `HttpOnly` cookies, preventing XSS attacks from accessing tokens.
- **CORS Protection**: Configured to only allow requests from the frontend origin specified in the backend configuration.
- **Role-Based Authorization**: API endpoints are protected using Spring Security to ensure users can only access resources permitted by their role.
- **SQL Injection Prevention**: Spring Data JPA and Hibernate protect against SQL injection vulnerabilities.
- **Rate Limiting**: Implemented on authentication endpoints to prevent brute-force attacks.

---

## Deployment

### Backend

1.  Build the production JAR file:
    ```bash
    cd backend
    mvn clean package -DskipTests
    ```
2.  Run the application on your server, passing the database credentials as environment variables:
    ```bash
    java -jar target/jobportalsystem-*.jar
    ```

### Frontend

1.  Build the production-ready static files:
    ```bash
    cd frontend
    ng build --configuration=production
    ```
2.  Serve the generated files from `dist/jobportal-frontend/browser` using a web server like Nginx or Vercel.

---

## Contributing

Contributions are welcome! Please open an issue to discuss a new feature or bug. Pull requests should be made to the `develop` branch.

1.  **Fork the repository.**
2.  **Create a new feature branch:** `git checkout -b feature/my-new-feature`
3.  **Commit your changes:** `git commit -am 'Add some feature'`
4.  **Push to the branch:** `git push origin feature/my-new-feature`
5.  **Submit a pull request.**

---

## Automated Job Scraper

This repository includes a scheduled job-scraper that collects job postings from multiple external sources and ingests them into the backend or directly into Supabase.

- Workflow: `.github/workflows/job-scraper.yml` — runs every 12 hours and on manual dispatch.
- Local tool: `tools/scraper/scrape_and_sync.js` — collects and posts to the backend ingest endpoint.
- Optional Supabase sync: `tools/scraper/sync_to_supabase.js` (requires `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`).

Recommended secrets for GitHub Actions:
- `BACKEND_URL` — URL to the backend API (used for triggering ingest)
- `SCRAPER_TRIGGER_TOKEN` — optional bearer token
- `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` — optional; enable direct Supabase sync
- `WEBHOOK_NOTIFY_URL` — optional webhook to receive run summaries

See `tools/scraper/README.md` for details and run instructions.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
