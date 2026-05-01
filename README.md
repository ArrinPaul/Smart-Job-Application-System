# Smart Job Portal System

[![Project Status: Active](https://img.shields.io/badge/status-active-success.svg)](https://github.com/your-repo/smart-job-portal-system)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A modern, production-ready recruitment platform that connects job seekers, recruiters, and administrators with real-time data synchronization and intelligent job scraping.

---

## 📑 Table of Contents

- [About the Project](#about-the-project)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development Setup](#local-development-setup)
- [Automated Job Scraper](#automated-job-scraper)
- [API Endpoints](#api-endpoints)
- [Security](#security)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## 💡 About the Project

The Smart Job Portal System streamlines the recruitment lifecycle. It offers a comprehensive dashboard for administrators, a portal for recruiters to manage listings, and a user-friendly interface for job seekers to find and apply for opportunities. With an automated scraping engine, the system ensures job listings remain current and comprehensive.

## ✨ Key Features

- **Role-Based Access Control**: Secure separation of concerns for Administrators, Recruiters, and Job Seekers.
- **Job Lifecycle Management**: Full CRUD capabilities for job postings.
- **Smart Search & Filtering**: Sophisticated search functionality with customizable filters.
- **Application Workflow**: Candidates can apply, upload documents, and track status effortlessly.
- **Admin Dashboard**: Real-time analytics, user management, and system health metrics.
- **Automated Scraping**: Scheduled, intelligent scraping of external portals (Indeed, etc.) with automated data normalization.
- **User Onboarding**: Intuitive step-by-step guidance for new registrations.

## 📂 Project Structure

```text
smart-job-portal-system/
├── backend/          # Spring Boot API
├── frontend/         # Angular SPA
├── supabase/         # PostgreSQL migrations
├── scripts/          # Operational utility scripts
└── tools/scraper/    # Automated job scraping engine
```

![System Architecture Diagram](https://via.placeholder.com/800x300.png?text=System+Architecture+Diagram)

---

## 🛠 Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Backend** | Java 21, Spring Boot 3 | High-performance RESTful API |
| **Frontend** | Angular 17, TypeScript | Modern, responsive SPA |
| **Database** | PostgreSQL, Supabase | Scalable relational storage |
| **Auth** | JWT, Spring Security | Secure, stateless authentication |
| **Migration** | Flyway | Versioned database evolution |
| **Scraping** | JS (Node.js), Jsoup/Selenium | Data acquisition & normalization |

---

## 🚀 Getting Started

![Local Dev Setup](https://via.placeholder.com/800x200.png?text=Development+Workflow+Overview)

### Prerequisites

Ensure you have the following installed locally:
- [Java 21](https://adoptium.net/) (or higher)
- [Maven 3.9](https://maven.apache.org/) (or higher)
- [Node.js 20](https://nodejs.org/) (or higher) & npm
- [Git](https://git-scm.com/)
- A [Supabase](https://supabase.com/) account

### Local Development Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/your-repo/smart-job-portal-system.git
cd smart-job-portal-system
```

#### 2. Configure Backend
Navigate to `backend/` and create a `.env` file based on `.env.example`:
```env
# backend/.env
SPRING_PROFILES_ACTIVE=supabase
SUPABASE_DB_HOST=db.<your-project-ref>.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=<your-db-password>
```

#### 3. Start Backend
Run the development server using the provided scripts:
```powershell
cd backend
./run-local.ps1 -Profile supabase
```

#### 4. Start Frontend
```bash
cd ../frontend
npm install
ng serve
```
Access the application at `http://localhost:4200`.

---

## 🤖 Automated Job Scraper

The system includes a robust scraping service to automate content population.

- **Workflow**: `.github/workflows/job-scraper.yml` (Scheduled/Manual)
- **Engine**: Node.js scripts in `tools/scraper/`
- **Setup**: Ensure Node.js environment is configured in `tools/scraper/`.
- **Run**: See `tools/scraper/README.md` for specific execution details.

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | JWT Authentication |
| `GET` | `/api/jobs` | Public job listing search |
| `POST` | `/api/recruiter/jobs` | Post new listing (Recruiter) |
| `POST` | `/api/jobseeker/apply` | Job application (Job Seeker) |

---

## 🛡 Security

- **Authentication**: Stateless JWT implementation via `HttpOnly` cookies.
- **Authorization**: Granular Role-Based Access Control (RBAC).
- **Hardening**: CORS enforcement and SQL injection protection (JPA).

---

## 📈 Deployment

### Backend
1. Build JAR: `mvn clean package -DskipTests`
2. Run: `java -jar target/jobportalsystem-*.jar` (ensure ENV vars are set).

### Frontend
1. Build: `ng build --configuration=production`
2. Deploy: Serve the `dist/` directory via any static hosting (e.g., Vercel, Nginx).

---

## 🛠 Troubleshooting

- **Database Connection**: Verify Supabase project status and host connection strings in `.env`.
- **Build Errors**: Ensure Maven and Node versions match requirements. Run `mvn clean` and `npm cache clean`.
- **Migrations**: If database schemas drift, verify Flyway logs in the backend output.

---

## 🤝 Contributing

1. Fork the repo.
2. Create a branch: `git checkout -b feature/name`.
3. Commit changes: `git commit -m 'feat: added X'`.
4. Push: `git push origin feature/name`.
5. Submit a Pull Request.

---

## 📜 License
Licensed under the [MIT License](LICENSE).
