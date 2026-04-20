# Smart Job Portal System - PRD & Progress Ledger

## Original Problem Statement (Summarized)
Build and stabilize a full-stack Smart Job Portal with:
- Spring Boot backend APIs for auth, jobs, applications, resumes, and admin analytics.
- Angular frontend for job seekers, recruiters, and admins.
- Reliable local-first developer workflow.

Session priorities evolved as:
1. Run the project locally and fix login flow.
2. Migrate from MySQL to Supabase/PostgreSQL.
3. Add proper migrations and environment setup.
4. Remove MySQL runtime usage.
5. Simplify auth by disabling CAPTCHA and verification systems.
6. Redesign the full frontend without changing the tech stack.

## Product Goals
- Deliver a stable role-based job portal experience (Admin, Recruiter, Job Seeker).
- Ensure database portability and predictable schema setup via Flyway migrations.
- Keep auth usable in development with basic username/password sign-in.
- Provide a modern, consistent, responsive UI across all major frontend routes.

## Architecture
- `backend/` - Spring Boot 3.2 API, Spring Security, JPA/Hibernate, Actuator.
- `backend/src/main/resources/db/migration/supabase/` - Flyway SQL migrations for PostgreSQL/Supabase.
- `frontend/` - Angular 17 standalone app with route-based pages and shared services.
- `frontend/src/styles.css` - Global design system and visual language.
- Root docs: `README.md`, `DATABASE.md`, `PRD.md`, `todo.md`, `Plan.md`.

## Functional Scope
- Authentication: register, login, logout, role-aware navigation.
- Jobs: post jobs, list/search jobs, view details.
- Applications: apply, track status, recruiter review.
- Resume: upload and manage resume document.
- Admin: user/job/system overview dashboards and monitoring views.

## Completed Work (Current Session Trail)
### Backend and Database
- Migrated runtime DB dependency from MySQL to PostgreSQL.
- Enabled Flyway and added structured initial schema migration:
  - `users`, `jobs`, `applications`, `resumes`.
  - Core constraints, indexes, and uniqueness checks.
- Added Supabase-compatible datasource and pooling configuration.
- Updated `Resume` binary mapping for PostgreSQL compatibility (`bytea`).
- Updated properties and env templates for Supabase profile usage.
- Disabled mail health contributor for cleaner local health status reporting.

### Authentication Simplification
- Removed CAPTCHA gating in login flow.
- Removed email-verification requirement in login path.
- Registration now supports immediate login viability in the simplified flow.
- Added explicit `AuthenticationException` handling to return 401 responses.
- Frontend auth interceptor now preserves clearer login-specific error behavior.

### Frontend Redesign (Implemented)
- Rebuilt global design language in `frontend/src/styles.css` with:
  - New typography pairing (`Bricolage Grotesque` + `Cardo`).
  - Warm editorial palette and tokenized CSS variables.
  - Layered atmospheric background (gradients + subtle patterning).
  - Elevated card/panel styling, updated nav/chip/button system.
  - Refined status pills, tables, empty states, and form controls.
  - Meaningful entry animations and sheen motion.
  - Responsive behavior preserved for desktop and mobile.
- Aligned admin-specific CSS overrides with new global tokens:
  - `admin-overview.component.css`
  - `admin-system.component.css`
  - `admin-shell.component.css`
- Redesigned shared UI feedback primitives:
  - `shared/toast.component.ts` visual refresh.
  - `shared/spinner.component.ts` overlay and spinner refresh.

## Verification Status
- Backend compilation: passed in previous validation cycle.
- API behavior verified in latest backend checks:
  - valid admin login returns 200,
  - invalid credentials return 401,
  - health endpoint observed as UP.
- Frontend build re-validated after redesign:
  - `npm run build` succeeded.
  - Output generated to `frontend/dist/jobportal-frontend`.
  - Existing warning remains: initial bundle exceeds configured budget by ~97 kB.

## Environment and Migration Contract
- Primary runtime profile: Supabase/PostgreSQL.
- Migration source of truth: Flyway scripts under
  `backend/src/main/resources/db/migration/supabase/`.
- Local setup source of truth:
  - `backend/.env`
  - `backend/.env.example`
  - `DATABASE.md` and `README.md`

## Non-Goals (Current Scope)
- No tech stack migration from Angular/Spring Boot.
- No OAuth/social login rollout in this phase.
- No CAPTCHA or email verification hardening in this phase.
- No complete feature-level UX rewrite of each component template beyond global system-driven redesign.

## Risks and Constraints
- Supabase pooler behavior requires specific JDBC tuning to avoid prepared statement issues.
- Cookie/session behavior differs between localhost HTTP and production HTTPS.
- Bundle budget warning indicates room for frontend optimization.

## Next Prioritized Actions
1. Perform route-by-route visual QA and accessibility pass after redesign (all roles).
2. Trim frontend bundle size under Angular budget (lazy loading and heavy dependency review).
3. Remove residual MySQL references from helper scripts/tests where still present.
4. Add integration tests for simplified auth behavior (password-only flow).
5. Harden production profile settings separately from localhost convenience defaults.

## Acceptance Criteria Snapshot
- App runs locally with Supabase/PostgreSQL configuration.
- Flyway migrations apply successfully on startup.
- Login works with basic username/password flow.
- Core pages render with the redesigned visual system on desktop and mobile.
- Frontend build passes without compile errors.
