#!/bin/bash
# Setup script for Smart Job Portal System - Railway MySQL
# Usage: bash setup-railway-linux.sh

echo ""
echo "============================================"
echo "Smart Job Portal System - Railway Setup"
echo "============================================"
echo ""

# Set Railway MySQL credentials
export MYSQLHOST="YOUR_RAILWAY_HOST"
export MYSQLPORT="YOUR_RAILWAY_PORT"
export MYSQLDATABASE="YOUR_RAILWAY_DATABASE"
export MYSQLUSER="YOUR_RAILWAY_USER"
export MYSQLPASSWORD="YOUR_RAILWAY_PASSWORD"

# Set server configuration
export SERVER_PORT="8080"
export HIKARI_MAX_POOL="20"

# Set security
export JWT_SECRET="YOUR_LONG_RANDOM_JWT_SECRET"
export JWT_EXPIRATION="86400000"

# Set CORS
export CORS_ALLOWED_ORIGINS="http://localhost:4200,http://localhost:3000"

# Set logging
export LOG_PATH="logs"

# Set admin bootstrap
export ADMIN_BOOTSTRAP_ENABLED="false"
export ADMIN_BOOTSTRAP_USERNAME="admin"
export ADMIN_BOOTSTRAP_EMAIL="admin@jobportal.local"
export ADMIN_BOOTSTRAP_PASSWORD="YOUR_STRONG_ADMIN_PASSWORD"

# Set data loader
export DATA_LOADER_ENABLED="true"

echo ""
echo "✅ All environment variables have been set!"
echo ""
echo "Environment Variables Configured:"
echo "  - Database: Railway MySQL (from your environment values)"
echo "  - Server Port: 8080"
echo "  - JWT Secret: [configured]"
echo "  - CORS Origins: http://localhost:4200,http://localhost:3000"
echo ""
echo "Next Steps:"
echo "  1. cd backend"
echo "  2. mvn clean spring-boot:run"
echo ""
echo "To verify setup, run:"
echo "  mvn spring-boot:run -DskipTests"
echo ""
