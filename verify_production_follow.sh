#!/usr/bin/env bash
# Production Follow System Verification Script
# Run this to verify the follow functionality is working on the live site

echo "🚀 VikraHub Follow System - Production Verification"
echo "=================================================="
echo ""

# Check backend API URL from the console logs
echo "📡 Testing Current API Connection..."
CURRENT_API_URL="https://vikrahub.onrender.com/api/"
response=$(curl -s -o /dev/null -w "%{http_code}" "${CURRENT_API_URL}users/")

if [ "$response" = "200" ] || [ "$response" = "401" ]; then
    echo "✅ Current API is accessible (Status: $response)"
    echo "   URL: $CURRENT_API_URL"
else
    echo "❌ Current API not accessible (Status: $response)"
    echo "   URL: $CURRENT_API_URL"
fi

echo ""

# Test the target backend URL
echo "📡 Testing Target Backend API..."
TARGET_BACKEND_URL="https://api.vikrahub.com/api/"
target_response=$(curl -s -o /dev/null -w "%{http_code}" "${TARGET_BACKEND_URL}users/")

if [ "$target_response" = "200" ] || [ "$target_response" = "401" ]; then
    echo "✅ Target Backend API is accessible (Status: $target_response)"
    echo "   URL: $TARGET_BACKEND_URL"
else
    echo "❌ Target Backend API not accessible (Status: $target_response)"
    echo "   URL: $TARGET_BACKEND_URL"
fi

echo ""

# Check deployment status
echo "🔍 Deployment Status Check:"
echo "Current build still showing: main.248fdd87.js"
echo "This indicates the new deployment hasn't completed yet."
echo ""
echo "📊 Expected after successful deployment:"
echo "✅ New build file name (not main.248fdd87.js)"
echo "✅ API calls to https://api.vikrahub.com/"
echo "✅ No more 'getMyFollowStats is not a function' errors"
echo ""

echo "⏰ Wait time estimate:"
echo "- Typical deployment: 5-15 minutes"
echo "- Check deployment dashboard for status"
echo "- Clear browser cache after deployment completes"

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
