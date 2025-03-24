#!/bin/bash

# Test script for CE Project Management API
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
echo -e "${BLUE}CE Project Management API Test Script${NC}"
echo -e "${BLUE}=========================================${NC}"

# Step 1: Authenticate user and get token
echo -e "\n${BLUE}Step 1: Authenticating user ${EMAIL}...${NC}"
AUTH_RESPONSE=$(curl -s -X POST "${API_BASE}/v1/authentication/sign-in" \
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

# Step 2: Create a new test project
echo -e "\n${BLUE}Step 2: Creating a test project...${NC}"
PROJECT_DATA='{
  "displayName": "CE Test Project",
  "externalId": "ce-test-project-1"
}'

CREATE_RESPONSE=$(api_call "POST" "/v1/ce/platform/projects" "$PROJECT_DATA")

# Check for errors in project creation
if echo "$CREATE_RESPONSE" | grep -q "error"; then
  echo -e "${RED}Project creation failed:${NC}"
  echo "$CREATE_RESPONSE" | jq .
  exit 1
fi

# Extract project ID from created project
PROJECT_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id')
echo -e "${GREEN}Project created successfully with ID: ${PROJECT_ID}${NC}"
echo "$CREATE_RESPONSE" | jq .

# Step 3: List all projects
echo -e "\n${BLUE}Step 3: Listing all projects...${NC}"
LIST_RESPONSE=$(api_call "GET" "/v1/ce/platform/projects" "")

# Check for errors in project listing
if echo "$LIST_RESPONSE" | grep -q "error"; then
  echo -e "${RED}Project listing failed:${NC}"
  echo "$LIST_RESPONSE" | jq .
else
  echo -e "${GREEN}Project listing successful!${NC}"
  echo "$LIST_RESPONSE" | jq .
fi

# Step 4: Get the created project by ID
echo -e "\n${BLUE}Step 4: Getting project by ID: ${PROJECT_ID}...${NC}"
GET_RESPONSE=$(api_call "GET" "/v1/ce/platform/projects/${PROJECT_ID}" "")

# Check for errors in getting project
if echo "$GET_RESPONSE" | grep -q "error"; then
  echo -e "${RED}Getting project by ID failed:${NC}"
  echo "$GET_RESPONSE" | jq .
else
  echo -e "${GREEN}Got project details successfully!${NC}"
  echo "$GET_RESPONSE" | jq .
fi

# Step 5: Update the project
echo -e "\n${BLUE}Step 5: Updating project...${NC}"
UPDATE_DATA='{
  "displayName": "CE Test Project Updated",
  "notifyStatus": "NEVER"
}'

UPDATE_RESPONSE=$(api_call "PATCH" "/v1/ce/platform/projects/${PROJECT_ID}" "$UPDATE_DATA")

# Check for errors in updating project
if echo "$UPDATE_RESPONSE" | grep -q "error"; then
  echo -e "${RED}Project update failed:${NC}"
  echo "$UPDATE_RESPONSE" | jq .
else
  echo -e "${GREEN}Project updated successfully!${NC}"
  echo "$UPDATE_RESPONSE" | jq .
fi

# Step 6: Delete the project
echo -e "\n${BLUE}Step 6: Deleting project...${NC}"
DELETE_RESPONSE=$(api_call "DELETE" "/v1/ce/platform/projects/${PROJECT_ID}" "")

# Check for errors in deleting project
if echo "$DELETE_RESPONSE" | grep -q "error"; then
  echo -e "${RED}Project deletion failed:${NC}"
  echo "$DELETE_RESPONSE" | jq .
else
  echo -e "${GREEN}Project deleted successfully!${NC}"
  echo "$DELETE_RESPONSE" | jq .
fi

# Step 7: Confirm deletion by trying to get the deleted project
echo -e "\n${BLUE}Step 7: Confirming deletion by getting deleted project...${NC}"
CONFIRM_DELETE=$(api_call "GET" "/v1/ce/platform/projects/${PROJECT_ID}" "")

if echo "$CONFIRM_DELETE" | grep -q "ENTITY_NOT_FOUND"; then
  echo -e "${GREEN}Deletion confirmed! Project no longer exists.${NC}"
else
  echo -e "${RED}Warning: Project might not be properly deleted!${NC}"
  echo "$CONFIRM_DELETE" | jq .
fi

echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}CE Project Management API Test Complete${NC}"
echo -e "${BLUE}=========================================${NC}"
