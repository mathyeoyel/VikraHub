# Generated migration for enhanced notifications

from django.db import migrations, models
import django.db.models.deletion
import django.contrib.contenttypes.models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0023_alter_blogpost_slug'),
        ('contenttypes', '0002_remove_content_type_name'),
    ]

    operations = [
        # First, add new fields with defaults
        migrations.AddField(
            model_name='notification',
            name='actor',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='notifications_sent',
                to='auth.user'
            ),
        ),
        migrations.AddField(
            model_name='notification',
            name='verb',
            field=models.CharField(default='notification', max_length=50, db_index=True),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='notification',
            name='target_content_type',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to='contenttypes.contenttype'
            ),
        ),
        migrations.AddField(
            model_name='notification',
            name='target_object_id',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='notification',
            name='payload',
            field=models.JSONField(blank=True, default=dict),
        ),
        
        # Make message field optional (blank=True)
        migrations.AlterField(
            model_name='notification',
            name='message',
            field=models.CharField(blank=True, max_length=200),
        ),
        
        # Add indexes for better performance
        migrations.AlterField(
            model_name='notification',
            name='is_read',
            field=models.BooleanField(default=False, db_index=True),
        ),
        migrations.AlterField(
            model_name='notification',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, db_index=True),
        ),
        
        # Create Device model
        migrations.CreateModel(
            name='Device',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('token', models.TextField(unique=True)),
                ('platform', models.CharField(
                    choices=[('web', 'Web'), ('ios', 'iOS'), ('android', 'Android')],
                    max_length=10
                )),
                ('auth_key', models.CharField(blank=True, max_length=255)),
                ('p256dh_key', models.CharField(blank=True, max_length=255)),
                ('endpoint', models.TextField(blank=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('last_used', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='devices',
                    to='auth.user'
                )),
            ],
            options={
                'indexes': [
                    models.Index(fields=['user', 'is_active'], name='core_device_user_id_active_idx'),
                    models.Index(fields=['platform', 'is_active'], name='core_device_platform_active_idx'),
                ],
            },
        ),
        
        # Add unique constraint to Device
        migrations.AddConstraint(
            model_name='device',
            constraint=models.UniqueConstraint(
                fields=['user', 'token'],
                name='core_device_user_token_unique'
            ),
        ),
        
        # Update Notification model meta options
        migrations.AlterModelOptions(
            name='notification',
            options={
                'ordering': ['-created_at'],
            },
        ),
        
        # Add indexes to Notification
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['user', '-created_at'], name='core_notification_user_created_idx'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['user', 'is_read'], name='core_notification_user_read_idx'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['verb', '-created_at'], name='core_notification_verb_created_idx'),
        ),
    ]
