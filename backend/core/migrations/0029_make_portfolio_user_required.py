# Generated migration to make portfolio user field required

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0028_backfill_portfolio_user'),
    ]

    operations = [
        migrations.AlterField(
            model_name='portfolioitem',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='works', to='auth.user'),
        ),
    ]
