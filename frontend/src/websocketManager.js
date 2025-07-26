import { getAccessToken } from "./auth";

class WebSocketManager {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.listeners = new Map();
    this.isConnecting = false;
    this.shouldReconnect = true;
  }

  connect() {
    if (this.isConnecting || (this.socket && this.socket.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    const token = getAccessToken();
    
    if (!token) {
      console.warn("No access token available for WebSocket connection");
      this.isConnecting = false;
      return;
    }

    const wsUrl = process.env.REACT_APP_WS_URL || "wss://api.vikrahub.com/ws/messaging/";
    
    try {
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log("🔗 WebSocket connected successfully");
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Send authentication
        this.socket.send(JSON.stringify({
          type: 'authenticate',
          token: token
        }));
        
        this.notifyListeners('connected', { status: 'connected' });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      this.socket.onclose = (event) => {
        console.log("🔌 WebSocket disconnected:", event.code, event.reason);
        this.isConnecting = false;
        this.socket = null;
        
        this.notifyListeners('disconnected', { 
          code: event.code, 
          reason: event.reason 
        });

        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (error) => {
        console.error("🚨 WebSocket error:", error);
        this.isConnecting = false;
        this.notifyListeners('error', { error });
      };

    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      this.isConnecting = false;
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`⏰ Scheduling WebSocket reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect();
      }
    }, delay);
  }

  handleMessage(data) {
    const { type } = data;
    
    switch (type) {
      case 'authentication_success':
        console.log("✅ WebSocket authentication successful");
        this.notifyListeners('authenticated', data);
        break;
        
      case 'authentication_failed':
        console.error("❌ WebSocket authentication failed:", data.message);
        this.notifyListeners('auth_failed', data);
        break;
        
      case 'new_message':
        this.notifyListeners('message', data);
        break;
        
      case 'typing_start':
        this.notifyListeners('typing_start', data);
        break;
        
      case 'typing_stop':
        this.notifyListeners('typing_stop', data);
        break;
        
      case 'unread_count_update':
        this.notifyListeners('unread_count', data);
        break;
        
      case 'notification':
        this.notifyListeners('notification', data);
        break;
        
      default:
        console.log("🔄 Received WebSocket message:", data);
        this.notifyListeners('message', data);
    }
  }

  send(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      return true;
    } else {
      console.warn("WebSocket not connected, cannot send message:", message);
      return false;
    }
  }

  // Event listener management
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods
  sendMessage(conversationId, content) {
    return this.send({
      type: 'send_message',
      conversation_id: conversationId,
      content: content
    });
  }

  startTyping(conversationId) {
    return this.send({
      type: 'typing_start',
      conversation_id: conversationId
    });
  }

  stopTyping(conversationId) {
    return this.send({
      type: 'typing_stop',
      conversation_id: conversationId
    });
  }

  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }

  getConnectionState() {
    if (!this.socket) return 'disconnected';
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }
}

// Create singleton instance
const websocketManager = new WebSocketManager();

export default websocketManager;
