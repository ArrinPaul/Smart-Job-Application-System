# Smart Job Portal System

[![Project Status: Active](https://img.shields.io/badge/status-active-success.svg)](https://github.com/your-repo/smart-job-portal-system)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Angular](https://img.shields.io/badge/Angular-17.3-red.svg)](https://angular.io/)
[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://www.oracle.com/java/)

A modern, production-ready recruitment platform that connects job seekers, recruiters, and administrators with real-time data synchronization and intelligent job scraping.

---

## 📑 Table of Contents

- [About the Project](#about-the-project)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development Setup](#local-development-setup)
  - [Running with Supabase](#running-with-supabase)
- [Automated Job Scraper](#automated-job-scraper)
- [API Endpoints](#api-endpoints)
- [Security](#security)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## 💡 About the Project

The **Smart Job Portal System** is designed to bridge the gap between talent and opportunity. It streamlines the recruitment lifecycle by providing specialized interfaces for different user roles. Whether you are an administrator monitoring system health, a recruiter managing listings, or a job seeker finding your next career move, this platform provides the tools you need.

### Why this project?
- **AI-Ready**: Integrated with Apache Tika for intelligent resume parsing.
- **Automated**: Background scrapers ensure the job pool is always fresh.
- **Secure**: Built with modern security standards (JWT, HttpOnly cookies, RBAC).
- **Scalable**: Uses Supabase (PostgreSQL) for a robust cloud-native database experience.

---

## ✨ Key Features

| Feature | Description | Icon |
| :--- | :--- | :---: |
| **Role-Based Access** | Secure separation of concerns for Admins, Recruiters, and Seekers. | ![Secure Access](frontend/src/assets/about/secure-access.svg) |
| **Job Management** | Full CRUD capabilities with SEO-friendly slugs. | ![Job Posting](frontend/src/assets/about/job-posting.svg) |
| **Smart Search** | Advanced filtering by location, title, and industry. | ![Job Discovery](frontend/src/assets/about/job-discovery.svg) |
| **Resume Parsing** | Automated data extraction from uploaded resumes. | ![Applicant Support](frontend/src/assets/about/applicant-support.svg) |
| **Admin Insights** | Real-time analytics and system monitoring dashboard. | ![Service Overview](frontend/src/assets/about/service-overview.svg) |
| **Automated Scraping** | Background sync from Indeed and other major portals. | 🤖 |

---

## 🏗 System Architecture

The following diagram illustrates the high-level architecture and data flow between the components:

```mermaid
graph TD
    User((User)) -->|HTTPS| Frontend[Angular 17 SPA]
    Frontend -->|REST API + JWT| Backend[Spring Boot 3 API]
    Backend -->|JDBC / Flyway| DB[(Supabase PostgreSQL)]
    
    subgraph "External Integration"
        Scraper[Node.js Scraper] -->|SQL/Direct| DB
        GitHub[GitHub Actions] -->|Trigger| Scraper
    end

    subgraph "Security Layer"
        Backend --> Auth[Spring Security + JWT]
        Auth --> Role[RBAC: Admin/Recruiter/User]
    end
```

---

## 📂 Project Structure

```text
smart-job-portal-system/
├── backend/          # Spring Boot 3 Java API
│   ├── src/          # Application source code
│   └── run-*.ps1     # PowerShell execution scripts
├── frontend/         # Angular 17 Single Page Application
│   └── src/app/      # Modular component-based architecture
├── supabase/         # PostgreSQL migrations and seed scripts
├── scripts/          # Operational utility scripts
└── tools/scraper/    # Automated Node.js job scraping engine
```

---

## 🛠 Technology Stack

### Backend
- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Security**: Spring Security 6 (JWT via HttpOnly Cookies)
- **Data**: Spring Data JPA + Hibernate
- **Migrations**: Flyway
- **Parsing**: Apache Tika (Resume Extraction)
- **Scraping**: Jsoup
- **Rate Limiting**: Bucket4j

### Frontend
- **Framework**: Angular 17.3
- **Styling**: Vanilla CSS (Modern CSS variables)
- **Visualization**: Chart.js (Admin Dashboards)
- **Security**: DOMPurify
- **Markdown**: Marked

### Infrastructure
- **Database**: PostgreSQL (Managed by Supabase)
- **Storage**: Supabase Storage
- **Automation**: GitHub Actions

---

## 🚀 Getting Started

### Prerequisites

- **Java 17** (or higher)
- **Maven 3.9** (or higher)
- **Node.js 20.x** (LTS) & npm
- **Supabase CLI** (optional, for local DB development)

### Local Development Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/your-repo/smart-job-portal-system.git
cd smart-job-portal-system
```

#### 2. Backend Configuration
Navigate to `backend/` and create a `.env` file from the example:
```bash
cd backend
cp .env.example .env
```
*Edit `.env` and fill in your Supabase connection strings.*

#### 3. Running the Project

**Using Supabase (Recommended):**
This project is pre-configured to work with Supabase. Ensure your `.env` has `SPRING_PROFILES_ACTIVE=supabase`.
```powershell
./run-supabase.ps1
```

**Standard Local Run:**
```bash
mvn spring-boot:run
```

#### 4. Frontend Setup
```bash
cd ../frontend
npm install
npm start
```
The app will be available at `http://localhost:4200`.

---

## 🤖 Automated Job Scraper

The system includes a robust scraping service to automate content population.

```mermaid
sequenceDiagram
    participant GH as GitHub Actions
    participant S as Scraper (Node.js)
    participant E as External Portals (Indeed)
    participant DB as Supabase DB

    GH->>S: Trigger (Cron/Manual)
    S->>E: Fetch Job Listings
    E-->>S: Raw HTML/JSON
    S->>S: Normalize & Deduplicate
    S->>DB: Upsert to 'jobs' table
```

See [tools/scraper/README.md](tools/scraper/README.md) for detailed configuration.

---

## 🛡 Security

- **JWT + Cookies**: Tokens are stored in `HttpOnly`, `SameSite=Strict` cookies to prevent XSS.
- **RBAC**: Endpoints are strictly guarded by `hasRole()` checks.
- **Validation**: Strict server-side validation using JSR-303 (Hibernate Validator).
- **CORS**: Domain-restricted access controlled via backend policy.

---

## 📈 Deployment

### Production Build
1. **Backend**: `mvn clean package -Pprod`
2. **Frontend**: `ng build --configuration=production`

### Hosting Suggestions
- **Backend**: AWS Elastic Beanstalk, Heroku, or Docker/K8s.
- **Frontend**: Vercel, Netlify, or Nginx.
- **Database**: Supabase (Cloud).

---

## 🛠 Troubleshooting

| Issue | Solution |
| :--- | :--- |
| **CORS Errors** | Ensure `CORS_ALLOWED_ORIGINS` in `.env` matches your frontend URL. |
| **Flyway Failed** | Check if the DB schema is clean or manually repair `flyway_schema_history`. |
| **Node mismatch** | Use `nvm` to switch to Node 20. |

---

## 🤝 Contributing

We welcome contributions! Please follow the [standard Git Flow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow).
1. Fork the repo.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
