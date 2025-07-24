import React, { useState, useEffect } from 'react';
import { useAuth } from '../Auth/AuthContext';
import { messagesAPI } from '../../api';
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
      const response = await messagesAPI.getConversations();
      setConversations(response.data || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setError('Failed to load conversations');
      // Mock data for development
      setConversations([
        {
          id: 1,
          participant: {
            username: 'john_designer',
            name: 'John Smith',
            avatar: 'https://ui-avatars.com/api/?name=John+Smith&background=000223&color=ffffff&size=60'
          },
          last_message: {
            text: 'Hey! I saw your portfolio and I\'m interested in collaborating on a project.',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            is_read: false
          },
          unread_count: 2
        },
        {
          id: 2,
          participant: {
            username: 'sarah_writer',
            name: 'Sarah Johnson',
            avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=ffa000&color=ffffff&size=60'
          },
          last_message: {
            text: 'Thanks for the quick response! When can we schedule a call?',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            is_read: true
          },
          unread_count: 0
        },
        {
          id: 3,
          participant: {
            username: 'mike_dev',
            name: 'Mike Developer',
            avatar: 'https://ui-avatars.com/api/?name=Mike+Developer&background=28a745&color=ffffff&size=60'
          },
          last_message: {
            text: 'The project specifications look great. Let\'s move forward!',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            is_read: true
          },
          unread_count: 0
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      setLoading(true);
      const response = await messagesAPI.getMessages(conversationId);
      setMessages(response.data || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      // Mock messages for development
      setMessages([
        {
          id: 1,
          sender: {
            username: 'john_designer',
            name: 'John Smith'
          },
          text: 'Hey! I saw your portfolio and I\'m interested in collaborating on a project.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          is_read: false
        },
        {
          id: 2,
          sender: {
            username: user?.username,
            name: user?.first_name + ' ' + user?.last_name
          },
          text: 'Hi John! Thanks for reaching out. I\'d love to hear more about your project.',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          is_read: true
        },
        {
          id: 3,
          sender: {
            username: 'john_designer',
            name: 'John Smith'
          },
          text: 'Great! It\'s a web design project for a local business. Are you available for a quick call this week?',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          is_read: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const messageData = {
        conversation_id: selectedConversation.id,
        text: newMessage.trim()
      };

      await messagesAPI.sendMessage(messageData);
      
      // Add message to local state
      const newMsg = {
        id: Date.now(),
        sender: {
          username: user?.username,
          name: user?.first_name + ' ' + user?.last_name
        },
        text: newMessage.trim(),
        timestamp: new Date().toISOString(),
        is_read: true
      };
      
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      
      // Update conversation's last message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, last_message: { text: newMessage.trim(), timestamp: new Date().toISOString(), is_read: true } }
            : conv
        )
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message');
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
      await messagesAPI.markAsRead(conversationId);
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
    conv.participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.participant.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);

  return (
    <div className="messages-page">
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
                  <p>No conversations found</p>
                  <small>Start networking to begin conversations!</small>
                </div>
              ) : (
                filteredConversations.map(conversation => (
                  <div
                    key={conversation.id}
                    className={`conversation-item ${selectedConversation?.id === conversation.id ? 'active' : ''} ${conversation.unread_count > 0 ? 'unread' : ''}`}
                    onClick={() => selectConversation(conversation)}
                  >
                    <img
                      src={conversation.participant.avatar}
                      alt={conversation.participant.name}
                      className="conversation-avatar"
                    />
                    <div className="conversation-info">
                      <div className="conversation-header">
                        <h4>{conversation.participant.name}</h4>
                        <span className="conversation-time">
                          {formatTime(conversation.last_message.timestamp)}
                        </span>
                      </div>
                      <p className="last-message">
                        {conversation.last_message.text}
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
                    src={selectedConversation.participant.avatar}
                    alt={selectedConversation.participant.name}
                    className="participant-avatar"
                  />
                  <div className="participant-info">
                    <h3>{selectedConversation.participant.name}</h3>
                    <span className="participant-username">@{selectedConversation.participant.username}</span>
                  </div>
                </div>

                <div className="messages-list">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`message ${message.sender.username === user?.username ? 'sent' : 'received'}`}
                    >
                      <div className="message-content">
                        <p>{message.text}</p>
                        <span className="message-time">
                          {formatTime(message.timestamp)}
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
