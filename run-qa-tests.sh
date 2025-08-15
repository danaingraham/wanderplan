#!/bin/bash

# Wanderplan QA Test Runner
# Run this before every deployment!

echo "🧪 Wanderplan QA Test Suite"
echo "=========================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: TypeScript build check
echo "1️⃣  Checking TypeScript build..."
if npm run test:build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ TypeScript build successful${NC}"
else
    echo -e "${RED}❌ TypeScript build failed!${NC}"
    echo "Fix TypeScript errors before proceeding."
    exit 1
fi

# Step 2: Check for console.logs in production code
echo ""
echo "2️⃣  Checking for debug code..."
DEBUG_COUNT=$(grep -r "console.log" src/ --include="*.tsx" --include="*.ts" | grep -v "// console.log" | wc -l | tr -d ' ')
if [ "$DEBUG_COUNT" -gt "20" ]; then
    echo -e "${YELLOW}⚠️  Warning: $DEBUG_COUNT console.log statements found${NC}"
    echo "Consider removing debug statements before production."
else
    echo -e "${GREEN}✅ Acceptable number of console.logs ($DEBUG_COUNT)${NC}"
fi

# Step 3: Check environment files
echo ""
echo "3️⃣  Checking environment configuration..."
if [ -f ".env" ]; then
    if grep -q "VITE_SUPABASE_URL" .env && grep -q "VITE_SUPABASE_ANON_KEY" .env; then
        echo -e "${GREEN}✅ Environment variables configured${NC}"
    else
        echo -e "${RED}❌ Missing Supabase environment variables${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  No .env file found (OK for production)${NC}"
fi

# Step 4: Build the project
echo ""
echo "4️⃣  Building project..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build successful${NC}"
    
    # Check bundle size
    BUNDLE_SIZE=$(find dist/assets -name "*.js" -type f -exec du -k {} \; | sort -rn | head -1 | awk '{print $1}')
    if [ "$BUNDLE_SIZE" -gt "1000" ]; then
        echo -e "${YELLOW}⚠️  Warning: Large bundle size (${BUNDLE_SIZE}KB)${NC}"
    else
        echo -e "${GREEN}✅ Bundle size OK (${BUNDLE_SIZE}KB)${NC}"
    fi
else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

# Step 5: Open QA test suite
echo ""
echo "5️⃣  Opening QA Test Suite..."
echo -e "${YELLOW}Please run the tests in your browser and verify all critical tests pass.${NC}"

# Try to open the test suite in default browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    open qa-test-suite.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open qa-test-suite.html
else
    echo "Please open qa-test-suite.html manually in your browser"
fi

echo ""
echo "=========================="
echo -e "${YELLOW}📋 IMPORTANT: Complete the PRE_DEPLOYMENT_CHECKLIST.md before deploying!${NC}"
echo ""
echo "Summary:"
echo "- TypeScript: ✅"
echo "- Build: ✅"
echo "- Bundle Size: Check above"
echo "- Browser Tests: Run manually"
echo "- Mobile Tests: Test on actual device"
echo ""
echo -e "${GREEN}If all tests pass, you're ready to deploy!${NC}"