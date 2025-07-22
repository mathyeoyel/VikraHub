#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Starting minimal build process..."

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Test basic Django functionality
echo "Testing Django check..."
python manage.py check

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --no-input

# Run migrations
echo "Running database migrations..."
python manage.py migrate

# Create sample data
echo "Creating sample data..."
python manage.py create_sample_data

# Create production superuser
echo "Creating production superuser..."
python manage.py create_production_superuser

echo "Build completed successfully!"
