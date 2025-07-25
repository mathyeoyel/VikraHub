// frontend/src/contexts/WebSocketContext.js
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from '../components/Auth/AuthContext';
import { getAccessToken } from '../auth';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  // Get WebSocket URL - prefer explicit REACT_APP_WS_URL
  const getWebSocketURL = () => {
    // First priority: explicit WebSocket URL from environment
    const explicitWsUrl = process.env.REACT_APP_WS_URL;
    if (explicitWsUrl) {
      console.log('Using explicit WebSocket URL:', explicitWsUrl);
      return `${explicitWsUrl}messaging/`;
    }
    
    // Fallback: derive from API URL
    const baseURL = process.env.REACT_APP_API_URL || "https://api.vikrahub.com/api/";
    const wsProtocol = baseURL.startsWith('https') ? 'wss' : 'ws';
    const domain = baseURL.replace(/^https?:\/\//, '').replace('/api/', '');
    const derivedWsUrl = `${wsProtocol}://${domain}/ws/messaging/`;
    console.log('Derived WebSocket URL from API URL:', derivedWsUrl);
    return derivedWsUrl;
  };

  // Connect to WebSocket
  const connect = () => {
    if (!isAuthenticated || socket?.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      const baseWsURL = getWebSocketURL();
      
      // Add JWT token as query parameter for authentication
      const jwtToken = getAccessToken();
      const wsURL = jwtToken ? `${baseWsURL}?token=${jwtToken}` : baseWsURL;
      
      console.log('Connecting to WebSocket:', wsURL.replace(/token=[^&]*/, 'token=***'));
      
      const newSocket = new WebSocket(wsURL);
      
      newSocket.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
        
        // Send authentication or identification message if needed
        if (user) {
          newSocket.send(JSON.stringify({
            type: 'authenticate',
            user_id: user.id,
            username: user.username
          }));
        }
      };
      
      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          // Handle different message types
          switch (data.type) {
            case 'connection_established':
              console.log('WebSocket connection established for user:', data.username);
              break;
            case 'follow_notification':
              // This will be handled by FollowContext
              break;
            case 'new_message':
              // This will be handled by MessagingContext
              break;
            case 'error':
              console.error('WebSocket error message:', data.message);
              break;
            default:
              console.log('Unknown WebSocket message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      newSocket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setSocket(null);
        
        // Attempt to reconnect if it wasn't a clean close and user is still authenticated
        if (event.code !== 1000 && isAuthenticated && reconnectAttemptsRef.current < maxReconnectAttempts) {
          console.log(`Attempting to reconnect... (${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, reconnectDelay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setConnectionError('Failed to connect after multiple attempts');
        }
      };
      
      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('WebSocket connection error');
      };
      
      setSocket(newSocket);
      
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionError('Failed to create WebSocket connection');
    }
  };

  // Disconnect from WebSocket
  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socket) {
      socket.close(1000, 'User logout');
      setSocket(null);
    }
    
    setIsConnected(false);
    setConnectionError(null);
    reconnectAttemptsRef.current = 0;
  };

  // Send message through WebSocket
  const sendMessage = (message) => {
    if (socket && isConnected) {
      try {
        socket.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        return false;
      }
    }
    return false;
  };

  // Effect to handle authentication changes
  useEffect(() => {
    if (isAuthenticated && user) {
      connect();
    } else {
      disconnect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [isAuthenticated, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, []);

  // Handle page visibility changes to manage connection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, we might want to reduce activity
        console.log('Page hidden, WebSocket connection maintained');
      } else {
        // Page is visible, ensure connection is active
        if (isAuthenticated && !isConnected) {
          console.log('Page visible, attempting to reconnect WebSocket');
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, isConnected]);

  const value = {
    socket,
    isConnected,
    connectionError,
    connect,
    disconnect,
    sendMessage,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};