@echo off
REM Setup script for Smart Job Portal System - Railway MySQL
REM This script sets environment variables for local development with Railway database

echo.
echo ============================================
echo Smart Job Portal System - Railway Setup
echo ============================================
echo.

REM Set Railway MySQL credentials
setx MYSQLHOST YOUR_RAILWAY_HOST
setx MYSQLPORT YOUR_RAILWAY_PORT
setx MYSQLDATABASE YOUR_RAILWAY_DATABASE
setx MYSQLUSER YOUR_RAILWAY_USER
setx MYSQLPASSWORD YOUR_RAILWAY_PASSWORD

REM Set server configuration
setx SERVER_PORT 8080
setx HIKARI_MAX_POOL 20

REM Set security
setx JWT_SECRET YOUR_LONG_RANDOM_JWT_SECRET
setx JWT_EXPIRATION 86400000

REM Set CORS
setx CORS_ALLOWED_ORIGINS "http://localhost:4200,http://localhost:3000"

REM Set logging
setx LOG_PATH logs

REM Set admin bootstrap
setx ADMIN_BOOTSTRAP_ENABLED false
setx ADMIN_BOOTSTRAP_USERNAME admin
setx ADMIN_BOOTSTRAP_EMAIL admin@jobportal.local
setx ADMIN_BOOTSTRAP_PASSWORD YOUR_STRONG_ADMIN_PASSWORD

REM Set data loader
setx DATA_LOADER_ENABLED true

echo.
echo ✅ All environment variables have been set!
echo.
echo NOTE: You may need to restart your terminal or IDE for changes to take effect.
echo.
echo Environment Variables Configured:
echo   - Database: Railway MySQL (from your environment values)
echo   - Server Port: 8080
echo   - JWT Secret: [configured]
echo   - CORS Origins: http://localhost:4200,http://localhost:3000
echo.
echo Next Steps:
echo   1. Close and reopen your terminal
echo   2. Navigate to: cd backend
echo   3. Run: mvn clean spring-boot:run
echo.
echo To verify setup, run this command:
echo   mvn spring-boot:run -DskipTests
echo.
pause
