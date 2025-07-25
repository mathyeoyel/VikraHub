# backend/messaging/admin.py
from django.contrib import admin
from .models import Conversation, Message, ConversationParticipant, MessageRead, TypingStatus

# TODO: Fix admin configurations - temporarily disabled
# @admin.register(Conversation)
# class ConversationAdmin(admin.ModelAdmin):
#     pass

# @admin.register(Message)  
# class MessageAdmin(admin.ModelAdmin):
#     pass

# @admin.register(ConversationParticipant)
# class ConversationParticipantAdmin(admin.ModelAdmin):
#     pass

# @admin.register(MessageRead)
# class MessageReadAdmin(admin.ModelAdmin):
#     pass

# @admin.register(TypingStatus)
# class TypingStatusAdmin(admin.ModelAdmin):
#     pass
