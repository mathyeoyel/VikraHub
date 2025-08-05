# backend/messaging/models.py
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid

class UserStatus(models.Model):
    """
    Track user online status and last activity
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='status'
    )
    is_online = models.BooleanField(default=False)
    last_active = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'messaging_user_status'
    
    def __str__(self):
        status = "online" if self.is_online else "offline"
        return f"{self.user.username} - {status}"

class Conversation(models.Model):
    """
    Represents a conversation between two users
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participants = models.ManyToManyField(
        User, 
        related_name='conversations',
        through='ConversationParticipant'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Soft delete fields
    is_deleted = models.BooleanField(default=False)
    deleted_by = models.ManyToManyField(
        User, 
        related_name='deleted_conversations',
        blank=True
    )
    
    class Meta:
        db_table = 'messaging_conversations'
        ordering = ['-updated_at']
    
    def __str__(self):
        participants = list(self.participants.all())
        if len(participants) >= 2:
            return f"Conversation between {participants[0].username} and {participants[1].username}"
        return f"Conversation {self.id}"
    
    def get_other_participant(self, user):
        """Get the other participant in a 1-to-1 conversation"""
        return self.participants.exclude(id=user.id).first()
    
    def is_participant(self, user):
        """Check if user is a participant in this conversation"""
        return self.participants.filter(id=user.id).exists()
    
    def get_unread_count(self, user):
        """Get unread message count for a specific user"""
        # Fixed: Use proper read receipt checking instead of comparing integer with timestamp
        unread_messages = self.messages.filter(
            is_deleted=False
        ).exclude(sender=user).exclude(read_by=user)
        
        return unread_messages.count()
    
    def get_latest_message(self):
        """Get the most recent message in the conversation"""
        return self.messages.filter(is_deleted=False).first()


class ConversationParticipant(models.Model):
    """
    Through model for conversation participants with additional metadata
    """
    conversation = models.ForeignKey(
        Conversation, 
        on_delete=models.CASCADE,
        related_name='participant_records'
    )
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='conversation_participations'
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    last_read_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'messaging_conversation_participants'
        unique_together = ['conversation', 'user']
    
    def __str__(self):
        return f"{self.user.username} in {self.conversation.id}"


class Message(models.Model):
    """
    Represents a message within a conversation
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='received_messages',
        null=True,
        blank=True
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Reply functionality
    reply_to = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        related_name='replies',
        null=True,
        blank=True
    )
    
    # Message status
    is_edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)
    
    # Soft delete
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ManyToManyField(
        User,
        related_name='deleted_messages',
        blank=True
    )
    
    # Read receipts
    read_by = models.ManyToManyField(
        User,
        through='MessageRead',
        related_name='read_messages',
        blank=True
    )
    
    # Delivery receipts
    delivered_to = models.ManyToManyField(
        User,
        through='MessageDelivered',
        related_name='delivered_messages',
        blank=True
    )
    
    class Meta:
        db_table = 'messaging_messages'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Message from {self.sender.username}: {self.content[:50]}..."
    
    def mark_as_read(self, user):
        """Mark message as read by a specific user"""
        if user != self.sender:  # Don't mark own messages as read
            MessageRead.objects.get_or_create(
                message=self,
                user=user,
                defaults={'read_at': timezone.now()}
            )
    
    def mark_as_delivered(self, user):
        """Mark message as delivered to a specific user"""
        if user != self.sender:  # Don't mark own messages as delivered
            MessageDelivered.objects.get_or_create(
                message=self,
                user=user,
                defaults={'delivered_at': timezone.now()}
            )
    
    def is_read_by(self, user):
        """Check if message has been read by a specific user"""
        return self.read_by.filter(id=user.id).exists()
    
    def is_delivered_to(self, user):
        """Check if message has been delivered to a specific user"""
        return self.delivered_to.filter(id=user.id).exists()


class MessageDelivered(models.Model):
    """
    Through model for message delivery receipts
    """
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='delivery_receipts'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='message_deliveries'
    )
    delivered_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'messaging_message_delivered'
        unique_together = ['message', 'user']
    
    def __str__(self):
        return f"{self.user.username} received message {self.message.id}"


class MessageRead(models.Model):
    """
    Through model for message read receipts
    """
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='read_receipts'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='message_reads'
    )
    read_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'messaging_message_reads'
        unique_together = ['message', 'user']
    
    def __str__(self):
        return f"{self.user.username} read message {self.message.id}"


class TypingStatus(models.Model):
    """
    Temporary model to track typing status
    """
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='typing_statuses'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='typing_in'
    )
    started_typing_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'messaging_typing_status'
        unique_together = ['conversation', 'user']
    
    def __str__(self):
        return f"{self.user.username} typing in {self.conversation.id}"


class MessageReaction(models.Model):
    """
    Model for message reactions (like, love, laugh, etc.)
    """
    REACTION_CHOICES = [
        ('like', '👍'),
        ('love', '❤️'),
        ('laugh', '😂'),
        ('wow', '😮'),
        ('sad', '😢'),
        ('angry', '😡'),
    ]
    
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='reactions'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='message_reactions'
    )
    reaction = models.CharField(max_length=10, choices=REACTION_CHOICES)
    reacted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'messaging_message_reactions'
        unique_together = ['message', 'user', 'reaction']
    
    def __str__(self):
        return f"{self.user.username} reacted {self.reaction} to message {self.message.id}"
