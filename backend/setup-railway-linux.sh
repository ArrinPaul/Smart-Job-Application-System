#!/bin/bash
# Setup script for Smart Job Portal System - Railway MySQL
# Usage: bash setup-railway-linux.sh

echo ""
echo "============================================"
echo "Smart Job Portal System - Railway Setup"
echo "============================================"
echo ""

# Set Railway MySQL credentials
export MYSQLHOST="switchyard.proxy.rlwy.net"
export MYSQLPORT="16937"
export MYSQLDATABASE="railway"
export MYSQLUSER="root"
export MYSQLPASSWORD="NSnLumKaKMazQIGXCXVIqlxmSAZmhXDF"

# Set server configuration
export SERVER_PORT="8080"
export HIKARI_MAX_POOL="20"

# Set security
export JWT_SECRET="smartjobportalsecretkey2024"
export JWT_EXPIRATION="86400000"

# Set CORS
export CORS_ALLOWED_ORIGINS="http://localhost:4200,http://localhost:3000"

# Set logging
export LOG_PATH="logs"

# Set admin bootstrap
export ADMIN_BOOTSTRAP_ENABLED="true"
export ADMIN_BOOTSTRAP_USERNAME="admin"
export ADMIN_BOOTSTRAP_EMAIL="admin@jobportal.local"
export ADMIN_BOOTSTRAP_PASSWORD="Admin@123"

# Set data loader
export DATA_LOADER_ENABLED="true"

echo ""
echo "✅ All environment variables have been set!"
echo ""
echo "Environment Variables Configured:"
echo "  - Database: Railway MySQL (switchyard.proxy.rlwy.net:16937)"
echo "  - Server Port: 8080"
echo "  - JWT Secret: smartjobportalsecretkey2024"
echo "  - CORS Origins: http://localhost:4200,http://localhost:3000"
echo ""
echo "Next Steps:"
echo "  1. cd backend"
echo "  2. mvn clean spring-boot:run"
echo ""
echo "To verify setup, run:"
echo "  mvn spring-boot:run -DskipTests"
echo ""
