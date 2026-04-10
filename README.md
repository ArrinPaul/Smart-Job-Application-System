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

- **Backend**: Spring Boot 3.2.0, Spring Data JPA, MySQL
- **Frontend**: Angular
- **Security**: Spring Security, JSON Web Token (JWT)
- **Language**: Java 17

## Project Structure

- `backend/`: Spring Boot application.
- `frontend/`: Angular application.

## Prerequisites

- JDK 17
- Maven
- MySQL
- Node.js & npm (for Angular)

## Getting Started

### Backend Setup - Local Development

1. Navigate to the `backend` directory.
2. Copy `.env.example` to `.env` and update with your database credentials:
   ```bash
   cp .env.example .env
   ```
3. For Railway MySQL, the `.env` file should include:
   ```properties
   MYSQLHOST=switchyard.proxy.rlwy.net
   MYSQLPORT=16937
   MYSQLDATABASE=railway
   MYSQLUSER=root
   MYSQLPASSWORD=YOUR_PASSWORD
   SERVER_PORT=8080
   HIKARI_MAX_POOL=20
   ```
4. Run the application:
   ```bash
   mvn clean spring-boot:run
   ```

### Backend Setup - Railway Deployment

1. **Create Railway Project**: Go to [railway.app](https://railway.app) and create a new project.
2. **Add MySQL**: Provision a MySQL database service.
3. **Set Environment Variables**: In the Railway dashboard, set these variables:
   - `MYSQLHOST` - Railway MySQL host
   - `MYSQLPORT` - Railway MySQL port
   - `MYSQLDATABASE` - Railway MySQL database name
   - `MYSQLUSER` - Railway MySQL username
   - `MYSQLPASSWORD` - Railway MySQL password
   - `SERVER_PORT` - Leave empty (Railway sets this)
   - `JWT_SECRET` - Your JWT secret key
   - `CORS_ALLOWED_ORIGINS` - Your frontend URL (e.g., `https://yourapp.railway.app`)

4. **Deploy**: Connect your Git repository and Railway will auto-deploy on every push.

For detailed configuration, see [RAILWAY_SETUP.md](RAILWAY_SETUP.md).

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
