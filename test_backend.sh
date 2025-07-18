#!/usr/bin/env bash
# Test script to verify backend structure before deployment

echo "🔍 Testing Django Backend Structure..."

cd backend

echo "📁 Checking required files..."
if [ -f "manage.py" ]; then
    echo "✅ manage.py found"
else
    echo "❌ manage.py missing"
    exit 1
fi

if [ -f "requirements.txt" ]; then
    echo "✅ requirements.txt found"
else
    echo "❌ requirements.txt missing"
    exit 1
fi

if [ -f "vikrahub/settings.py" ]; then
    echo "✅ settings.py found"
else
    echo "❌ settings.py missing"
    exit 1
fi

echo "🐍 Testing Django commands..."
python manage.py check --deploy
if [ $? -eq 0 ]; then
    echo "✅ Django deployment check passed"
else
    echo "❌ Django deployment check failed"
    exit 1
fi

echo "📦 Testing collectstatic..."
python manage.py collectstatic --dry-run --no-input
if [ $? -eq 0 ]; then
    echo "✅ Static files collection test passed"
else
    echo "❌ Static files collection test failed"
    exit 1
fi

echo "🎉 Backend structure verification completed successfully!"
echo ""
echo "🚀 Your backend is ready for Render deployment!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub"
echo "2. Update your existing Render service build/start commands"
echo "3. Create a new static site for the React frontend"
