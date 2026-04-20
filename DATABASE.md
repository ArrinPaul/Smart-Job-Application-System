# PostgreSQL (Supabase) Database Setup Guide

This project is configured for PostgreSQL and tested with Supabase.

## 1. Connection Settings

Set these in `backend/.env`:

```properties
SPRING_PROFILES_ACTIVE=supabase
SUPABASE_DB_HOST=aws-1-ap-northeast-1.pooler.supabase.com
SUPABASE_DB_PORT=6543
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres.xsroytgypeekyuixhysy
SUPABASE_DB_PASSWORD=YOUR_PASSWORD
```

Notes:
- Port `6543` is Supabase transaction pooler.
- JDBC config disables prepared statements for pooler compatibility.

## 2. Migration

Flyway migration is integrated into backend startup.

Migration file:
- `backend/src/main/resources/db/migration/supabase/V1__init_job_portal.sql`

Run backend:

```powershell
Set-Location backend
.\bin\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run
```

On startup, Flyway applies the migration and Hibernate validates schema.

## 3. Schema Summary

Main tables:
- `users`
- `jobs`
- `resumes`
- `applications`

Key constraints:
- `users.username` unique
- `users.email` unique
- `resumes.user_id` unique (one resume owner mapping)
- `applications` unique `(applicant_id, job_id)`

## 4. Runtime Validation

After startup:
- Backend health endpoint: `http://localhost:8080/api/actuator/health`
- Login endpoint: `POST http://localhost:8080/api/auth/login`
- Session endpoint: `GET http://localhost:8080/api/auth/session`

## 5. Security Note

- `SUPABASE_ANON_KEY` is not used for backend JDBC connections.
- Rotate any shared credentials/keys after setup.
