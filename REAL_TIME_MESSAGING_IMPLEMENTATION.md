# 🚀 VikraHub Real-time Messaging System

## Overview

This implementation provides a production-ready real-time messaging system for VikraHub using Django Channels and React WebSockets. The system supports instant messaging between users with JWT authentication, message persistence, and real-time notifications.

## 🏗️ Architecture

### Backend Components

#### 1. **Enhanced Message Model** (`backend/messaging/models.py`)
```python
class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages', null=True, blank=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    # ... other fields
```

#### 2. **ChatConsumer** (`backend/messaging/chat_consumer.py`)
- **Purpose**: Handles direct messaging with format `{type: "message", recipient_id: X, text: "..."}`
- **Authentication**: JWT token via query parameter `?token=<jwt>`
- **WebSocket URL**: `wss://api.vikrahub.com/ws/chat/`
- **Features**:
  - Real-time message delivery
  - User channel groups (`chat_{user_id}`)
  - Message persistence to database
  - Connection status management

#### 3. **Enhanced API Endpoints**
```python
# New REST API endpoints
GET /api/messaging/messages/?user_id=X          # Get messages between users
GET /api/messaging/messages/user/X/unread/      # Get unread count with specific user
```

#### 4. **WebSocket Routing** (`backend/messaging/routing.py`)
```python
websocket_urlpatterns = [
    re_path(r'ws/messaging/$', consumers.MessagingConsumer.as_asgi()),  # Existing
    re_path(r'ws/chat/$', ChatConsumer.as_asgi()),                     # New direct chat
]
```

### Frontend Components

#### 1. **ChatModal** (`frontend/src/components/Chat/ChatModal.js`)
- **Purpose**: Full-featured chat interface with real-time messaging
- **Features**:
  - WebSocket connection management
  - Message history loading
  - Real-time message updates
  - Optimistic UI updates
  - Connection status indicator
  - Auto-scroll to latest messages

#### 2. **ChatButton** (`frontend/src/components/Chat/ChatButton.js`)
- **Purpose**: Reusable button component to start chats
- **Variants**: Primary, secondary, outline, success, dark
- **Sizes**: Small, normal, large

#### 3. **Enhanced API Functions** (`frontend/src/api.js`)
```javascript
export const messagingAPI = {
  // ... existing functions
  getMessagesWithUser: (user_id) => api.get(`messaging/messages/?user_id=${user_id}`),
  getUnreadMessagesCount: (user_id) => api.get(`messaging/messages/user/${user_id}/unread/`),
};
```

## 🔧 Usage Examples

### 1. **Basic Chat Button Integration**
```jsx
import ChatButton from './components/Chat/ChatButton';

function UserProfile({ user }) {
  return (
    <div>
      <h2>{user.name}</h2>
      <ChatButton 
        user={user} 
        buttonText="Send Message" 
        variant="primary"
      />
    </div>
  );
}
```

### 2. **Custom Chat Implementation**
```jsx
import React, { useState } from 'react';
import ChatModal from './components/Chat/ChatModal';

function CustomChat() {
  const [showChat, setShowChat] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const startChat = (user) => {
    setSelectedUser(user);
    setShowChat(true);
  };

  return (
    <>
      <button onClick={() => startChat(someUser)}>
        Start Chat
      </button>
      
      <ChatModal
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        recipientUser={selectedUser}
      />
    </>
  );
}
```

### 3. **WebSocket Message Format**
```javascript
// Send message via WebSocket
const messageData = {
  type: 'message',
  recipient_id: 123,
  text: 'Hello! How are you?'
};

socket.send(JSON.stringify(messageData));

// Receive message
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'new_message') {
    // Handle incoming message
    console.log('New message:', data.message);
  }
};
```

## 🌐 API Documentation

### WebSocket Endpoints

#### 1. **Direct Chat Consumer** (`/ws/chat/`)
- **Authentication**: JWT token in query parameter
- **Message Format**: `{type: "message", recipient_id: X, text: "..."}`
- **Events**:
  - `connection_established`: Connection confirmed
  - `new_message`: Incoming message from another user
  - `message_sent`: Confirmation of sent message
  - `error`: Error messages

#### 2. **Messaging Consumer** (`/ws/messaging/`)
- **Purpose**: Conversation-based messaging (existing system)
- **Features**: Typing indicators, conversation management

### REST API Endpoints

#### **Messages**
```http
GET /api/messaging/messages/?user_id=123
# Get all messages between current user and user 123

GET /api/messaging/messages/user/123/unread/
# Get unread message count with user 123

GET /api/messaging/unread-count/
# Get total unread messages count
```

#### **Conversations (Existing)**
```http
GET /api/messaging/conversations/
POST /api/messaging/conversations/
GET /api/messaging/conversations/{id}/
GET /api/messaging/conversations/{id}/messages/
POST /api/messaging/conversations/{id}/messages/
```

## 🔐 Authentication & Security

### JWT Authentication
- **WebSocket**: Token passed as query parameter `?token=<jwt>`
- **REST API**: Bearer token in Authorization header
- **User Scope**: Authenticated user automatically set in WebSocket scope

### Security Features
- User can only access their own conversations
- Message privacy enforced at database level
- CORS configured for production domains
- Rate limiting available for production

## 🚀 Deployment

### Production Configuration

#### 1. **Environment Variables**
```bash
# WebSocket URL
REACT_APP_WS_URL=wss://api.vikrahub.com/ws/

# API URL
REACT_APP_API_URL=https://api.vikrahub.com/api/

# Redis for production WebSocket scaling
REDIS_URL=redis://localhost:6379
```

#### 2. **Django Settings**
```python
# Production channel layer
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [os.environ.get('REDIS_URL', 'redis://localhost:6379')],
        },
    },
}
```

#### 3. **ASGI Server**
```bash
# Using Daphne
daphne -b 0.0.0.0 -p 8000 vikrahub.asgi:application

# Using Uvicorn
uvicorn vikrahub.asgi:application --host 0.0.0.0 --port 8000
```

## 📱 Mobile Support

### Responsive Design
- Mobile-optimized chat modal
- Touch-friendly interface
- Adaptive layout for different screen sizes

### CSS Classes Available
```css
.chat-button-small    /* Small button variant */
.chat-button-large    /* Large button variant */
.chat-modal          /* Mobile responsive modal */
```

## 🧪 Testing

### Access Demo
1. Start backend: `python manage.py runserver`
2. Start frontend: `npm start`
3. Navigate to: `http://localhost:3000/#/chat-demo`
4. Login with user credentials
5. Click "Message" buttons to test real-time chat

### Test Scenarios
1. **Real-time Messaging**: Open two browser tabs, different users
2. **Message Persistence**: Refresh page, verify message history loads
3. **Authentication**: Test with/without JWT tokens
4. **Error Handling**: Test invalid recipient IDs, network issues
5. **Connection Status**: Test WebSocket connection indicators

## 🔧 Customization

### Chat Button Variants
```jsx
<ChatButton variant="primary" />      // Blue gradient
<ChatButton variant="secondary" />    // Outline style
<ChatButton variant="success" />      // Green gradient
<ChatButton variant="dark" />         // Dark theme
<ChatButton variant="outline" />      // Light outline
```

### Chat Modal Customization
- Modify CSS variables in `ChatModal.css`
- Custom avatars via user props
- Themeable color schemes
- Custom message bubble styles

## 📊 Performance

### Optimizations
- Lazy loading of chat components
- Optimistic UI updates
- Efficient WebSocket message handling
- Message pagination support
- Connection pooling for multiple chats

### Monitoring
- WebSocket connection status
- Message delivery confirmation
- Error logging and reporting
- Performance metrics available

## 🤝 Integration

### With Existing VikraHub Features
- **User Profiles**: Add chat buttons to user cards
- **Follow System**: Chat with followed users
- **Notifications**: Real-time message notifications
- **Search**: Find users and start chats
- **Admin Panel**: Message moderation tools

### Example Integration
```jsx
// In UserCard component
import ChatButton from './Chat/ChatButton';

function UserCard({ user }) {
  return (
    <div className="user-card">
      <img src={user.avatar} alt={user.name} />
      <h3>{user.name}</h3>
      <div className="actions">
        <FollowButton user={user} />
        <ChatButton user={user} variant="secondary" />
      </div>
    </div>
  );
}
```

## 📝 Next Steps

### Potential Enhancements
1. **File Sharing**: Image/document upload in messages
2. **Message Reactions**: Emoji reactions to messages
3. **Read Receipts**: Show when messages are read
4. **Message Search**: Search within conversation history
5. **Voice Messages**: Audio message support
6. **Group Chats**: Multi-user conversations
7. **Message Encryption**: End-to-end encryption
8. **Push Notifications**: Mobile push notifications

### Performance Improvements
1. **Message Pagination**: Load messages in chunks
2. **Virtual Scrolling**: Handle large message lists
3. **Message Caching**: Client-side message cache
4. **Connection Pooling**: Optimize WebSocket connections

---

## 🎯 Summary

This implementation provides a complete, production-ready real-time messaging system for VikraHub with:

✅ **Real-time messaging** with WebSocket connections  
✅ **JWT authentication** for secure communication  
✅ **Message persistence** in database with sender/recipient tracking  
✅ **REST API** for message history (`/api/messages/?user_id=X`)  
✅ **Unread message counts** (`getUnreadMessagesCount(user_id)`)  
✅ **React components** ready for integration  
✅ **Mobile-responsive** design  
✅ **Production deployment** ready  

The system is now ready for use in the VikraHub platform! 🚀
