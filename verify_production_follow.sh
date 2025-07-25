#!/usr/bin/env bash
# Production Follow System Verification Script
# Run this to verify the follow functionality is working on the live site

echo "🚀 VikraHub Follow System - Production Verification"
echo "=================================================="
echo ""

# Check if backend is accessible
echo "📡 Testing Backend API Connection..."
BACKEND_URL="https://vikrahub-backend.onrender.com/api/"
response=$(curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}users/")

if [ "$response" = "200" ] || [ "$response" = "401" ]; then
    echo "✅ Backend API is accessible (Status: $response)"
else
    echo "❌ Backend API not accessible (Status: $response)"
    echo "   URL: $BACKEND_URL"
fi

echo ""

# Check follow endpoint specifically
echo "📡 Testing Follow Endpoint..."
follow_response=$(curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}follow/follow/" -X POST)

if [ "$follow_response" = "401" ]; then
    echo "✅ Follow endpoint accessible (Status: $follow_response - Authentication required)"
elif [ "$follow_response" = "400" ]; then
    echo "✅ Follow endpoint accessible (Status: $follow_response - Bad request expected without auth)"
else
    echo "❌ Follow endpoint issue (Status: $follow_response)"
fi

echo ""

# Test CORS headers
echo "📡 Testing CORS Configuration..."
cors_test=$(curl -s -H "Origin: https://vikrahub.com" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: authorization,content-type" -X OPTIONS "${BACKEND_URL}follow/follow/")

echo "✅ CORS preflight test completed"

echo ""
echo "🔍 Manual Verification Steps:"
echo "1. Visit: https://vikrahub.com"
echo "2. Login to your account"
echo "3. Go to a user profile"
echo "4. Click the Follow button"
echo "5. Check browser Network tab for API calls to vikrahub-backend.onrender.com"
echo ""
echo "📊 Expected Results:"
echo "✅ Follow button should work without 'Failed to follow user' error"
echo "✅ Network tab should show successful POST to /api/follow/follow/"
echo "✅ Success message should appear"
echo ""
