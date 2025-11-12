#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000/api/v1"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}   Lead Scoring API Testing Script     ${NC}"
echo -e "${YELLOW}========================================${NC}\n"

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
response=$(curl -s -X GET "$BASE_URL/health")
if echo "$response" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ Health check passed${NC}\n"
else
  echo -e "${RED}❌ Health check failed${NC}\n"
fi

# Test 2: Register with valid email
echo -e "${YELLOW}Test 2: Register with valid email${NC}"
response=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123",
    "role": "sales"
  }')
if echo "$response" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ Registration successful${NC}"
  echo "$response" | jq '.'
else
  echo -e "${RED}❌ Registration failed${NC}"
  echo "$response" | jq '.'
fi
echo ""

# Test 3: Login with email
echo -e "${YELLOW}Test 3: Login with email${NC}"
response=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123"
  }')
if echo "$response" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ Login successful${NC}"
  TOKEN=$(echo "$response" | jq -r '.data.token')
  echo "Token: ${TOKEN:0:50}..."
else
  echo -e "${RED}❌ Login failed${NC}"
  echo "$response" | jq '.'
fi
echo ""

# Test 4: Get profile with token
echo -e "${YELLOW}Test 4: Get profile (protected route)${NC}"
if [ ! -z "$TOKEN" ]; then
  response=$(curl -s -X GET "$BASE_URL/auth/me" \
    -H "Authorization: Bearer $TOKEN")
  if echo "$response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Get profile successful${NC}"
    echo "$response" | jq '.'
  else
    echo -e "${RED}❌ Get profile failed${NC}"
    echo "$response" | jq '.'
  fi
else
  echo -e "${RED}❌ No token available${NC}"
fi
echo ""

# Test 5: Invalid email format
echo -e "${YELLOW}Test 5: Register with invalid email (should fail)${NC}"
response=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "password123"
  }')
if echo "$response" | grep -q '"success":false'; then
  echo -e "${GREEN}✅ Validation working - invalid email rejected${NC}"
  echo "$response" | jq '.'
else
  echo -e "${RED}❌ Validation failed - invalid email accepted${NC}"
  echo "$response" | jq '.'
fi
echo ""

# Test 6: Login with seeded user
echo -e "${YELLOW}Test 6: Login with seeded user${NC}"
response=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sales1@leadscoring.com",
    "password": "password123"
  }')
if echo "$response" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ Seeded user login successful${NC}"
  echo "$response" | jq '.'
else
  echo -e "${RED}❌ Seeded user login failed${NC}"
  echo "$response" | jq '.'
fi
echo ""

# Test 7: Invalid token
echo -e "${YELLOW}Test 7: Access protected route with invalid token (should fail)${NC}"
response=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer invalid_token_here")
if echo "$response" | grep -q '"success":false'; then
  echo -e "${GREEN}✅ Auth working - invalid token rejected${NC}"
  echo "$response" | jq '.'
else
  echo -e "${RED}❌ Auth failed - invalid token accepted${NC}"
  echo "$response" | jq '.'
fi
echo ""

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}   Testing Complete!                   ${NC}"
echo -e "${YELLOW}========================================${NC}"
