import React, { useState, useEffect } from 'react';
import { useAuth } from './Auth/AuthContext';
import { messagesAPI } from '../api';
import ChatButton from './Chat/ChatButton';
import './MessagesDashboard.css';

const MessagesDashboard = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchConversations();
    fetchUnreadCount();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      // Use the new conversations API endpoint
      const response = await messagesAPI.getConversations();
      
      console.log('📥 Dashboard conversations data:', response.data);
      
      // New API returns conversations with participant info directly
      const conversationsData = response.data || [];
      const validConversations = conversationsData.filter(conv => 
        conv.participant && conv.participant.id && conv.participant.username
      );
      
      setConversations(validConversations);
          conversationMap.set(partnerId, {
            partner,
            lastMessage: message,
            unreadCount: 0
          });
        } else {
          const existing = conversationMap.get(partnerId);
          if (new Date(message.timestamp) > new Date(existing.lastMessage.timestamp)) {
            existing.lastMessage = message;
          }
        }
        
        // Count unread messages from this partner
        if (!message.is_read && message.recipient.id === user.id) {
          conversationMap.get(partnerId).unreadCount++;
        }
      });
      
      setConversations(Array.from(conversationMap.values()).sort((a, b) => 
        new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
      ));
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await messagesAPI.getUnreadCount();
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const truncateMessage = (content, maxLength = 60) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="messages-dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-dashboard">
      <div className="messages-header">
        <h3>Messages {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}</h3>
        <p>Stay connected with your community</p>
      </div>

      {conversations.length === 0 ? (
        <div className="no-conversations">
          <div className="no-conversations-icon"><i className="fas fa-comment icon"></i></div>
          <h4>No conversations yet</h4>
          <p>Start chatting with other members to see your conversations here.</p>
          <div className="conversation-suggestions">
            <p>Try reaching out to:</p>
            <ul>
              <li>• Creators you follow</li>
              <li>• Freelancers for your projects</li>
              <li>• Fellow community members</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="conversations-list">
          {conversations.map((conversation) => (
            <div key={conversation.partner.id} className="conversation-item">
              <div className="conversation-avatar">
                {conversation.partner.userprofile?.avatar ? (
                  <img 
                    src={conversation.partner.userprofile.avatar} 
                    alt={conversation.partner.username}
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {conversation.partner.first_name?.charAt(0) || 
                     conversation.partner.username.charAt(0).toUpperCase()}
                  </div>
                )}
                {conversation.unreadCount > 0 && (
                  <div className="unread-indicator">{conversation.unreadCount}</div>
                )}
              </div>
              
              <div className="conversation-content">
                <div className="conversation-header">
                  <h4 className="partner-name">
                    {conversation.partner.first_name && conversation.partner.last_name
                      ? `${conversation.partner.first_name} ${conversation.partner.last_name}`
                      : conversation.partner.username}
                  </h4>
                  <span className="message-time">
                    {formatMessageTime(conversation.lastMessage.timestamp)}
                  </span>
                </div>
                
                <div className="last-message">
                  <span className={conversation.unreadCount > 0 ? 'unread' : ''}>
                    {conversation.lastMessage.sender.id === user.id ? 'You: ' : ''}
                    {truncateMessage(conversation.lastMessage.content)}
                  </span>
                </div>
              </div>
              
              <div className="conversation-actions">
                <ChatButton 
                  recipientUsername={conversation.partner.username}
                  recipientName={conversation.partner.first_name && conversation.partner.last_name
                    ? `${conversation.partner.first_name} ${conversation.partner.last_name}`
                    : conversation.partner.username}
                  size="small"
                  variant="text"
                />
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="messages-footer">
        <p>
          💡 Tip: You can start a conversation from any user's profile or from the community directory.
        </p>
      </div>
    </div>
  );
};

export default MessagesDashboard;
