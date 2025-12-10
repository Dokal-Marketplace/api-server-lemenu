#!/bin/bash

# Master Test Runner
# Executes all API test suites

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
NC='\033[0m'

clear

echo -e "${MAGENTA}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║                                                                   ║${NC}"
echo -e "${MAGENTA}║           CartaAI API - COMPREHENSIVE TEST SUITE                  ║${NC}"
echo -e "${MAGENTA}║                                                                   ║${NC}"
echo -e "${MAGENTA}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if API is running
echo -e "${BLUE}Checking API availability...${NC}"
if curl -s http://localhost:3001/api/v1/health >/dev/null 2>&1; then
    echo -e "${GREEN}✓ API is running on port 3001${NC}\n"
else
    echo -e "${RED}✗ API is not running on port 3001${NC}"
    echo -e "${YELLOW}Please start the API server first with: npm run dev${NC}\n"
    exit 1
fi

# Test 1: Menu Routes
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}TEST SUITE 1: MENU ROUTES${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}\n"

if [ -f "./test-menu-simple.sh" ]; then
    bash ./test-menu-simple.sh
    MENU_EXIT_CODE=$?
else
    echo -e "${RED}✗ test-menu-simple.sh not found${NC}"
    MENU_EXIT_CODE=1
fi

echo -e "\n${YELLOW}Press Enter to continue to next test suite...${NC}"
read -r

# Test 2: Product Management & Orders
echo -e "\n${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}TEST SUITE 2: PRODUCT MANAGEMENT & ORDER PROCESSING${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}\n"

if [ -f "./test-products.sh" ]; then
    bash ./test-products.sh
    PRODUCT_EXIT_CODE=$?
else
    echo -e "${RED}✗ test-products.sh not found${NC}"
    PRODUCT_EXIT_CODE=1
fi

echo -e "\n${YELLOW}Press Enter to continue to next test suite...${NC}"
read -r

# Test 3: API Key Authentication
echo -e "\n${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}TEST SUITE 3: API KEY AUTHENTICATION${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}\n"

if [ -f "./test-api-keys.sh" ]; then
    bash ./test-api-keys.sh
    API_KEY_EXIT_CODE=$?
else
    echo -e "${RED}✗ test-api-keys.sh not found${NC}"
    API_KEY_EXIT_CODE=1
fi

echo -e "\n${YELLOW}Press Enter to continue to next test suite...${NC}"
read -r

# Test 4: Service API Key Authentication (Microservices)
echo -e "\n${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}TEST SUITE 4: SERVICE API KEY AUTHENTICATION (MICROSERVICES)${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}\n"

if [ -f "./test-service-api-keys.sh" ]; then
    bash ./test-service-api-keys.sh
    SERVICE_KEY_EXIT_CODE=$?
else
    echo -e "${RED}✗ test-service-api-keys.sh not found${NC}"
    SERVICE_KEY_EXIT_CODE=1
fi

# Final Summary
echo -e "\n${MAGENTA}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║                      FINAL TEST SUMMARY                           ║${NC}"
echo -e "${MAGENTA}╚═══════════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${BLUE}Test Suites Executed:${NC}"
echo -e "  1. Menu Routes Test Suite"
echo -e "  2. Product Management & Order Processing"
echo -e "  3. API Key Authentication"
echo -e "  4. Service API Key Authentication (Microservices)"
echo ""

if [ $MENU_EXIT_CODE -eq 0 ] && [ $PRODUCT_EXIT_CODE -eq 0 ] && [ $API_KEY_EXIT_CODE -eq 0 ] && [ $SERVICE_KEY_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    ALL TESTS COMPLETED                            ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}✓ All test suites executed successfully${NC}"
else
    echo -e "${YELLOW}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║              TESTS COMPLETED WITH WARNINGS                        ║${NC}"
    echo -e "${YELLOW}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}⚠ Some tests returned warnings or failures${NC}"
fi

echo ""
echo -e "${BLUE}For detailed results, see: ${YELLOW}docs/TEST_RESULTS.md${NC}"
echo ""
echo -e "${CYAN}Individual test scripts available:${NC}"
echo -e "  • ${YELLOW}./test-menu-simple.sh${NC}        - Menu routes only"
echo -e "  • ${YELLOW}./test-products.sh${NC}           - Products & orders only"
echo -e "  • ${YELLOW}./test-api-keys.sh${NC}           - User API key authentication"
echo -e "  • ${YELLOW}./test-service-api-keys.sh${NC}   - Service-to-service authentication"
echo ""
