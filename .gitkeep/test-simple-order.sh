#!/bin/bash

BASE_URL="http://localhost:3001/api/v1"
EMAIL="tcbsgpm91wpw-az@ptltrybrmvpmok.hz"
PASSWORD="Etalon12345@"

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

SUBDOMAIN="my-restaurant"
LOCALID="LOC1760097779968WGX4I"

# Very simple order
ORDER_JSON='{
  "customer": {
    "name": "Test Customer",
    "phone": "+51987654321"
  },
  "items": [
    {
      "productId": "PROD17601042157470SR6K",
      "name": "Test Product",
      "quantity": 1,
      "unitPrice": 10.50
    }
  ],
  "type": "pickup",
  "paymentMethod": "cash"
}'

echo "Testing simple order creation..."
curl -v -X POST "$BASE_URL/order?subDomain=$SUBDOMAIN&localId=$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$ORDER_JSON" 2>&1 | tail -50
