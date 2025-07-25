#!/bin/bash
# VikraHub Production Testing Script

echo "🚀 Starting VikraHub Production Testing..."

# Check if backend is running
echo "🔍 Checking backend status..."
if curl -s http://127.0.0.1:8000/api/ > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running. Please start Django server first."
    echo "   Run: cd backend && python manage.py runserver"
    exit 1
fi

# Check authentication
echo "🔐 Testing authentication..."
TOKEN_RESPONSE=$(curl -s -X POST http://127.0.0.1:8000/api/auth/token/ \
    -H "Content-Type: application/json" \
    -d '{"username":"alice_dev","password":"testpass123"}')

if echo "$TOKEN_RESPONSE" | grep -q "access"; then
    echo "✅ Authentication working"
    ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access":"[^"]*"' | cut -d'"' -f4)
else
    echo "❌ Authentication failed"
    exit 1
fi

# Test follow API
echo "👥 Testing follow system..."
FOLLOW_RESPONSE=$(curl -s -X POST http://127.0.0.1:8000/api/follow/follow/ \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"user_id":42}')

if echo "$FOLLOW_RESPONSE" | grep -q "success\|following"; then
    echo "✅ Follow system working"
else
    echo "⚠️ Follow test returned: $FOLLOW_RESPONSE"
fi

# Test messaging API
echo "💬 Testing messaging system..."
CONV_RESPONSE=$(curl -s -X GET http://127.0.0.1:8000/api/messaging/conversations/ \
    -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$CONV_RESPONSE" | grep -q "participants\|id"; then
    echo "✅ Messaging system working"
else
    echo "⚠️ Messaging test returned: $CONV_RESPONSE"
fi

# Test frontend build
echo "🏗️ Testing frontend build..."
cd frontend
if npm run build > /dev/null 2>&1; then
    echo "✅ Frontend builds successfully"
    echo "📦 Build created in: frontend/build/"
else
    echo "❌ Frontend build failed"
    echo "   Run: cd frontend && npm run build"
fi

echo ""
echo "🎉 VikraHub Testing Complete!"
echo ""
echo "🧪 Manual Testing Steps:"
echo "1. Open http://localhost:3000 (or your React app URL)"
echo "2. Login with: alice_dev / testpass123"
echo "3. Navigate to Dashboard → Social Tab"
echo "4. Test follow functionality"
echo "5. Try messaging features"
echo "6. Verify real-time notifications"
echo ""
echo "📊 Test Users Available:"
echo "- alice_dev / testpass123"
echo "- bob_designer / testpass123"  
echo "- charlie_writer / testpass123"
echo "- diana_marketer / testpass123"
