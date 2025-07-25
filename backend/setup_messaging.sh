#!/bin/bash
# backend/setup_messaging.sh - Setup script for messaging system

echo "🚀 Setting up VikraHub Messaging System..."

# Install Python packages
echo "📦 Installing Python packages..."
pip install -r requirements.txt

# Create and run migrations
echo "🔄 Creating messaging app migrations..."
python manage.py makemigrations messaging

echo "🔄 Running all migrations..."
python manage.py migrate

# Create superuser if needed (interactive)
echo "👤 Create superuser for admin access (optional):"
python manage.py createsuperuser --skip-checks

echo "✅ Messaging system setup complete!"
echo ""
echo "🔗 Available endpoints:"
echo "   • API: http://localhost:8000/api/messaging/"
echo "   • WebSocket: ws://localhost:8000/ws/messaging/"
echo "   • Admin: http://localhost:8000/admin/"
echo ""
echo "📚 Next steps:"
echo "   1. Start the Django server: python manage.py runserver"
echo "   2. Test the messaging API endpoints"
echo "   3. Implement React frontend integration"
