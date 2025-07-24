import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './Auth/AuthContext';
import { messagesAPI, userAPI, publicProfileAPI } from '../api';
import { notificationService } from '../services/notificationService';
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
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [searchUsers, setSearchUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock conversations for now since API endpoints don't exist
      const mockConversations = [
        {
          id: 1,
          participant: {
            username: 'johndoe',
            first_name: 'John',
            last_name: 'Doe',
            avatar: null
          },
          last_message: {
            text: "Hey! I saw your portfolio and I'm interested in collaborating.",
            timestamp: '2025-07-24T10:30:00Z',
            is_read: true
          },
          unread_count: 0
        },
        {
          id: 2,
          participant: {
            username: 'sarahdesign',
            first_name: 'Sarah',
            last_name: 'Ahmed',
            avatar: null
          },
          last_message: {
            text: "Thanks for the quick turnaround on the logo design!",
            timestamp: '2025-07-23T15:45:00Z',
            is_read: false
          },
          unread_count: 2
        }
      ];
      
      setConversations(mockConversations);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setError('Unable to load conversations. Please check your connection.');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversation) => {
    try {
      setSelectedConversation(conversation);
      setLoading(true);
      setError(null);
      
      // Mock messages for now
      const mockMessages = [
        {
          id: 1,
          sender: {
            username: conversation.participant.username,
            name: `${conversation.participant.first_name} ${conversation.participant.last_name}`
          },
          text: conversation.last_message.text,
          timestamp: conversation.last_message.timestamp,
          is_read: true
        },
        {
          id: 2,
          sender: {
            username: user?.username,
            name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username
          },
          text: "Hi! Thanks for reaching out. I'd love to hear more about your project.",
          timestamp: '2025-07-24T10:35:00Z',
          is_read: true
        }
      ];
      
      setMessages(mockMessages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setError('Unable to load messages. Please check your connection.');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const searchUsersForNewConversation = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSearchUsers([]);
      return;
    }

    try {
      setSearchingUsers(true);
      // For now, use mock data since user search endpoint doesn't exist
      const mockUsers = [
        {
          id: 3,
          username: 'artistmike',
          first_name: 'Michael',
          last_name: 'Johnson',
          avatar: null,
          user_type: 'creator'
        },
        {
          id: 4,
          username: 'designpro',
          first_name: 'Lisa',
          last_name: 'Wilson',
          avatar: null,
          user_type: 'freelancer'
        }
      ].filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setSearchUsers(mockUsers);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchUsers([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const startNewConversation = async (selectedUser) => {
    try {
      // Create new conversation
      const newConversation = {
        id: Date.now(),
        participant: {
          username: selectedUser.username,
          first_name: selectedUser.first_name,
          last_name: selectedUser.last_name,
          avatar: selectedUser.avatar
        },
        last_message: null,
        unread_count: 0
      };

      setConversations(prev => [newConversation, ...prev]);
      setSelectedConversation(newConversation);
      setMessages([]);
      setShowNewMessageModal(false);
      setSearchUsers([]);
      setSearchTerm('');
    } catch (error) {
      console.error('Failed to create conversation:', error);
      setError('Unable to start conversation. Please try again.');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      // Create local message immediately for better UX
      const newMsg = {
        id: Date.now(),
        sender: {
          username: user?.username,
          name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username
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
            ? { 
                ...conv, 
                last_message: { 
                  text: newMessage.trim(), 
                  timestamp: new Date().toISOString(), 
                  is_read: true 
                } 
              }
            : conv
        )
      );
      
      // TODO: Send to backend when API is implemented
      console.log('Message would be sent to backend:', {
        conversation_id: selectedConversation.id,
        text: newMessage.trim()
      });
      
      // Send notification to the recipient
      if (selectedConversation.participant) {
        notificationService.messageNotification(
          selectedConversation.participant.first_name && selectedConversation.participant.last_name ? 
            `${selectedConversation.participant.first_name} ${selectedConversation.participant.last_name}` : 
            selectedConversation.participant.username,
          user.first_name && user.last_name ? 
            `${user.first_name} ${user.last_name}` : 
            user.username || 'Someone',
          newMessage.trim().substring(0, 50) + (newMessage.trim().length > 50 ? '...' : '')
        );
      }
      
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message. Please try again.');
    }
  };

  const selectConversation = (conversation) => {
    fetchMessages(conversation);
    
    // Mark as read
    if (conversation.unread_count > 0) {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversation.id 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
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
