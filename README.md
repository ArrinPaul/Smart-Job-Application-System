# Smart Job Portal System

A modern, production-ready recruitment platform that connects job seekers, recruiters, and administrators with real-time data synchronization and intelligent job scraping.

## ✨ Key Features

- **User Management**: Role-based access (Admin, Recruiter, Job Seeker) with secure JWT authentication
- **Job Management**: Post, edit, delete jobs with full recruiter control
- **Smart Job Search**: Filter and search jobs by title and location
- **Application Workflow**: Apply to jobs, upload resumes, track application status
- **Admin Dashboard**: Real-time analytics, user management, system health monitoring
- **Job Scraping**: Automated scraper that ingests jobs from Indeed, Internshala, and other portals
- **Data Normalization**: Structured, cleaned job data automatically stored in PostgreSQL/Supabase

## 🏗️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Spring Boot 3.2, Spring Security, Spring Data JPA |
| **Frontend** | Angular 17, Chart.js (admin analytics) |
| **Database** | PostgreSQL / Supabase with Flyway migrations |
| **Authentication** | JWT (httponly cookies) |
| **Job Scraping** | Jsoup, Selenium WebDriver (for dynamic content) |
| **Runtime** | Java 21 LTS |

## 📦 Project Structure

```
smart-job-portal-system/
├── backend/
│   ├── src/
│   │   ├── main/java/com/edutech/jobportalsystem/
│   │   │   ├── controller/          # REST endpoints
│   │   │   ├── service/             # Business logic (including JobScraperService)
│   │   │   ├── entity/              # JPA entities
│   │   │   ├── repository/          # Spring Data JPA repos
│   │   │   ├── config/              # Spring configuration
│   │   │   └── exception/           # Global error handling
│   │   ├── resources/
│   │   │   ├── application.properties
│   │   │   ├── application-supabase.properties
│   │   │   └── db/migration/supabase/V1__init_job_portal.sql
│   │   └── test/
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/               # Admin dashboard & pages
│   │   │   ├── job-list/
│   │   │   ├── applications/
│   │   │   ├── resume/
│   │   │   └── services/
│   │   ├── styles.css               # Design system (design tokens, animations)
│   │   └── environments/
│   └── package.json
└── supabase/
    └── migrations/
```

## 🚀 Getting Started

### Prerequisites

- **Java 21** (LTS)
- **Maven 3.9.6**
- **Node.js 20+** & npm
- **PostgreSQL 14+** or Supabase account
- **Git**

### Quick Start — Local Development

#### 1. Backend Setup (Port 8080)

```bash
cd backend

# Run with local H2 database (testing only)
./run-local.ps1 -Profile local

# Or run with Supabase PostgreSQL (production-like)
# First, set environment variables in .env or your terminal:
export SPRING_PROFILES_ACTIVE=supabase
export SUPABASE_DB_HOST=<your-supabase-host>
export SUPABASE_DB_PORT=6543
export SUPABASE_DB_NAME=postgres
export SUPABASE_DB_USER=postgres.<your-project>
export SUPABASE_DB_PASSWORD=<your-password>

mvn clean spring-boot:run -Dspring.profiles.active=supabase
```

#### 2. Frontend Setup (Port 4200)

```bash
cd frontend
npm install
ng serve

# Open http://localhost:4200 in your browser
```

#### 3. Test the Flow

1. **Register** a Recruiter and Job Seeker account
2. **Post a Job** as the Recruiter
3. **Search and Apply** as the Job Seeker
4. **Upload Resume** on the Resume page
5. **View Admin Dashboard** (login as admin@example.com / admin) to see analytics

### Production Build

#### Backend

```bash
cd backend
mvn clean package -DskipTests

# Run the JAR
java -jar target/jobportalsystem-0.0.1-SNAPSHOT.jar \
  --spring.profiles.active=supabase \
  --server.port=8080 \
  --supabase.db.host=$DB_HOST \
  --supabase.db.port=$DB_PORT \
  --supabase.db.name=$DB_NAME \
  --supabase.db.user=$DB_USER \
  --supabase.db.password=$DB_PASSWORD
```

#### Frontend

```bash
cd frontend
ng build --configuration=production

# Serve the production build
npx serve dist/jobportal-frontend/browser --port 80
```

## 🔧 Admin Panel Features

### Dashboard Overview
- **KPI Cards**: Total users, jobs, applications, active metrics
- **7-Day Job Posting Trends**: Line chart showing job posting activity
- **Weekly Recruiter Activity**: Bar chart with recruiter and job post counts
- **Application Funnel**: Conversion visualization (Applied → Hired)
- **Platform Activity Pulse**: Fulfillment rate, user retention percentages
- **Users by Role**: Breakdown of Admin, Recruiter, Job Seeker counts
- **Applications by Status**: Distribution of application statuses

### User Management
- View all registered users with roles and contact info
- Filter and search users
- Bulk user actions (future enhancement)

### Job Management
- Monitor all active and historical job postings
- View recruiter information and job metadata
- Track job posting timestamps

### System Status
- Real-time API health (UP/DOWN)
- Database connection status
- JVM uptime and Java version info
- Backend health endpoint details

## 🕷️ Job Scraper Architecture

The system includes an intelligent job scraper that automatically collects jobs from multiple portals:

### Supported Portals
- **Indeed** (indeed.com / indeed.co.in)
- **Internshala** (internshala.com)
- **LinkedIn** (linkedin.com/jobs) - planned
- **Glassdoor** (glassdoor.com/jobs) - planned

### Data Pipeline

```
Portal Scraper → Raw Data Extract → Data Cleaner → Job Entity → Database
                                                        ↓
                                                    Admin View
                                                        ↓
                                                  Frontend Display
```

### Scraper Service

Located in `backend/src/main/java/com/edutech/jobportalsystem/service/JobScraperService.java`:

```java
@Service
public class JobScraperService {
  
  // Scrape jobs from multiple portals
  public List<Job> scrapeAndNormalize(String portal, String query);
  
  // Schedule periodic scraping (e.g., every 6 hours)
  @Scheduled(fixedRate = 21600000) // 6 hours
  public void scheduledScraping();
}
```

#### Scraping Workflow

1. **Extract**: Fetch HTML from portal using Jsoup or Selenium
2. **Parse**: Extract job title, description, location, salary, company
3. **Clean**: Normalize text, remove HTML tags, validate data
4. **Enrich**: Add source portal, timestamp, apply-to URL
5. **Store**: Save to `jobs` table with `posted_by = SYSTEM` for automation
6. **Frontend**: Jobs appear instantly in job list and admin dashboard

## 🔐 Authentication Flow

1. User registers with username, email, password, and role
2. System creates account and stores hashed password
3. User logs in → JWT issued in httponly cookie
4. All API requests include JWT for authorization
5. Roles: ADMIN (full access), RECRUITER (job management), JOB_SEEKER (browse/apply)

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login and get JWT
- `POST /api/auth/logout` - Clear session

### Jobs
- `GET /api/jobs` - List all jobs (searchable)
- `POST /api/recruiter/jobs` - Create job (Recruiter)
- `PUT /api/recruiter/jobs/:id` - Edit job
- `DELETE /api/recruiter/jobs/:id` - Delete job

### Applications
- `POST /api/job/apply` - Apply to job
- `GET /api/recruiter/applications` - View applications for own jobs (Recruiter)
- `GET /api/jobseeker/applications` - View own applications
- `PUT /api/recruiter/applications/:id/status` - Update application status

### Resume
- `POST /api/jobseeker/resume` - Upload resume
- `GET /api/resume/:id` - Download resume

### Admin
- `GET /api/admin/users` - All users
- `GET /api/admin/jobs` - All jobs
- `GET /api/admin/dashboard/summary` - Analytics dashboard
- `GET /api/admin/system/status` - Health & system info

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
mvn test
```

### Manual API Testing
```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"recruiter1","email":"rec@example.com","password":"pass123","role":"RECRUITER"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"recruiter1","password":"pass123"}'

# Post a job
curl -X POST http://localhost:8080/api/recruiter/jobs \
  -H "Content-Type: application/json" \
  -H "Cookie: token=<JWT>" \
  -d '{"title":"Senior Engineer","description":"...","location":"Remote"}'
```

## 📱 Routing & Navigation

### Routes
- `/` → Redirect to `/login`
- `/login` → Login page
- `/register` → Registration page
- `/jobs` → Browse all jobs (authenticated)
- `/post-job` → Create new job (Recruiter only)
- `/applications` → View applications (Recruiter/Job Seeker)
- `/resume` → Manage resumes (Job Seeker only)
- `/admin` → Admin dashboard overview
- `/admin/users` → User management
- `/admin/jobs` → Job monitoring
- `/admin/system` → System health
- `/**` → Redirect to `/login`

### Route Guards
- **AuthGuard**: Redirects unauthenticated users to `/login`
- **RoleGuard**: Restricts routes by user role (ADMIN, RECRUITER, JOB_SEEKER)

## 🌐 Deployment

### Option 1: Local Server
```bash
# Backend
mvn clean spring-boot:run

# Frontend (separate terminal)
ng serve
```

### Option 2: Docker (Coming Soon)
```bash
# Build backend image
docker build -t job-portal-backend ./backend

# Build frontend image
docker build -t job-portal-frontend ./frontend

# Run with docker-compose
docker-compose up
```

### Option 3: Railway / Cloud Platforms

Set environment variables and deploy:
- `SPRING_PROFILES_ACTIVE=supabase`
- `SUPABASE_DB_*` credentials
- `CORS_ALLOWED_ORIGINS` for frontend URL

## 🛠️ Maintenance & Admin Commands

### Database Migrations
```bash
# Flyway auto-runs on startup. To manually manage:
mvn flyway:migrate -Dspring.profiles.active=supabase
```

### View Application Logs
```bash
tail -f backend/logs/app.log
```

### Trigger Job Scraper (Manual)
```bash
# Future: Admin endpoint to trigger scraping
POST /api/admin/scraper/trigger-now
```

## 📝 License

This project is provided as-is for educational and commercial use.

## 👥 Support

For issues or questions, please refer to the GitHub repository issues section.

---

**Last Updated:** April 2026 | **Status:** Production Ready ✅

