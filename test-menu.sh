#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3001/api/v1"
EMAIL="tcbsgpm91wpw-az@ptltrybrmvpmok.hz"
PASSWORD="Etalon12345@"

TOKEN=""
SUBDOMAIN=""
LOCALID=""

# Helper functions
log_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

log_error() {
    echo -e "${RED}✗ $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

log_section() {
    echo -e "\n${CYAN}============================================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}============================================================${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Test 1: Login
test_login() {
    log_section "TEST 1: Authentication - Login"

    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        log_success "Login successful (HTTP $HTTP_CODE)"
        TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')
        USER_ID=$(echo "$BODY" | grep -o '"_id":"[^"]*' | sed 's/"_id":"//' | head -1)

        if [ -n "$TOKEN" ]; then
            log_info "Token: ${TOKEN:0:20}..."
            log_info "User ID: $USER_ID"

            # Get user business info to extract subDomain and localId
            log_info "Fetching business information..."
            BIZ_RESPONSE=$(curl -s "$BASE_URL/user-business/get-by-user-id/$USER_ID" \
                -H "Authorization: Bearer $TOKEN")

            SUBDOMAIN=$(echo "$BIZ_RESPONSE" | grep -o '"subDomain":"[^"]*' | sed 's/"subDomain":"//' | head -1)
            # Try to get first location if available
            LOCALID=$(echo "$BIZ_RESPONSE" | grep -o '"locationId":"[^"]*' | sed 's/"locationId":"//' | head -1)

            log_info "SubDomain: $SUBDOMAIN"
            log_info "LocalId: $LOCALID"
        else
            log_warning "Token not found in response"
            echo "$BODY" | head -c 200
        fi
    else
        log_error "Login failed (HTTP $HTTP_CODE)"
        echo "$BODY" | head -c 200
        return 1
    fi
}

# Test 2: Get Menu Integration V2
test_menu_integration() {
    log_section "TEST 2: Get Menu Integration V2"

    if [ -z "$SUBDOMAIN" ]; then
        log_error "SubDomain not available. Skipping test."
        return 1
    fi

    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/menu2/v2/integration/$SUBDOMAIN" \
        -H "Authorization: Bearer $TOKEN")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        log_success "Menu integration retrieved (HTTP $HTTP_CODE)"
        log_info "Response preview:"
        echo "$BODY" | head -c 300
        echo "..."
    else
        log_error "Failed to get menu integration (HTTP $HTTP_CODE)"
        echo "$BODY" | head -c 200
    fi
}

# Test 3: Get Menu Integration for Specific Location
test_menu_integration_by_location() {
    log_section "TEST 3: Get Menu Integration for Specific Location"

    if [ -z "$SUBDOMAIN" ] || [ -z "$LOCALID" ]; then
        log_error "SubDomain or LocalId not available. Skipping test."
        return 1
    fi

    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/menu2/integration/$SUBDOMAIN/$LOCALID" \
        -H "Authorization: Bearer $TOKEN")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        log_success "Location menu integration retrieved (HTTP $HTTP_CODE)"
        log_info "Response preview:"
        echo "$BODY" | head -c 300
        echo "..."
    else
        log_error "Failed to get location menu integration (HTTP $HTTP_CODE)"
        echo "$BODY" | head -c 200
    fi
}

# Test 4: Get Bot Menu Structure
test_bot_structure() {
    log_section "TEST 4: Get Bot Menu Structure"

    if [ -z "$SUBDOMAIN" ]; then
        log_error "SubDomain not available. Skipping test."
        return 1
    fi

    ENDPOINT="$BASE_URL/menu2/bot-structure?subDomain=$SUBDOMAIN"
    if [ -n "$LOCALID" ]; then
        ENDPOINT="$ENDPOINT&localId=$LOCALID"
    fi

    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$ENDPOINT" \
        -H "Authorization: Bearer $TOKEN")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        log_success "Bot structure retrieved (HTTP $HTTP_CODE)"
        log_info "Response preview:"
        echo "$BODY" | head -c 300
        echo "..."
    else
        log_error "Failed to get bot structure (HTTP $HTTP_CODE)"
        echo "$BODY" | head -c 200
    fi
}

# Test 5: Get Menu Images
test_menu_images() {
    log_section "TEST 5: Get Menu Images"

    if [ -z "$SUBDOMAIN" ] || [ -z "$LOCALID" ]; then
        log_error "SubDomain or LocalId not available. Skipping test."
        return 1
    fi

    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/menu-pic?subDomain=$SUBDOMAIN&localId=$LOCALID" \
        -H "Authorization: Bearer $TOKEN")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        log_success "Menu images retrieved (HTTP $HTTP_CODE)"
        log_info "Response preview:"
        echo "$BODY" | head -c 300
        echo "..."
    else
        log_error "Failed to get menu images (HTTP $HTTP_CODE)"
        echo "$BODY" | head -c 200
    fi
}

# Test 6: Get Available Roles (Staff Controller Test)
test_available_roles() {
    log_section "TEST 6: Get Available Roles"

    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/staff/roles/available" \
        -H "Authorization: Bearer $TOKEN")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        log_success "Available roles retrieved (HTTP $HTTP_CODE)"
        log_info "Response preview:"
        echo "$BODY" | head -c 300
        echo "..."
    else
        log_error "Failed to get available roles (HTTP $HTTP_CODE)"
        echo "$BODY" | head -c 200
    fi
}

# Main execution
main() {
    echo -e "\n${CYAN}████████████████████████████████████████████████████████████${NC}"
    echo -e "${CYAN}  MENU ROUTES API TESTING SUITE${NC}"
    echo -e "${CYAN}████████████████████████████████████████████████████████████${NC}\n"

    # Run tests
    test_login
    if [ $? -ne 0 ]; then
        log_error "Authentication failed. Cannot proceed with other tests."
        exit 1
    fi

    sleep 1
    test_menu_integration
    sleep 1
    test_menu_integration_by_location
    sleep 1
    test_bot_structure
    sleep 1
    test_menu_images
    sleep 1
    test_available_roles

    # Summary
    log_section "TEST SUITE COMPLETED"
    log_success "All menu route tests executed"
    log_info "Check the results above for any failures"
}

# Run main
main
