#!/bin/bash

# Week 2 Backend API Test Script
# Team A25-CS060
# Tests Customer CRUD and Prediction endpoints

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000/api/v1"
TOKEN=""

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}   Week 2 Backend API Testing           ${NC}"
echo -e "${YELLOW}========================================${NC}\n"

# Login to get token
echo -e "${BLUE}Step 1: Login to get authentication token${NC}"
response=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }')

TOKEN=$(echo $response | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed! Please check if admin user exists${NC}"
  echo "$response" | python3 -m json.tool
  exit 1
fi

echo -e "${GREEN}✅ Login successful${NC}"
echo -e "Token: ${TOKEN:0:20}...\n"

# Test 2: Health Check (with ML service status)
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Test 2: Health Check (includes ML status)${NC}"
response=$(curl -s -X GET "$BASE_URL/health" \
  -H "Authorization: Bearer $TOKEN")

if echo "$response" | grep -q '"status":"OK"'; then
  echo -e "${GREEN}✅ Health check passed${NC}"
  echo "$response" | python3 -m json.tool
else
  echo -e "${RED}❌ Health check failed${NC}"
  echo "$response"
fi
echo ""

# Test 3: Create Customer
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Test 3: Create New Customer${NC}"
response=$(curl -s -X POST "$BASE_URL/customers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "age": 35,
    "job": "management",
    "marital": "married",
    "education": "tertiary",
    "has_default": false,
    "has_housing_loan": true,
    "has_personal_loan": false,
    "contact": "cellular",
    "month": "may",
    "day_of_week": "mon",
    "campaign": 1,
    "pdays": 999,
    "previous": 0,
    "poutcome": "unknown"
  }')

CUSTOMER_ID=$(echo $response | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$CUSTOMER_ID" ]; then
  echo -e "${GREEN}✅ Customer created successfully (ID: $CUSTOMER_ID)${NC}"
  echo "$response" | python3 -m json.tool
else
  echo -e "${RED}❌ Customer creation failed${NC}"
  echo "$response"
fi
echo ""

# Test 4: Get All Customers
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Test 4: Get All Customers (paginated)${NC}"
response=$(curl -s -X GET "$BASE_URL/customers?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN")

if echo "$response" | grep -q '"customers"'; then
  echo -e "${GREEN}✅ Retrieved customers successfully${NC}"
  echo "$response" | python3 -m json.tool | head -40
  echo "..."
else
  echo -e "${RED}❌ Failed to retrieve customers${NC}"
  echo "$response"
fi
echo ""

# Test 5: Get Customer by ID
if [ -n "$CUSTOMER_ID" ]; then
  echo -e "${YELLOW}========================================${NC}"
  echo -e "${YELLOW}Test 5: Get Customer by ID${NC}"
  response=$(curl -s -X GET "$BASE_URL/customers/$CUSTOMER_ID" \
    -H "Authorization: Bearer $TOKEN")

  if echo "$response" | grep -q '"id"'; then
    echo -e "${GREEN}✅ Retrieved customer successfully${NC}"
    echo "$response" | python3 -m json.tool
  else
    echo -e "${RED}❌ Failed to retrieve customer${NC}"
    echo "$response"
  fi
  echo ""
fi

# Test 6: Update Customer
if [ -n "$CUSTOMER_ID" ]; then
  echo -e "${YELLOW}========================================${NC}"
  echo -e "${YELLOW}Test 6: Update Customer${NC}"
  response=$(curl -s -X PUT "$BASE_URL/customers/$CUSTOMER_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "age": 36,
      "campaign": 2
    }')

  if echo "$response" | grep -q '"age":36'; then
    echo -e "${GREEN}✅ Customer updated successfully${NC}"
    echo "$response" | python3 -m json.tool
  else
    echo -e "${RED}❌ Customer update failed${NC}"
    echo "$response"
  fi
  echo ""
fi

# Test 7: Predict Single Customer
if [ -n "$CUSTOMER_ID" ]; then
  echo -e "${YELLOW}========================================${NC}"
  echo -e "${YELLOW}Test 7: Predict Single Customer${NC}"
  echo -e "${BLUE}⚠️  This requires ML service to be running!${NC}"
  
  response=$(curl -s -X POST "$BASE_URL/predictions/customer/$CUSTOMER_ID" \
    -H "Authorization: Bearer $TOKEN")

  if echo "$response" | grep -q '"probability"'; then
    echo -e "${GREEN}✅ Prediction successful${NC}"
    echo "$response" | python3 -m json.tool
  else
    echo -e "${RED}❌ Prediction failed (ML service might be down)${NC}"
    echo "$response" | python3 -m json.tool
  fi
  echo ""
fi

# Test 8: Get Top Leads
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Test 8: Get Top Leads${NC}"
response=$(curl -s -X GET "$BASE_URL/predictions/top-leads?limit=10&threshold=0.5" \
  -H "Authorization: Bearer $TOKEN")

if echo "$response" | grep -q '"leads"'; then
  echo -e "${GREEN}✅ Retrieved top leads successfully${NC}"
  echo "$response" | python3 -m json.tool | head -30
  echo "..."
else
  echo -e "${RED}❌ Failed to retrieve top leads${NC}"
  echo "$response"
fi
echo ""

# Test 9: Get Customer Statistics
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Test 9: Get Customer Statistics${NC}"
response=$(curl -s -X GET "$BASE_URL/customers/stats" \
  -H "Authorization: Bearer $TOKEN")

if echo "$response" | grep -q '"total_customers"'; then
  echo -e "${GREEN}✅ Retrieved customer statistics${NC}"
  echo "$response" | python3 -m json.tool
else
  echo -e "${RED}❌ Failed to retrieve statistics${NC}"
  echo "$response"
fi
echo ""

# Test 10: Get Prediction Statistics
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Test 10: Get Prediction Statistics${NC}"
response=$(curl -s -X GET "$BASE_URL/predictions/stats" \
  -H "Authorization: Bearer $TOKEN")

if echo "$response" | grep -q '"totalPredictions"'; then
  echo -e "${GREEN}✅ Retrieved prediction statistics${NC}"
  echo "$response" | python3 -m json.tool
else
  echo -e "${RED}❌ Failed to retrieve prediction statistics${NC}"
  echo "$response"
fi
echo ""

# Test 11: Batch Prediction
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Test 11: Batch Prediction (customers without predictions)${NC}"
echo -e "${BLUE}⚠️  This requires ML service to be running!${NC}"

response=$(curl -s -X POST "$BASE_URL/predictions/batch" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "limit": 5
  }')

if echo "$response" | grep -q '"summary"'; then
  echo -e "${GREEN}✅ Batch prediction completed${NC}"
  echo "$response" | python3 -m json.tool
else
  echo -e "${RED}❌ Batch prediction failed (ML service might be down)${NC}"
  echo "$response" | python3 -m json.tool
fi
echo ""

# Test 12: Get Prediction History
if [ -n "$CUSTOMER_ID" ]; then
  echo -e "${YELLOW}========================================${NC}"
  echo -e "${YELLOW}Test 12: Get Customer Prediction History${NC}"
  response=$(curl -s -X GET "$BASE_URL/predictions/customer/$CUSTOMER_ID/history" \
    -H "Authorization: Bearer $TOKEN")

  if echo "$response" | grep -q '"history"'; then
    echo -e "${GREEN}✅ Retrieved prediction history${NC}"
    echo "$response" | python3 -m json.tool
  else
    echo -e "${RED}❌ Failed to retrieve prediction history${NC}"
    echo "$response"
  fi
  echo ""
fi

# Test 13: Search Customers
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Test 13: Search Customers${NC}"
response=$(curl -s -X GET "$BASE_URL/customers?search=management&page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN")

if echo "$response" | grep -q '"customers"'; then
  echo -e "${GREEN}✅ Search completed successfully${NC}"
  echo "$response" | python3 -m json.tool | head -30
  echo "..."
else
  echo -e "${RED}❌ Search failed${NC}"
  echo "$response"
fi
echo ""

# Cleanup - Delete Test Customer
if [ -n "$CUSTOMER_ID" ]; then
  echo -e "${YELLOW}========================================${NC}"
  echo -e "${YELLOW}Cleanup: Delete Test Customer${NC}"
  response=$(curl -s -X DELETE "$BASE_URL/customers/$CUSTOMER_ID" \
    -H "Authorization: Bearer $TOKEN")

  if echo "$response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Test customer deleted successfully${NC}"
  else
    echo -e "${RED}❌ Failed to delete test customer${NC}"
  fi
  echo ""
fi

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}   Testing Complete!                   ${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "${GREEN}Week 2 Backend API features tested.${NC}"
echo -e "${BLUE}Note: Some tests may fail if ML service is not running.${NC}"
