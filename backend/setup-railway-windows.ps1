# Setup script for Smart Job Portal System - Railway MySQL (PowerShell)
# Usage: .\setup-railway-windows.ps1

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "Smart Job Portal System - Railway Setup" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# Set Railway MySQL credentials
$env:MYSQLHOST = "switchyard.proxy.rlwy.net"
$env:MYSQLPORT = "16937"
$env:MYSQLDATABASE = "railway"
$env:MYSQLUSER = "root"
$env:MYSQLPASSWORD = "NSnLumKaKMazQIGXCXVIqlxmSAZmhXDF"

# Set server configuration
$env:SERVER_PORT = "8080"
$env:HIKARI_MAX_POOL = "20"

# Set security
$env:JWT_SECRET = "smartjobportalsecretkey2024"
$env:JWT_EXPIRATION = "86400000"

# Set CORS
$env:CORS_ALLOWED_ORIGINS = "http://localhost:4200,http://localhost:3000"

# Set logging
$env:LOG_PATH = "logs"

# Set admin bootstrap
$env:ADMIN_BOOTSTRAP_ENABLED = "true"
$env:ADMIN_BOOTSTRAP_USERNAME = "admin"
$env:ADMIN_BOOTSTRAP_EMAIL = "admin@jobportal.local"
$env:ADMIN_BOOTSTRAP_PASSWORD = "Admin@123"

# Set data loader
$env:DATA_LOADER_ENABLED = "true"

Write-Host ""
Write-Host "✅ All environment variables have been set (session-local)!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Environment Variables Configured:" -ForegroundColor Cyan
Write-Host "  - Database: Railway MySQL (switchyard.proxy.rlwy.net:16937)" -ForegroundColor Gray
Write-Host "  - Server Port: 8080" -ForegroundColor Gray
Write-Host "  - JWT Secret: smartjobportalsecretkey2024" -ForegroundColor Gray
Write-Host "  - CORS Origins: http://localhost:4200,http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "NOTE: These variables are set for the current PowerShell session only." -ForegroundColor Yellow
Write-Host "To set them permanently, run setup-railway-windows.bat as Administrator." -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. cd backend" -ForegroundColor Gray
Write-Host "  2. mvn clean spring-boot:run" -ForegroundColor Gray
Write-Host ""
Write-Host "To verify setup, run:" -ForegroundColor Cyan
Write-Host "  mvn spring-boot:run -DskipTests" -ForegroundColor Gray
Write-Host ""
