# backend/messaging/urls.py
from django.urls import path
from . import views

app_name = 'messaging'

urlpatterns = [
    # 🚀 Enhanced conversation endpoints with proper error handling
    path('conversations/', views.ConversationListAPIView.as_view(), name='conversation-list-api'),
    path('conversations/create/', views.ConversationListCreateView.as_view(), name='conversation-list-create'),
    path('conversations/<uuid:pk>/', views.ConversationDetailView.as_view(), name='conversation-detail'),
    path('conversations/<uuid:conversation_id>/messages/', views.MessageListCreateView.as_view(), name='message-list-create'),
    path('conversations/<uuid:conversation_id>/mark-read/', views.mark_conversation_as_read, name='mark-conversation-read'),
    path('conversations/<uuid:conversation_id>/typing/start/', views.start_typing, name='start-typing'),
    path('conversations/<uuid:conversation_id>/typing/stop/', views.stop_typing, name='stop-typing'),
    
    # Message endpoints
    path('messages/<uuid:pk>/', views.MessageDetailView.as_view(), name='message-detail'),
    path('messages/', views.get_messages_between_users, name='messages-list'), # GET /api/messages/?user_id=X
    path('messages/user/<int:user_id>/unread/', views.get_unread_messages_count, name='unread-messages-count'),
    
    # Utility endpoints
    path('unread-count/', views.get_unread_count, name='unread-count'),
]
