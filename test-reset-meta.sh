#!/bin/bash

# Test script for reset-meta-credentials endpoint
# Usage: ./test-reset-meta.sh <subdomain> <jwt_token>

SUBDOMAIN=${1:-"test-business"}
TOKEN=${2:-"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGU3ZjEwNWVjM2I0YmNhZGRmOTcyZjciLCJpYXQiOjE3NjQ4Nzg1MjMsImV4cCI6MTc2NTQ4MzMyM30.AH3dO8IPGYd_T3wce9o0CVmWrVeDnuMiJzbFct8mOOM"}
BASE_URL="http://localhost:3000"

echo "========================================="
echo "Testing Reset Meta Credentials Endpoint"
echo "========================================="
echo ""
echo "Subdomain: $SUBDOMAIN"
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Reset all credentials (default)
echo "Test 1: Reset all Meta credentials (tokens, phone numbers, catalogs)"
echo "POST $BASE_URL/api/v1/business/$SUBDOMAIN/reset-meta-credentials"
curl -X POST "$BASE_URL/api/v1/business/$SUBDOMAIN/reset-meta-credentials" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.'
echo ""
echo "---"
echo ""

# Test 2: Reset only tokens
echo "Test 2: Reset only WhatsApp tokens"
echo "POST $BASE_URL/api/v1/business/$SUBDOMAIN/reset-meta-credentials"
curl -X POST "$BASE_URL/api/v1/business/$SUBDOMAIN/reset-meta-credentials" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "resetTokens": true,
    "resetPhoneNumbers": false,
    "resetCatalogs": false,
    "resetTemplates": false
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.'
echo ""
echo "---"
echo ""

# Test 3: Reset everything including templates
echo "Test 3: Reset everything including templates"
echo "POST $BASE_URL/api/v1/business/$SUBDOMAIN/reset-meta-credentials"
curl -X POST "$BASE_URL/api/v1/business/$SUBDOMAIN/reset-meta-credentials" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "resetTokens": true,
    "resetPhoneNumbers": true,
    "resetCatalogs": true,
    "resetTemplates": true
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.'
echo ""
echo "---"
echo ""

# Test 4: Test with invalid subdomain
echo "Test 4: Test with non-existent subdomain"
echo "POST $BASE_URL/api/v1/business/non-existent-subdomain/reset-meta-credentials"
curl -X POST "$BASE_URL/api/v1/business/non-existent-subdomain/reset-meta-credentials" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.'
echo ""
echo "---"
echo ""

echo "========================================="
echo "Tests Complete"
echo "========================================="
