# Generated manually for adding username index
from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0029_make_portfolio_user_required'),
    ]

    operations = [
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_auth_user_username_lower ON auth_user (LOWER(username));",
            reverse_sql="DROP INDEX IF EXISTS idx_auth_user_username_lower;"
        ),
    ]
