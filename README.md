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

### Backend Setup

1. Navigate to the `backend` directory.
2. Update `src/main/resources/application.properties` with your MySQL credentials.
3. Run the application:
   ```bash
   mvn spring-boot:run
   ```

### Frontend Setup

1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
