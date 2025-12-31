#!/bin/bash

set -e

echo "🧪 Starting IT Enterprise Platform Tests"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0

test_command() {
    local name=$1
    local command=$2
    
    echo -n "Testing $name... "
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC}"
        ((FAILED++))
        return 1
    fi
}

echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo ""
echo "🔍 Type Checking..."

# Check root TypeScript
test_command "Root TypeScript config" "cd /opt/IT-Enterprise && npx tsc --noEmit"

# Check packages
for pkg in packages/*/; do
    if [ -f "$pkg/tsconfig.json" ]; then
        pkg_name=$(basename "$pkg")
        test_command "Package: $pkg_name" "cd $pkg && npx tsc --noEmit"
    fi
done

# Check services
for svc in services/*/; do
    if [ -f "$svc/tsconfig.json" ]; then
        svc_name=$(basename "$svc")
        test_command "Service: $svc_name" "cd $svc && npx tsc --noEmit"
    fi
done

# Check apps (sample)
for app in apps/web-cz apps/web-solutions; do
    if [ -f "$app/tsconfig.json" ]; then
        app_name=$(basename "$app")
        test_command "App: $app_name" "cd $app && npx tsc --noEmit"
    fi
done

echo ""
echo "📝 Checking file structure..."

# Check critical files
test_command "Docker Compose" "[ -f docker-compose.yml ]"
test_command "Root package.json" "[ -f package.json ]"
test_command "Turbo config" "[ -f turbo.json ]"
test_command "Database schema" "[ -f packages/database/prisma/schema.prisma ]"

# Check services
test_command "API service" "[ -f services/api/src/index.ts ]"
test_command "Domain Manager" "[ -f services/domain-manager/src/index.ts ]"
test_command "Email Service" "[ -f services/email-service/src/index.ts ]"

# Check packages
test_command "Database package" "[ -f packages/database/index.ts ]"
test_command "API Client package" "[ -f packages/api-client/index.ts ]"
test_command "UI package" "[ -f packages/ui/index.ts ]"

echo ""
echo "🐳 Checking Docker setup..."

# Check Dockerfiles
test_command "API Dockerfile" "[ -f services/api/Dockerfile ]"
test_command "Domain Manager Dockerfile" "[ -f services/domain-manager/Dockerfile ]"
test_command "Email Service Dockerfile" "[ -f services/email-service/Dockerfile ]"

# Check docker-compose services count
SERVICE_COUNT=$(grep -c "^  [a-z-]*:" docker-compose.yml || echo "0")
if [ "$SERVICE_COUNT" -ge 15 ]; then
    echo -e "Docker services count: ${GREEN}✓${NC} ($SERVICE_COUNT services)"
    ((PASSED++))
else
    echo -e "Docker services count: ${RED}✗${NC} (Expected >= 15, got $SERVICE_COUNT)"
    ((FAILED++))
fi

echo ""
echo "📚 Checking documentation..."

test_command "README.md" "[ -f README.md ]"
test_command "DEPLOYMENT.md" "[ -f DEPLOYMENT.md ]"
test_command "API_DOCUMENTATION.md" "[ -f API_DOCUMENTATION.md ]"

echo ""
echo "📊 Test Results:"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi

