#!/bin/bash

# Test script for CE Pieces Management API
# Prerequisites:
# - API running at localhost:3000
# - jq installed (brew install jq)

API_BASE="http://localhost:3000"
EMAIL="dev@ap.com"
PASSWORD="12345678"

# Colors for better visibility
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}CE Pieces Management API Test Script${NC}"
echo -e "${BLUE}=========================================${NC}"

# Step 1: Authenticate user and get token
echo -e "\n${BLUE}Step 1: Authenticating user ${EMAIL}...${NC}"
AUTH_RESPONSE=$(curl -s -X POST "${API_BASE}/api/v1/authentication/sign-in" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

# Check for errors in authentication
if echo "$AUTH_RESPONSE" | grep -q "error"; then
  echo -e "${RED}Authentication failed:${NC}"
  echo "$AUTH_RESPONSE" | jq .
  exit 1
fi

# Extract token
TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.token')
echo -e "${GREEN}Authentication successful! Token acquired.${NC}"

# Function to make API calls with authorization
api_call() {
  METHOD=$1
  ENDPOINT=$2
  DATA=$3
  
  if [ -z "$DATA" ]; then
    curl -s -X "$METHOD" "${API_BASE}${ENDPOINT}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json"
  else
    curl -s -X "$METHOD" "${API_BASE}${ENDPOINT}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$DATA"
  fi
}

# Step 2: Get current piece visibility configuration
echo -e "\n${BLUE}Step 2: Getting current piece visibility configuration...${NC}"
GET_CONFIG_RESPONSE=$(api_call "GET" "/api/v1/ce/platform/pieces" "")

# Check for errors in getting configuration
if echo "$GET_CONFIG_RESPONSE" | grep -q "error"; then
  echo -e "${RED}Getting piece configuration failed:${NC}"
  echo "$GET_CONFIG_RESPONSE" | jq .
else
  echo -e "${GREEN}Got piece configuration successfully:${NC}"
  echo "$GET_CONFIG_RESPONSE" | jq .
fi

# Step 3: Update filtered pieces with BLOCKED behavior
echo -e "\n${BLUE}Step 3: Setting pieces to use BLOCKED behavior...${NC}"
UPDATE_DATA='{
  "filteredPieceNames": ["@activepieces/piece-google-sheets", "@activepieces/piece-slack"],
  "filteredPieceBehavior": "BLOCKED"
}'

UPDATE_RESPONSE=$(api_call "PATCH" "/api/v1/ce/platform/pieces" "$UPDATE_DATA")

# Check for errors in update
if echo "$UPDATE_RESPONSE" | grep -q "error"; then
  echo -e "${RED}Updating piece configuration failed:${NC}"
  echo "$UPDATE_RESPONSE" | jq .
else
  echo -e "${GREEN}Updated piece configuration successfully:${NC}"
  echo "$UPDATE_RESPONSE" | jq .
fi

# Step 4: Get updated configuration
echo -e "\n${BLUE}Step 4: Getting updated piece configuration...${NC}"
UPDATED_CONFIG_RESPONSE=$(api_call "GET" "/api/v1/ce/platform/pieces" "")

# Check for errors
if echo "$UPDATED_CONFIG_RESPONSE" | grep -q "error"; then
  echo -e "${RED}Getting updated piece configuration failed:${NC}"
  echo "$UPDATED_CONFIG_RESPONSE" | jq .
else
  echo -e "${GREEN}Got updated piece configuration successfully:${NC}"
  echo "$UPDATED_CONFIG_RESPONSE" | jq .
fi

# Step 5: Toggle a single piece visibility (hide Google Sheets)
echo -e "\n${BLUE}Step 5: Toggling Google Sheets visibility to false...${NC}"
TOGGLE_DATA='{
  "visible": false
}'

TOGGLE_RESPONSE=$(api_call "PATCH" "/api/v1/ce/platform/pieces/@activepieces%2Fpiece-google-sheets" "$TOGGLE_DATA")

# Check for errors
if echo "$TOGGLE_RESPONSE" | grep -q "error"; then
  echo -e "${RED}Toggling piece visibility failed:${NC}"
  echo "$TOGGLE_RESPONSE" | jq .
else
  echo -e "${GREEN}Toggled piece visibility successfully:${NC}"
  echo "$TOGGLE_RESPONSE" | jq .
fi

# Step 6: Get final configuration
echo -e "\n${BLUE}Step 6: Getting final piece configuration...${NC}"
FINAL_CONFIG_RESPONSE=$(api_call "GET" "/api/v1/ce/platform/pieces" "")

# Check for errors
if echo "$FINAL_CONFIG_RESPONSE" | grep -q "error"; then
  echo -e "${RED}Getting final piece configuration failed:${NC}"
  echo "$FINAL_CONFIG_RESPONSE" | jq .
else
  echo -e "${GREEN}Got final piece configuration successfully:${NC}"
  echo "$FINAL_CONFIG_RESPONSE" | jq .
fi

echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}CE Pieces Management API Test Complete${NC}"
echo -e "${BLUE}=========================================${NC}"
