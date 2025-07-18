#!/usr/bin/env bash
# Test script to verify backend is working

echo "Testing backend deployment..."

# Test if Django can start
echo "Testing Django startup..."
python manage.py check

# Test if database is accessible
echo "Testing database connection..."
python manage.py migrate --check

# Test if we can collect static files
echo "Testing static files collection..."
python manage.py collectstatic --dry-run --noinput

echo "All tests completed!"
