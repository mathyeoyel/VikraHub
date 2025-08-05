// frontend/src/components/Chat/ChatModal.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../Auth/AuthContext';
import { getAccessToken } from '../../auth';
import './ChatModal.css';

const ChatModal = ({ isOpen, onClose, recipientUser }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Ensure recipient has proper display name (safe fallback)
  const recipientDisplayName = recipientUser?.full_name || recipientUser?.username || 'User';

  // WebSocket URL configuration
  const getWebSocketURL = () => {
    const baseURL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api/";
    const isProduction = baseURL.includes('api.vikrahub.com');
    
    if (isProduction) {
      return 'wss://api.vikrahub.com/ws/chat/';
    } else {
      // Development environment - use local backend
      return 'ws://127.0.0.1:8000/ws/chat/';
    }
  };

  // Load existing messages with the user
  const loadExistingMessages = useCallback(async () => {
    if (!recipientUser || !recipientUser.id) return;
    
    try {
      setLoading(true);
      const token = getAccessToken();
      
      // Always use numeric user ID for fetching messages
      const recipientId = parseInt(recipientUser.id);
      if (isNaN(recipientId)) {
        console.error('Invalid recipient ID:', recipientUser.id);
        return;
      }
        
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || "https://api.vikrahub.com/api/"}messaging/messages/?user_id=${recipientId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('API response data:', data);
        
        // Safely handle API response - check if it's an array or has messages property
        let messagesArray = [];
        if (Array.isArray(data)) {
          messagesArray = data;
        } else if (data && Array.isArray(data.messages)) {
          messagesArray = data.messages;
        } else {
          console.warn('Expected array or object with messages array, got:', typeof data, data);
        }
        
        const formattedMessages = messagesArray.map(msg => ({
          id: msg.id,
          text: msg.content,
          sender: msg.sender,
          recipient: msg.recipient,
          timestamp: msg.timestamp,
          isOwn: msg.sender.id === user?.id
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Failed to load existing messages:', error);
    } finally {
      setLoading(false);
    }
  }, [recipientUser, user?.id]);

  // Connect to WebSocket
  useEffect(() => {
    if (!isOpen || !recipientUser || !token) return;

    const connectWebSocket = () => {
      try {
        const baseWsURL = getWebSocketURL();
        const wsURL = `${baseWsURL}?token=${token}`;
        
        console.log('Connecting to chat WebSocket:', wsURL.replace(/token=[^&]*/, 'token=***'));
        
        const newSocket = new WebSocket(wsURL);
        
        newSocket.onopen = () => {
          console.log('Chat WebSocket connected');
          setIsConnected(true);
          setSocket(newSocket);
        };
        
        newSocket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('Chat WebSocket message received:', data);
          
          switch (data.type) {
            case 'connection_established':
              console.log('Chat connection established for user:', data.username);
              loadExistingMessages();
              break;
              
            case 'new_message':
              // Add new message to the conversation
              setMessages(prev => [...prev, {
                id: data.message.id,
                sender: data.message.sender,
                recipient: data.message.recipient,
                text: data.message.text,
                timestamp: data.message.timestamp,
                is_read: false
              }]);
              break;
              
            case 'message_sent':
              // Confirmation that our message was sent
              console.log('Message sent successfully:', data.message);
              break;
              
            case 'error':
              console.error('Chat WebSocket error:', data.message);
              break;
              
            default:
              console.log('Unknown chat message type:', data.type);
          }
        };
        
        newSocket.onclose = (event) => {
          console.log('Chat WebSocket disconnected:', event.code, event.reason);
          setIsConnected(false);
          setSocket(null);
        };
        
        newSocket.onerror = (error) => {
          console.error('Chat WebSocket error:', error);
          setIsConnected(false);
        };
        
        return newSocket;
        
      } catch (error) {
        console.error('Failed to connect to chat WebSocket:', error);
        setIsConnected(false);
      }
    };

    const ws = connectWebSocket();
    
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [isOpen, recipientUser, token, loadExistingMessages]);

  // Send message via WebSocket
  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !isConnected || !recipientUser) return;

    // Always use numeric recipient ID for sending messages
    const recipientId = parseInt(recipientUser.id);
    if (isNaN(recipientId)) {
      console.error('Invalid recipient ID for sending message:', recipientUser.id);
      return;
    }

    const messageData = {
      type: 'message',
      recipient_id: recipientId, // Always use numeric ID
      text: newMessage.trim()
    };

    console.log('Sending message:', messageData);
    socket.send(JSON.stringify(messageData));
    
    // Add message to local state immediately (optimistic update)
    const localMessage = {
      id: Date.now(), // temporary ID
      sender: {
        id: user.id,
        username: user.username,
        full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
      },
      recipient: {
        id: recipientUser.id,
        username: recipientUser.username,
        full_name: recipientUser.full_name || recipientUser.username
      },
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
      is_read: true
    };
    
    setMessages(prev => [...prev, localMessage]);
    setNewMessage('');
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Validate recipient user data and modal state
  if (!isOpen) return null;
  
  if (!recipientUser || (!recipientUser.username && !recipientUser.id)) {
    console.error('ChatModal: Invalid recipient user data', recipientUser);
    return null;
  }

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={e => e.stopPropagation()}>
        <div className="chat-header">
          <div className="chat-user-info">
            <img
              src={recipientUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(recipientDisplayName)}&background=007bff&color=ffffff&size=40`}
              alt={recipientDisplayName}
              className="chat-user-avatar"
            />
            <div>
              <h3>{recipientDisplayName}</h3>
              <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? '🟢 Connected' : '🔴 Connecting...'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="chat-close-btn">&times;</button>
        </div>

        <div className="chat-messages">
          {loading ? (
            <div className="chat-loading">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">
              <p>Start your conversation with {recipientDisplayName}</p>
            </div>
          ) : (
            messages.map(message => (
              <div
                key={message.id}
                className={`chat-message ${message.sender.id === user?.id ? 'sent' : 'received'}`}
              >
                <div className="message-content">
                  <p>{message.text}</p>
                  <span className="message-time">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="chat-input-form">
          <div className="chat-input-container">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${recipientDisplayName}...`}
              className="chat-input"
              disabled={!isConnected}
            />
            <button 
              type="submit" 
              className="chat-send-btn" 
              disabled={!newMessage.trim() || !isConnected}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatModal;
