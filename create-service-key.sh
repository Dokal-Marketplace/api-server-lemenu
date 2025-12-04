#!/bin/bash

# Service API Key Generator
# Interactive script to create service API keys for microservices

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
NC='\033[0m'

BASE_URL="http://localhost:3001/api/v1"
JWT_TOKEN=""

# Function to display header
show_header() {
    clear
    echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║         SERVICE API KEY GENERATOR                          ║${NC}"
    echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════╝${NC}\n"
}

# Function to authenticate
authenticate() {
    echo -e "${BLUE}Please enter your admin credentials:${NC}\n"

    read -p "Email: " EMAIL
    read -s -p "Password: " PASSWORD
    echo ""

    echo -e "\n${CYAN}Authenticating...${NC}"

    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

    JWT_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

    if [ -z "$JWT_TOKEN" ]; then
        echo -e "${RED}✗ Authentication failed${NC}"
        echo "$LOGIN_RESPONSE" | head -c 200
        exit 1
    fi

    echo -e "${GREEN}✓ Authentication successful${NC}\n"
}

# Function to select service type
select_service_type() {
    echo -e "${BLUE}Select service type:${NC}\n"
    echo "  1) Internal Service (carta_srv_) - Your own microservices"
    echo "  2) External Service (carta_ext_) - Third-party providers"
    echo "  3) Partner Service (carta_prt_) - Trusted business partners"
    echo ""
    read -p "Enter choice [1-3]: " TYPE_CHOICE

    case $TYPE_CHOICE in
        1) SERVICE_TYPE="internal" ;;
        2) SERVICE_TYPE="external" ;;
        3) SERVICE_TYPE="partner" ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            exit 1
            ;;
    esac
}

# Function to select environment
select_environment() {
    echo -e "\n${BLUE}Select environment:${NC}\n"
    echo "  1) Development"
    echo "  2) Staging"
    echo "  3) Production"
    echo ""
    read -p "Enter choice [1-3]: " ENV_CHOICE

    case $ENV_CHOICE in
        1) ENVIRONMENT="development" ;;
        2) ENVIRONMENT="staging" ;;
        3) ENVIRONMENT="production" ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            exit 1
            ;;
    esac
}

# Function to select scopes
select_scopes() {
    echo -e "\n${BLUE}Available scopes:${NC}\n"
    echo "  1) * (Full access - use with caution!)"
    echo "  2) service:orders"
    echo "  3) service:products"
    echo "  4) service:menu"
    echo "  5) service:analytics"
    echo "  6) service:payments"
    echo "  7) service:notifications"
    echo "  8) service:webhooks"
    echo "  9) admin:read"
    echo "  10) admin:write"
    echo "  11) internal:cache"
    echo "  12) internal:queue"
    echo "  13) internal:events"
    echo ""
    echo -e "${YELLOW}Enter scope numbers separated by spaces (e.g., '2 3 7'):${NC}"
    read -p "Scopes: " SCOPE_CHOICES

    SCOPES="["
    FIRST=true
    for choice in $SCOPE_CHOICES; do
        if [ "$FIRST" = false ]; then
            SCOPES="${SCOPES},"
        fi
        FIRST=false

        case $choice in
            1) SCOPES="${SCOPES}\"*\"" ;;
            2) SCOPES="${SCOPES}\"service:orders\"" ;;
            3) SCOPES="${SCOPES}\"service:products\"" ;;
            4) SCOPES="${SCOPES}\"service:menu\"" ;;
            5) SCOPES="${SCOPES}\"service:analytics\"" ;;
            6) SCOPES="${SCOPES}\"service:payments\"" ;;
            7) SCOPES="${SCOPES}\"service:notifications\"" ;;
            8) SCOPES="${SCOPES}\"service:webhooks\"" ;;
            9) SCOPES="${SCOPES}\"admin:read\"" ;;
            10) SCOPES="${SCOPES}\"admin:write\"" ;;
            11) SCOPES="${SCOPES}\"internal:cache\"" ;;
            12) SCOPES="${SCOPES}\"internal:queue\"" ;;
            13) SCOPES="${SCOPES}\"internal:events\"" ;;
            *)
                echo -e "${YELLOW}⚠ Ignoring invalid scope: $choice${NC}"
                ;;
        esac
    done
    SCOPES="${SCOPES}]"
}

# Function to get basic info
get_basic_info() {
    echo -e "\n${BLUE}Service Details:${NC}\n"

    read -p "Service name (e.g., order-processor): " SERVICE_NAME
    read -p "Display name (e.g., Order Processor Service): " DISPLAY_NAME
    read -p "Expiration in days (default: 365): " EXPIRY_DAYS
    EXPIRY_DAYS=${EXPIRY_DAYS:-365}
}

# Function to get optional settings
get_optional_settings() {
    echo -e "\n${BLUE}Optional Settings (press Enter to skip):${NC}\n"

    read -p "Allowed endpoints (comma-separated, e.g., /api/v1/orders/*,/api/v1/products/*): " ENDPOINTS
    read -p "Allowed services (comma-separated, e.g., product-service,notification-service): " ALLOWED_SERVICES
    read -p "IP whitelist (comma-separated, CIDR notation supported): " IP_WHITELIST
    read -p "Max requests per hour (default: 10000): " MAX_REQUESTS
    MAX_REQUESTS=${MAX_REQUESTS:-10000}
}

# Function to create the service key
create_service_key() {
    echo -e "\n${CYAN}Creating service API key...${NC}\n"

    # Build JSON payload
    JSON_PAYLOAD=$(cat <<EOF
{
    "name": "$DISPLAY_NAME",
    "serviceName": "$SERVICE_NAME",
    "serviceType": "$SERVICE_TYPE",
    "environment": "$ENVIRONMENT",
    "scopes": $SCOPES,
    "expiresIn": $EXPIRY_DAYS,
    "rateLimit": {
        "maxRequests": $MAX_REQUESTS,
        "windowMs": 3600000
    }
EOF
)

    # Add optional fields
    if [ -n "$ENDPOINTS" ]; then
        ENDPOINT_ARRAY="["
        FIRST=true
        IFS=',' read -ra ENDPOINT_LIST <<< "$ENDPOINTS"
        for endpoint in "${ENDPOINT_LIST[@]}"; do
            if [ "$FIRST" = false ]; then
                ENDPOINT_ARRAY="${ENDPOINT_ARRAY},"
            fi
            FIRST=false
            ENDPOINT_ARRAY="${ENDPOINT_ARRAY}\"$(echo $endpoint | xargs)\""
        done
        ENDPOINT_ARRAY="${ENDPOINT_ARRAY}]"
        JSON_PAYLOAD="${JSON_PAYLOAD},\"allowedEndpoints\": $ENDPOINT_ARRAY"
    fi

    if [ -n "$ALLOWED_SERVICES" ]; then
        SERVICE_ARRAY="["
        FIRST=true
        IFS=',' read -ra SERVICE_LIST <<< "$ALLOWED_SERVICES"
        for service in "${SERVICE_LIST[@]}"; do
            if [ "$FIRST" = false ]; then
                SERVICE_ARRAY="${SERVICE_ARRAY},"
            fi
            FIRST=false
            SERVICE_ARRAY="${SERVICE_ARRAY}\"$(echo $service | xargs)\""
        done
        SERVICE_ARRAY="${SERVICE_ARRAY}]"
        JSON_PAYLOAD="${JSON_PAYLOAD},\"allowedServices\": $SERVICE_ARRAY"
    fi

    if [ -n "$IP_WHITELIST" ]; then
        IP_ARRAY="["
        FIRST=true
        IFS=',' read -ra IP_LIST <<< "$IP_WHITELIST"
        for ip in "${IP_LIST[@]}"; do
            if [ "$FIRST" = false ]; then
                IP_ARRAY="${IP_ARRAY},"
            fi
            FIRST=false
            IP_ARRAY="${IP_ARRAY}\"$(echo $ip | xargs)\""
        done
        IP_ARRAY="${IP_ARRAY}]"
        JSON_PAYLOAD="${JSON_PAYLOAD},\"ipWhitelist\": $IP_ARRAY"
    fi

    JSON_PAYLOAD="${JSON_PAYLOAD}}"

    # Show the payload for confirmation
    echo -e "${CYAN}Configuration:${NC}"
    echo "$JSON_PAYLOAD" | python3 -m json.tool 2>/dev/null || echo "$JSON_PAYLOAD"
    echo ""

    read -p "Create this service key? (y/n): " CONFIRM
    if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
        echo -e "${YELLOW}Cancelled${NC}"
        exit 0
    fi

    # Make the API call
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/service-api-keys" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$JSON_PAYLOAD")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║         SERVICE API KEY CREATED SUCCESSFULLY               ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}\n"

        SERVICE_KEY=$(echo "$BODY" | grep -o '"key":"[^"]*' | sed 's/"key":"//')
        KEY_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | sed 's/"id":"//' | head -1)

        echo -e "${YELLOW}⚠ IMPORTANT: Save this key securely - it will NOT be shown again!${NC}\n"
        echo -e "${MAGENTA}═══════════════════════════════════════════════════════════${NC}"
        echo -e "${CYAN}Service API Key:${NC}"
        echo -e "${GREEN}$SERVICE_KEY${NC}"
        echo -e "${MAGENTA}═══════════════════════════════════════════════════════════${NC}\n"

        echo -e "${CYAN}Key ID:${NC} $KEY_ID"
        echo -e "${CYAN}Service Name:${NC} $SERVICE_NAME"
        echo -e "${CYAN}Service Type:${NC} $SERVICE_TYPE"
        echo -e "${CYAN}Environment:${NC} $ENVIRONMENT"
        echo -e "${CYAN}Expires In:${NC} $EXPIRY_DAYS days"
        echo ""

        # Save to file option
        read -p "Save key to file? (y/n): " SAVE_FILE
        if [ "$SAVE_FILE" = "y" ] || [ "$SAVE_FILE" = "Y" ]; then
            FILENAME="${SERVICE_NAME}-${ENVIRONMENT}-key.txt"
            cat > "$FILENAME" <<EOL
Service API Key Configuration
==============================

Service Name: $SERVICE_NAME
Display Name: $DISPLAY_NAME
Service Type: $SERVICE_TYPE
Environment: $ENVIRONMENT
Key ID: $KEY_ID
Created: $(date)

API Key:
$SERVICE_KEY

Usage:
curl -H "X-Service-API-Key: $SERVICE_KEY" http://localhost:3001/api/v1/...

Documentation:
See docs/MICROSERVICES_API_KEYS.md for full usage guide.
EOL
            echo -e "${GREEN}✓ Key saved to: ${CYAN}$FILENAME${NC}"
            echo -e "${YELLOW}⚠ Keep this file secure and do not commit to version control!${NC}"
        fi

        echo -e "\n${BLUE}Quick usage:${NC}"
        echo -e "${CYAN}curl -H \"X-Service-API-Key: $SERVICE_KEY\" \\${NC}"
        echo -e "${CYAN}     http://localhost:3001/api/v1/...${NC}"

    else
        echo -e "\n${RED}✗ Failed to create service key (HTTP $HTTP_CODE)${NC}\n"
        echo "$BODY"
    fi
}

# Main execution
show_header

# Check if API is running
echo -e "${BLUE}Checking API availability...${NC}"
if ! curl -s http://localhost:3001/api/v1/health >/dev/null 2>&1; then
    echo -e "${RED}✗ API is not running on port 3001${NC}"
    echo -e "${YELLOW}Please start the API server first with: npm run dev${NC}"
    exit 1
fi
echo -e "${GREEN}✓ API is running${NC}\n"

# Run the workflow
authenticate
select_service_type
select_environment
get_basic_info
select_scopes
get_optional_settings
create_service_key

echo ""
