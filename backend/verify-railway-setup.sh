#!/bin/bash
# Smart Job Portal System - Railway Database Connection Verification
# This script verifies your Railway MySQL configuration before running the app

echo ""
echo "=========================================="
echo "Railway MySQL Connection Verification"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

error_count=0
warning_count=0

# Function to check environment variables
check_env_var() {
    local var_name=$1
    local var_value=${!var_name}
    
    if [ -z "$var_value" ]; then
        echo -e "${RED}✗ ${var_name} is not set${NC}"
        ((error_count++))
        return 1
    else
        echo -e "${GREEN}✓ ${var_name} is set${NC}"
        # Only show partial value for sensitive vars
        if [[ "$var_name" == *"PASSWORD"* || "$var_name" == *"SECRET"* ]]; then
            echo "  Value: ${var_value:0:10}... (hidden)"
        else
            echo "  Value: $var_value"
        fi
        return 0
    fi
}

echo "1. Checking Required Environment Variables..."
echo "================================================="
echo ""

# Check critical variables
check_env_var "MYSQLHOST"
check_env_var "MYSQLPORT"
check_env_var "MYSQLDATABASE"
check_env_var "MYSQLUSER"
check_env_var "MYSQLPASSWORD"
check_env_var "SERVER_PORT"
check_env_var "JWT_SECRET"

echo ""
echo "2. Checking MySQL Connectivity (if mysql client installed)..."
echo "================================================="
echo ""

# Check if mysql command exists
if command -v mysql &> /dev/null; then
    echo "MySQL client found, attempting connection..."
    
    if mysql -h "$MYSQLHOST" -P "$MYSQLPORT" -u "$MYSQLUSER" -p"$MYSQLPASSWORD" -e "SELECT 1;" &> /dev/null; then
        echo -e "${GREEN}✓ Successfully connected to Railway MySQL${NC}"
    else
        echo -e "${RED}✗ Failed to connect to Railway MySQL${NC}"
        echo "  Host: $MYSQLHOST"
        echo "  Port: $MYSQLPORT"
        echo "  User: $MYSQLUSER"
        ((error_count++))
    fi
else
    echo -e "${YELLOW}⚠ MySQL client not installed, skipping connection test${NC}"
    echo "  Install with: apt-get install mysql-client (Linux) or brew install mysql-client (macOS)"
    ((warning_count++))
fi

echo ""
echo "3. Checking Maven Installation..."
echo "================================================="
echo ""

if command -v mvn &> /dev/null; then
    mvn_version=$(mvn --version | head -1)
    echo -e "${GREEN}✓ Maven installed${NC}"
    echo "  Version: $mvn_version"
else
    echo -e "${RED}✗ Maven not found in PATH${NC}"
    ((error_count++))
fi

echo ""
echo "4. Checking Java Installation..."
echo "================================================="
echo ""

if command -v java &> /dev/null; then
    java_version=$(java -version 2>&1 | grep "version")
    echo -e "${GREEN}✓ Java installed${NC}"
    echo "  Version: $java_version"
else
    echo -e "${RED}✗ Java not found${NC}"
    ((error_count++))
fi

echo ""
echo "5. Database URL Construction..."
echo "================================================="
echo ""

# Construct JDBC URL
JDBC_URL="jdbc:mysql://${MYSQLHOST}:${MYSQLPORT}/${MYSQLDATABASE}?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"
echo "Constructed JDBC URL:"
echo "  $JDBC_URL"
echo ""

echo "6. Summary..."
echo "================================================="
echo ""

if [ $error_count -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Your Railway MySQL configuration is ready."
    echo ""
    echo "Next steps:"
    echo "  1. cd backend"
    echo "  2. mvn clean spring-boot:run"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Configuration errors found (${error_count})${NC}"
    if [ $warning_count -gt 0 ]; then
        echo -e "${YELLOW}⚠ Warnings (${warning_count})${NC}"
    fi
    echo ""
    echo "Action Required:"
    echo "  1. Set all missing environment variables"
    echo "  2. Verify Railway MySQL credentials are correct"
    echo "  3. Check your internet connection"
    echo ""
    exit 1
fi
