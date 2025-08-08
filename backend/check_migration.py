#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

from django.db import connection
from django.core.management import execute_from_command_line

try:
    # Check if table exists
    cursor = connection.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='core_emailverification';")
    table_exists = bool(cursor.fetchall())
    print(f"EmailVerification table exists: {table_exists}")
    
    # Try to run migrations
    if not table_exists:
        print("Running migrations...")
        execute_from_command_line(['manage.py', 'migrate'])
        print("Migrations completed!")
    else:
        print("Table already exists, checking migration status...")
        execute_from_command_line(['manage.py', 'showmigrations', 'core'])
        
except Exception as e:
    print(f"Error: {e}")
