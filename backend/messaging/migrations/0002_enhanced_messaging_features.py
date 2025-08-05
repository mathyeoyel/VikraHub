# Generated migration for enhanced messaging features

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('messaging', '0001_initial'),
    ]

    operations = [
        # Add UserStatus model
        migrations.CreateModel(
            name='UserStatus',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_online', models.BooleanField(default=False)),
                ('last_active', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='status', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'messaging_user_status',
            },
        ),
        
        # Add reply_to field to Message
        migrations.AddField(
            model_name='message',
            name='reply_to',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='replies', to='messaging.message'),
        ),
        
        # Add MessageDelivered model
        migrations.CreateModel(
            name='MessageDelivered',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('delivered_at', models.DateTimeField(auto_now_add=True)),
                ('message', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='delivery_receipts', to='messaging.message')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='message_deliveries', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'messaging_message_delivered',
            },
        ),
        
        # Add MessageReaction model
        migrations.CreateModel(
            name='MessageReaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reaction', models.CharField(choices=[('like', '👍'), ('love', '❤️'), ('laugh', '😂'), ('wow', '😮'), ('sad', '😢'), ('angry', '😡')], max_length=10)),
                ('reacted_at', models.DateTimeField(auto_now_add=True)),
                ('message', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reactions', to='messaging.message')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='message_reactions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'messaging_message_reactions',
            },
        ),
        
        # Add delivered_to ManyToManyField to Message
        migrations.AddField(
            model_name='message',
            name='delivered_to',
            field=models.ManyToManyField(blank=True, related_name='delivered_messages', through='messaging.MessageDelivered', to=settings.AUTH_USER_MODEL),
        ),
        
        # Add unique constraints
        migrations.AlterUniqueTogether(
            name='messagedelivered',
            unique_together={('message', 'user')},
        ),
        migrations.AlterUniqueTogether(
            name='messagereaction',
            unique_together={('message', 'user', 'reaction')},
        ),
    ]
