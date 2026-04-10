@echo off
REM Smart Job Portal System - Railway Database Connection Verification
REM This script verifies your Railway MySQL configuration before running the app

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo Railway MySQL Connection Verification
echo ==========================================
echo.

set error_count=0
set warning_count=0

echo 1. Checking Required Environment Variables...
echo =================================================
echo.

REM Function to check environment variable
REM Check MYSQLHOST
if "!MYSQLHOST!"=="" (
    echo [ERROR] MYSQLHOST is not set
    set /a error_count+=1
) else (
    echo [OK] MYSQLHOST is set
    echo      Value: !MYSQLHOST!
)

REM Check MYSQLPORT
if "!MYSQLPORT!"=="" (
    echo [ERROR] MYSQLPORT is not set
    set /a error_count+=1
) else (
    echo [OK] MYSQLPORT is set
    echo      Value: !MYSQLPORT!
)

REM Check MYSQLDATABASE
if "!MYSQLDATABASE!"=="" (
    echo [ERROR] MYSQLDATABASE is not set
    set /a error_count+=1
) else (
    echo [OK] MYSQLDATABASE is set
    echo      Value: !MYSQLDATABASE!
)

REM Check MYSQLUSER
if "!MYSQLUSER!"=="" (
    echo [ERROR] MYSQLUSER is not set
    set /a error_count+=1
) else (
    echo [OK] MYSQLUSER is set
    echo      Value: !MYSQLUSER!
)

REM Check MYSQLPASSWORD
if "!MYSQLPASSWORD!"=="" (
    echo [ERROR] MYSQLPASSWORD is not set
    set /a error_count+=1
) else (
    echo [OK] MYSQLPASSWORD is set
    echo      Value: (hidden)
)

REM Check SERVER_PORT
if "!SERVER_PORT!"=="" (
    echo [WARNING] SERVER_PORT is not set, using default 8080
    set /a warning_count+=1
) else (
    echo [OK] SERVER_PORT is set
    echo      Value: !SERVER_PORT!
)

REM Check JWT_SECRET
if "!JWT_SECRET!"=="" (
    echo [WARNING] JWT_SECRET is not set, using default
    set /a warning_count+=1
) else (
    echo [OK] JWT_SECRET is set
    echo      Value: (hidden)
)

echo.
echo 2. Checking Maven Installation...
echo =================================================
echo.

where mvn >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Maven found
    mvn --version | find /V "" | head -1
) else (
    echo [ERROR] Maven not found in PATH
    set /a error_count+=1
)

echo.
echo 3. Checking Java Installation...
echo =================================================
echo.

where java >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Java found
    java -version
) else (
    echo [ERROR] Java not found
    set /a error_count+=1
)

echo.
echo 4. Database URL Construction...
echo =================================================
echo.

REM Construct JDBC URL
set JDBC_URL=jdbc:mysql://!MYSQLHOST!:!MYSQLPORT!/!MYSQLDATABASE!?useSSL=false^&serverTimezone=UTC^&allowPublicKeyRetrieval=true
echo Constructed JDBC URL:
echo   !JDBC_URL!
echo.

echo 5. Summary...
echo =================================================
echo.

if %error_count% EQU 0 (
    echo [OK] All checks passed!
    echo.
    echo Your Railway MySQL configuration is ready.
    echo.
    echo Next steps:
    echo   1. cd backend
    echo   2. mvn clean spring-boot:run
    echo.
    exit /b 0
) else (
    echo [ERROR] Configuration errors found (!error_count!)
    if %warning_count% GTR 0 (
        echo [WARNING] Warnings found (!warning_count!)
    )
    echo.
    echo Action Required:
    echo   1. Set all missing environment variables
    echo   2. Verify Railway MySQL credentials are correct
    echo   3. Check your internet connection
    echo.
    exit /b 1
)

endlocal
