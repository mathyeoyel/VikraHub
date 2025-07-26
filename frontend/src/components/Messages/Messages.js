import React, { useState, useEffect } from 'react';
import { useAuth } from '../Auth/AuthContext';
import { messagingAPI } from '../../api';
import { handleImageError, getAvatarUrl } from '../../utils/imageUtils';
import './Messages.css';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching conversations...');
      
      // Use the correct messaging API endpoint with enhanced error handling
      const response = await messagingAPI.getConversations();
      const data = response.data || [];
      
      console.log('📥 Raw conversations data:', data);
      
      // Filter out fake or invalid user conversations with enhanced validation
      const validConversations = data.filter(conv => {
        const isValid = conv.other_participant &&
          conv.other_participant.id &&
          conv.other_participant.username &&
          typeof conv.other_participant.id === 'number' &&
          conv.other_participant.username.trim() !== '';
        
        if (!isValid) {
          console.warn('⚠️ Filtered out invalid conversation:', conv);
        }
        return isValid;
      });
      
      console.log('✅ Valid conversations loaded:', validConversations.length);
      setConversations(validConversations);
      setError(null);
      
    } catch (error) {
      console.error('❌ Failed to fetch conversations:', error);
      
      // Enhanced error handling with specific error types
      if (error.response?.status === 500) {
        console.error('🔧 Database/Server Error Details:', error.response.data);
        showToast('Server error detected. Our team has been notified. Please try again later.');
      } else if (error.response?.status === 401) {
        showToast('Session expired. Please log in again.');
      } else if (error.response?.status === 403) {
        showToast('Access denied. Please check your permissions.');
      } else {
        showToast('Could not load conversations. Please check your connection.');
      }
      
      // Always show empty list instead of fake data
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      setLoading(true);
      // Use the correct messaging API endpoint
      const response = await messagingAPI.getMessages(conversationId);
      setMessages(response.data || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      // Don't show fake messages - just empty list
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      // Use the correct messaging API endpoint
      await messagingAPI.sendMessage(selectedConversation.id, newMessage.trim());
      
      // Add message to local state
      const newMsg = {
        id: Date.now(),
        sender: {
          username: user?.username,
          full_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username
        },
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
        is_read: true
      };
      
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      
      // Update conversation's last message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { 
                ...conv, 
                latest_message: { 
                  content: newMessage.trim(), 
                  created_at: new Date().toISOString() 
                } 
              }
            : conv
        )
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      showToast('Failed to send message');
    }
  };

  const selectConversation = (conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
    
    // Mark as read
    if (conversation.unread_count > 0) {
      markAsRead(conversation.id);
    }
  };

  const markAsRead = async (conversationId) => {
    try {
      // Use the correct messaging API endpoint
      await messagingAPI.markConversationRead(conversationId);
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
        )
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.other_participant.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.other_participant.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);

  // Simple toast notification function
  const showToast = (message) => {
    setError(message);
    // Clear error after 5 seconds
    setTimeout(() => setError(null), 5000);
  };

  return (
    <div className="messages-page">
      {/* Toast Error Message */}
      {error && (
        <div className="error-toast">
          {error}
          <button onClick={() => setError(null)} className="toast-close">×</button>
        </div>
      )}
      
      <div className="container">
        <div className="messages-header">
          <h1>Messages</h1>
          <div className="messages-stats">
            {totalUnread > 0 && (
              <span className="unread-badge">{totalUnread} unread</span>
            )}
          </div>
        </div>

        <div className="messages-container">
          {/* Conversations List */}
          <div className="conversations-sidebar">
            <div className="conversations-header">
              <h3>Conversations</h3>
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="conversations-list">
              {loading ? (
                <div className="loading-state">Loading conversations...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="empty-state">
                  <p>No conversations yet</p>
                  <small>Start messaging other creators to see conversations here!</small>
                </div>
              ) : (
                filteredConversations.map(conversation => (
                  <div
                    key={conversation.id}
                    className={`conversation-item ${selectedConversation?.id === conversation.id ? 'active' : ''} ${conversation.unread_count > 0 ? 'unread' : ''}`}
                    onClick={() => selectConversation(conversation)}
                  >
                    <img
                      src={getAvatarUrl(conversation.other_participant)}
                      alt={conversation.other_participant.full_name || conversation.other_participant.username}
                      className="conversation-avatar"
                      onError={(e) => handleImageError(e, 'avatar')}
                    />
                    <div className="conversation-info">
                      <div className="conversation-header">
                        <h4>{conversation.other_participant.full_name || conversation.other_participant.username}</h4>
                        <span className="conversation-time">
                          {conversation.latest_message ? formatTime(conversation.latest_message.created_at) : ''}
                        </span>
                      </div>
                      <p className="last-message">
                        {conversation.latest_message?.content || 'No messages yet'}
                      </p>
                      {conversation.unread_count > 0 && (
                        <span className="unread-count">{conversation.unread_count}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="messages-area">
            {selectedConversation ? (
              <>
                <div className="messages-header-bar">
                  <img
                    src={getAvatarUrl(selectedConversation.other_participant)}
                    alt={selectedConversation.other_participant.full_name || selectedConversation.other_participant.username}
                    className="participant-avatar"
                    onError={(e) => handleImageError(e, 'avatar')}
                  />
                  <div className="participant-info">
                    <h3>{selectedConversation.other_participant.full_name || selectedConversation.other_participant.username}</h3>
                    <span className="participant-username">@{selectedConversation.other_participant.username}</span>
                  </div>
                </div>

                <div className="messages-list">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`message ${message.sender.username === user?.username ? 'sent' : 'received'}`}
                    >
                      <div className="message-content">
                        <p>{message.content}</p>
                        <span className="message-time">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={sendMessage} className="message-input-form">
                  <div className="message-input-container">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="message-input"
                    />
                    <button type="submit" className="send-button" disabled={!newMessage.trim()}>
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="no-conversation-selected">
                <div className="empty-chat-state">
                  <h3>Select a conversation</h3>
                  <p>Choose a conversation from the sidebar to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
