// frontend/src/components/Chat/ChatExample.js
import React from 'react';
import ChatButton from './ChatButton';

const ChatExample = () => {
  // Example user data - in real app this would come from props or API
  const exampleUsers = [
    {
      id: 1,
      username: 'johndoe',
      full_name: 'John Doe',
      avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=007bff&color=ffffff&size=60'
    },
    {
      id: 2,
      username: 'sarahdesign',
      full_name: 'Sarah Ahmed',
      avatar: 'https://ui-avatars.com/api/?name=Sarah+Ahmed&background=28a745&color=ffffff&size=60'
    },
    {
      id: 3,
      username: 'mike_dev',
      full_name: 'Mike Developer',
      avatar: 'https://ui-avatars.com/api/?name=Mike+Developer&background=ffc107&color=000000&size=60'
    }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Real-time Chat System Demo</h2>
      <p>Click on any "Message" button below to start a real-time chat with that user:</p>
      
      <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
        {exampleUsers.map(user => (
          <div key={user.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            padding: '15px',
            border: '1px solid #e1e5e9',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa'
          }}>
            <img
              src={user.avatar}
              alt={user.full_name}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%'
              }}
            />
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 5px 0' }}>{user.full_name}</h4>
              <p style={{ margin: 0, color: '#6c757d' }}>@{user.username}</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <ChatButton 
                user={user} 
                buttonText="Message" 
                variant="primary"
              />
              <ChatButton 
                user={user} 
                buttonText="Quick Chat" 
                variant="secondary"
                className="chat-button-small"
              />
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#e7f3ff', borderRadius: '8px' }}>
        <h3>How it works:</h3>
        <ul>
          <li><strong>Real-time WebSocket:</strong> Messages appear instantly using WebSocket connection to <code>wss://api.vikrahub.com/ws/chat/</code></li>
          <li><strong>JWT Authentication:</strong> Users must be logged in, token passed as query parameter</li>
          <li><strong>Message Format:</strong> Send messages with <code>{`{type: "message", recipient_id: X, text: "..."}`}</code></li>
          <li><strong>Persistent Storage:</strong> All messages are saved to database with sender/recipient info</li>
          <li><strong>REST API:</strong> Load message history via <code>/api/messages/?user_id=X</code></li>
          <li><strong>Unread Counts:</strong> Get unread message counts via <code>/api/messages/user/X/unread/</code></li>
        </ul>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
        <h4>Technical Features:</h4>
        <ul style={{ marginBottom: 0 }}>
          <li>Optimistic UI updates for immediate feedback</li>
          <li>Auto-scroll to latest messages</li>
          <li>Connection status indicator</li>
          <li>Mobile-responsive design</li>
          <li>Message timestamps</li>
          <li>Error handling and reconnection</li>
        </ul>
      </div>
    </div>
  );
};

export default ChatExample;
