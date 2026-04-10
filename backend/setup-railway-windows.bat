@echo off
REM Setup script for Smart Job Portal System - Railway MySQL
REM This script sets environment variables for local development with Railway database

echo.
echo ============================================
echo Smart Job Portal System - Railway Setup
echo ============================================
echo.

REM Set Railway MySQL credentials
setx MYSQLHOST switchyard.proxy.rlwy.net
setx MYSQLPORT 16937
setx MYSQLDATABASE railway
setx MYSQLUSER root
setx MYSQLPASSWORD NSnLumKaKMazQIGXCXVIqlxmSAZmhXDF

REM Set server configuration
setx SERVER_PORT 8080
setx HIKARI_MAX_POOL 20

REM Set security
setx JWT_SECRET smartjobportalsecretkey2024
setx JWT_EXPIRATION 86400000

REM Set CORS
setx CORS_ALLOWED_ORIGINS "http://localhost:4200,http://localhost:3000"

REM Set logging
setx LOG_PATH logs

REM Set admin bootstrap
setx ADMIN_BOOTSTRAP_ENABLED true
setx ADMIN_BOOTSTRAP_USERNAME admin
setx ADMIN_BOOTSTRAP_EMAIL admin@jobportal.local
setx ADMIN_BOOTSTRAP_PASSWORD Admin@123

REM Set data loader
setx DATA_LOADER_ENABLED true

echo.
echo ✅ All environment variables have been set!
echo.
echo NOTE: You may need to restart your terminal or IDE for changes to take effect.
echo.
echo Environment Variables Configured:
echo   - Database: Railway MySQL (switchyard.proxy.rlwy.net:16937)
echo   - Server Port: 8080
echo   - JWT Secret: smartjobportalsecretkey2024
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
