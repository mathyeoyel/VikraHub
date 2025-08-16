import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import { messagesAPI } from '../../api';
import { handleImageError, getAvatarUrl } from '../../utils/imageUtils';
import './Messages.css';

const Messages = () => {
  const { user, token } = useAuth();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]); // Ensure it's always an array
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  
  // New state for enhanced features
  const [ws, setWs] = useState(null);
  const [userStatuses, setUserStatuses] = useState({});
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [showReactionsMenu, setShowReactionsMenu] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  
  // Refs for enhanced functionality
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  
  // Available reactions
  const reactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  // Check if screen is mobile size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Debug log to track messages state
  useEffect(() => {
    console.log('🔍 Messages state changed:', { 
      type: typeof messages, 
      isArray: Array.isArray(messages), 
      length: messages?.length,
      messages 
    });
    
    // Safety check: ensure messages is always an array
    if (!Array.isArray(messages)) {
      console.warn('⚠️ Messages is not an array, resetting to empty array');
      setMessages([]);
    }
  }, [messages]);

  // WebSocket connection management
  useEffect(() => {
    if (user && token && selectedConversation) {
      connectWebSocket();
    }
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [user, token, selectedConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWebSocket = useCallback(() => {
    if (!user || !token || !selectedConversation) return;
    
    // Use the same base URL as the API but convert to WebSocket protocol
    const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api/";
    const isProduction = apiUrl.includes('api.vikrahub.com');
    
    let wsUrl;
    if (isProduction) {
      // Production environment
      wsUrl = `wss://api.vikrahub.com/ws/chat/?token=${token}`;
    } else {
      // Development environment - use local backend
      wsUrl = `ws://127.0.0.1:8000/ws/chat/?token=${token}`;
    }
    
    console.log('🔌 Connecting to WebSocket:', wsUrl.replace(/token=[^&]*/, 'token=***'));
    
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      console.log('✅ WebSocket connected');
      setWs(websocket);
    };
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📨 WebSocket message received:', data);
      
      switch (data.type) {
        case 'connection_established':
          console.log('🔗 WebSocket connection established:', data);
          break;
        case 'message':
          handleNewMessage(data.message);
          break;
        case 'message_sent':
          handleMessageSent(data.message);
          break;
        case 'message_delivered':
          updateDeliveryStatus(data.message_id, data.delivered_to, data.delivered_at);
          break;
        case 'message_read':
          handleMessageRead(data);
          break;
        case 'reaction':
        case 'add_reaction':
        case 'reaction_added':
        case 'remove_reaction':
        case 'reaction_removed':
        case 'reaction_update':
          if (data.reactions) {
            // New format from API endpoints with complete reactions array
            handleReactionUpdate(data);
          } else {
            // Legacy format from WebSocket messages
            applyReactionToMessage(data.message_id, data.reaction || data.reaction_type);
          }
          break;
        case 'delivery_receipt':
          handleDeliveryReceipt(data);
          break;
        case 'user_status':
          handleUserStatusUpdate(data);
          break;
        case 'error':
          console.error('❌ WebSocket error received:', data.message);
          // Show user-friendly error message
          showToast(`WebSocket error: ${data.message}`);
          break;
        default:
          console.log('🤷 Unknown message type:', data.type);
      }
    };
    
    websocket.onclose = (event) => {
      console.log('🔌 WebSocket disconnected:', event.code, event.reason);
      setWs(null);
      
      // Attempt to reconnect after a delay for abnormal closures
      if (!event.wasClean && event.code !== 1000) {
        console.log('🔄 Attempting WebSocket reconnection in 3 seconds...');
        setTimeout(() => {
          if (user && token && selectedConversation) {
            connectWebSocket();
          }
        }, 3000);
      }
    };
    
    websocket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };
  }, [user, token, selectedConversation]);

  const handleNewMessage = (message) => {
    setMessages(prevMessages => {
      const exists = prevMessages.find(msg => msg.id === message.id);
      if (exists) return prevMessages;
      
      return [...prevMessages, message];
    });
    
    // Update conversation last message
    setConversations(prev => 
      prev.map(conv => 
        conv.id === selectedConversation?.id 
          ? { 
              ...conv, 
              latest_message: { 
                content: message.content, 
                created_at: message.created_at 
              } 
            }
          : conv
      )
    );
  };

  const handleMessageRead = (data) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        data.message_ids.includes(msg.id) 
          ? { ...msg, is_read: true }
          : msg
      )
    );
  };

  const handleReactionUpdate = (data) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === data.message_id 
          ? { 
              ...msg, 
              reactions: Array.isArray(data.reactions) ? data.reactions : []
            }
          : msg
      )
    );
  };

  const handleDeliveryReceipt = (data) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === data.message_id 
          ? { 
              ...msg, 
              delivered_to: data.delivered_to || []
            }
          : msg
      )
    );
  };

  const handleUserStatusUpdate = (data) => {
    setUserStatuses(prev => ({
      ...prev,
      [data.user_id]: {
        status: data.status,
        last_seen: data.last_seen
      }
    }));
  };

  // New handler functions for enhanced WebSocket message types
  const handleMessageSent = (message) => {
    console.log('✅ Message sent confirmation received:', message);
    
    // Update the message in state to confirm it was sent successfully
    setMessages(prevMessages => 
      prevMessages.map(msg => {
        // Match by temporary ID or content if the message was just sent
        if (msg.id === message.id || 
            (typeof msg.id === 'number' && msg.content === message.content && msg.sender.username === user?.username)) {
          return {
            ...msg,
            id: message.id, // Update with actual server ID
            created_at: message.created_at,
            is_sent: true,
            ...message // Merge any other server data
          };
        }
        return msg;
      })
    );
  };

  const updateDeliveryStatus = (messageId, deliveredTo, deliveredAt) => {
    console.log('📬 Message delivery update:', { messageId, deliveredTo, deliveredAt });
    
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              is_delivered: true,
              delivered_to: deliveredTo,
              delivered_at: deliveredAt
            }
          : msg
      )
    );
  };

  const applyReactionToMessage = (messageId, reaction) => {
    console.log('😊 Applying reaction to message:', { messageId, reaction });
    
    setMessages(prevMessages => {
      // Ensure prevMessages is an array
      if (!Array.isArray(prevMessages)) {
        console.warn('⚠️ Previous messages is not an array in applyReactionToMessage:', typeof prevMessages, prevMessages);
        // Try to recover - if it's an object with messages property, use that
        if (prevMessages && typeof prevMessages === 'object' && Array.isArray(prevMessages.messages)) {
          console.log('🔧 Recovering messages from object property in applyReactionToMessage');
          return prevMessages.messages;
        }
        // Otherwise return empty array to prevent crashes
        return [];
      }
      
      return prevMessages.map(msg => {
        if (msg.id === messageId) {
          // Safely handle reactions array with validation
          const reactions = Array.isArray(msg.reactions) ? msg.reactions : [];
          const validReactions = reactions.filter(r => r && typeof r === 'object' && r.user);
          
          // Handle different reaction formats
          let updatedReactions;
          if (typeof reaction === 'string') {
            // Simple reaction type (like "like")
            const existingReaction = validReactions.find(r => r.user?.id === user?.id);
            
            if (existingReaction) {
              // Update existing reaction
              updatedReactions = validReactions.map(r => 
                r.user?.id === user?.id 
                  ? { ...r, reaction_type: reaction }
                  : r
              );
            } else {
              // Add new reaction
              updatedReactions = [...validReactions, {
                user: { id: user?.id, username: user?.username },
                reaction_type: reaction,
                created_at: new Date().toISOString()
              }];
            }
          } else if (reaction && typeof reaction === 'object') {
            // Full reaction object
            const existingIndex = validReactions.findIndex(r => r.user?.id === reaction.user?.id);
            
            if (existingIndex >= 0) {
              // Update existing reaction
              updatedReactions = [...validReactions];
              updatedReactions[existingIndex] = reaction;
            } else {
              // Add new reaction
              updatedReactions = [...validReactions, reaction];
            }
          } else {
            // Invalid reaction format
            console.warn('⚠️ Invalid reaction format:', reaction);
            return msg;
          }
          
          return {
            ...msg,
            reactions: updatedReactions
          };
        }
        return msg;
      });
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Handle recipient from navigation state
  useEffect(() => {
    const recipientUsername = location.state?.recipientUsername;
    const autoCreateConversation = location.state?.autoCreateConversation;
    const recipientName = location.state?.recipientName;
    
    if (recipientUsername && conversations.length > 0) {
      // Find existing conversation with this user (handle both API structures)
      const existingConv = conversations.find(conv => {
        const participantUsername = conv.participant?.username || conv.other_participant?.username;
        return participantUsername === recipientUsername;
      });
      
      if (existingConv) {
        console.log(`📩 Opening existing conversation with ${recipientUsername}`);
        setSelectedConversation(existingConv);
      } else if (autoCreateConversation) {
        console.log(`🆕 Auto-creating new conversation with ${recipientUsername}`);
        createNewConversation(recipientUsername, recipientName);
      } else {
        console.log(`💬 No existing conversation found with ${recipientUsername}, user can start a new one`);
      }
    }
  }, [location.state, conversations]);

  // Function to create a new conversation (idempotent)
  const createNewConversation = async (recipientUsername, recipientName = null) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`🔄 Getting/creating conversation with ${recipientUsername}`);
      
      // First, find the user ID from username
      // Check if we already have this user in our conversations (handle both API structures)
      let recipientId = null;
      const existingConv = conversations.find(conv => {
        const participantUsername = conv.participant?.username || conv.other_participant?.username;
        return participantUsername === recipientUsername;
      });
      
      if (existingConv) {
        recipientId = existingConv.participant?.id || existingConv.other_participant?.id;
      } else {
        // For username-only creation, use legacy API temporarily
        // TODO: Add user lookup endpoint or pass user ID from calling component
        console.warn('⚠️ Using legacy API for username-based conversation creation');
        
        const response = await messagesAPI.legacy.createConversation({ recipient_username: recipientUsername });
        const newConversation = response.data;
        
        console.log(`✅ New conversation created (legacy):`, newConversation);
        
        // Add the new conversation to the list
        setConversations(prev => [newConversation, ...prev]);
        setSelectedConversation(newConversation);
        console.log(`🎉 Ready to message ${recipientName || recipientUsername}!`);
        setLoading(false);
        return;
      }
      
      // Use new idempotent API with user ID
      const conversation = await messagesAPI.getOrCreateConversation(recipientId);
      
      console.log(`✅ Conversation retrieved/created:`, conversation);
      
      // Update conversations list if this is a new conversation
      setConversations(prev => {
        const exists = prev.find(conv => conv.conversation_id === conversation.conversation_id);
        if (exists) {
          return prev;
        }
        return [conversation, ...prev];
      });
      
      // Select the new conversation
      setSelectedConversation(conversation);
      
      // Show success message
      console.log(`🎉 Ready to message ${recipientName || recipientUsername}!`);
      
    } catch (error) {
      console.error('❌ Failed to create conversation:', error);
      
      // Show user-friendly error message
      if (error.response?.status === 404) {
        alert(`User "${recipientUsername}" not found. Please check the username.`);
      } else if (error.response?.status === 400) {
        alert('Cannot create conversation with this user. Please try again.');
      } else {
        alert('Failed to start conversation. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching conversations...');
      
      // Use the new conversations API endpoint
      const response = await messagesAPI.getConversations();
      const data = response.data || [];
      
      console.log('📥 Raw conversations data:', data);
      
      // Validate conversations - handle both old and new API structures during transition
      const validConversations = data.filter(conv => {
        // Check for new API structure first (conversation_id + participant)
        const hasNewStructure = conv.conversation_id && conv.participant && conv.participant.id && conv.participant.username;
        
        // Check for old API structure (id + other_participant) 
        const hasOldStructure = conv.id && conv.other_participant && conv.other_participant.id && conv.other_participant.username;
        
        const isValid = hasNewStructure || hasOldStructure;
        
        if (!isValid) {
          console.warn('⚠️ Filtered out invalid conversation (missing required fields):', conv);
        } else if (hasOldStructure && !hasNewStructure) {
          console.info('ℹ️ Using legacy conversation structure:', conv.id);
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
      console.log('🔄 Fetching messages for conversation:', conversationId);
      
      // Use the new messages API endpoint
      const response = await messagesAPI.getMessages(conversationId);
      console.log('📥 Raw messages response:', response);
      console.log('📥 Response data:', response?.data);
      console.log('📥 Response type:', typeof response);
      
      // Handle different response structures - new API returns direct array or paginated results
      let messagesData = [];
      
      // Try multiple ways to extract messages array
      if (response?.data?.results && Array.isArray(response.data.results)) {
        // Paginated response
        messagesData = response.data.results;
        console.log('✅ Found paginated messages in response.data.results:', messagesData.length);
      } else if (Array.isArray(response?.data)) {
        // Direct array response
        messagesData = response.data;
        console.log('✅ Found messages in response.data array:', messagesData.length);
      } else if (response?.data?.messages && Array.isArray(response.data.messages)) {
        // Legacy format
        messagesData = response.data.messages;
        console.log('✅ Found messages in response.data.results:', messagesData.length);
      } else if (Array.isArray(response?.data)) {
        messagesData = response.data;
        console.log('✅ Found messages in response.data:', messagesData.length);
      } else if (Array.isArray(response)) {
        messagesData = response;
        console.log('✅ Found messages in response:', messagesData.length);
      } else if (response?.messages && Array.isArray(response.messages)) {
        messagesData = response.messages;
        console.log('✅ Found messages in response.messages:', messagesData.length);
      } else {
        console.warn('⚠️ Could not find messages array in response structure');
        console.warn('⚠️ Full response structure:', JSON.stringify(response, null, 2));
        messagesData = [];
      }
      
      console.log('✅ Final messages data:', messagesData);
      setMessages(messagesData);
      
    } catch (error) {
      console.error('❌ Failed to fetch messages:', error);
      console.error('❌ Error details:', error.response?.data);
      // Always ensure messages is an array
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      console.log('📤 Sending message to conversation:', selectedConversation.id);
      console.log('📤 Message content:', newMessage.trim());
      console.log('📤 Reply to:', replyToMessage?.id);
      console.log('📤 User info:', user);
      
      // Prepare message data with reply support
      const messageData = {
        content: newMessage.trim(),
        reply_to_id: replyToMessage?.id || null
      };
      
      // Use the new messaging API endpoint
      const response = await messagesAPI.sendMessage(selectedConversation.conversation_id || selectedConversation.id, messageData);
      console.log('✅ Message sent successfully:', response);
      
      // Add message to local state - ensure messages is an array first
      const newMsg = {
        id: Date.now(), // Temporary ID
        sender: {
          username: user?.username,
          full_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username
        },
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
        is_read: true,
        reply_to: replyToMessage,
        reactions: [],
        delivered_to: []
      };
      
      // If the API response contains the created message, use that instead
      if (response?.data) {
        console.log('📨 Using API response message:', response.data);
        // Use the actual message from API response
        const apiMessage = response.data;
        newMsg.id = apiMessage.id || newMsg.id;
        newMsg.created_at = apiMessage.created_at || newMsg.created_at;
        newMsg.reply_to = apiMessage.reply_to || newMsg.reply_to;
        newMsg.reactions = apiMessage.reactions || [];
        newMsg.delivered_to = apiMessage.delivered_to || [];
      }
      
      // Safely update messages state
      setMessages(prevMessages => {
        const currentMessages = Array.isArray(prevMessages) ? prevMessages : [];
        console.log('💬 Adding message to conversation. Current count:', currentMessages.length);
        return [...currentMessages, newMsg];
      });
      
      setNewMessage('');
      setReplyToMessage(null);
      
      // Send via WebSocket for real-time updates
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'message',
          recipient_id: selectedConversation.other_participant.id,
          text: messageData.content,
          reply_to_id: messageData.reply_to_id
        }));
      }
      
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
      console.error('❌ Failed to send message:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      // Provide specific error messages based on status
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        console.error('🔧 400 Error Details:', errorData);
        
        if (errorData?.detail) {
          showToast(`Error: ${errorData.detail}`);
        } else if (errorData?.message) {
          showToast(`Error: ${errorData.message}`);
        } else {
          showToast('Invalid message format. Please try again.');
        }
      } else if (error.response?.status === 403) {
        showToast('You do not have permission to send messages to this conversation.');
      } else if (error.response?.status === 404) {
        showToast('Conversation not found. Please refresh and try again.');
      } else {
        showToast('Failed to send message. Please check your connection.');
      }
    }
  };

  const selectConversation = (conversation) => {
    console.log('🎯 Selecting conversation:', conversation);
    setSelectedConversation(conversation);
    
    // Clear previous messages before fetching new ones
    setMessages([]);
    
    // Use appropriate ID format for fetching messages
    const conversationId = conversation.conversation_id || conversation.id;
    fetchMessages(conversationId);
    
    // Mark as read
    if (conversation.unread_count > 0) {
      console.log('📖 Marking conversation as read, unread count:', conversation.unread_count);
      const conversationId = conversation.conversation_id || conversation.id;
      markAsRead(conversationId);
    }
  };

  // Function to go back to conversations list (mobile only)
  const goBackToConversations = () => {
    setSelectedConversation(null);
    setMessages([]);
  };

  const markAsRead = async (conversationId) => {
    try {
      // Use the new messaging API endpoint
      await messagesAPI.markAsRead(conversationId);
      
      // Send via WebSocket for real-time updates
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'mark_read',
          recipient_id: selectedConversation?.other_participant.id,
          conversation_id: conversationId
        }));
      }
      
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
        )
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Enhanced message interaction functions
  const handleReaction = async (messageId, reactionType) => {
    try {
      // Ensure messages is an array before using find
      if (!Array.isArray(messages)) {
        console.warn('⚠️ Messages is not an array:', typeof messages, messages);
        showToast('Unable to add reaction. Please refresh the page.');
        // Try to recover by resetting messages to empty array
        setMessages([]);
        return;
      }
      
      // Check if user already has this reaction to toggle it
      const currentMessage = messages.find(msg => msg.id === messageId);
      if (!currentMessage) {
        console.warn('⚠️ Message not found:', messageId);
        showToast('Message not found. Please refresh the page.');
        return;
      }
      
      // Safely check reactions array - ensure it's an array before using find
      const messageReactions = Array.isArray(currentMessage.reactions) ? currentMessage.reactions : [];
      const existingReaction = messageReactions.find(r => r && r.user && r.user.id === user?.id);
      const isRemovingReaction = existingReaction && existingReaction.reaction_type === reactionType;
      
      // Send reaction to backend API for persistence
      try {
        if (isRemovingReaction) {
          await messagesAPI.removeReaction(messageId);
          console.log('✅ Reaction removed from backend:', { messageId, reactionType });
        } else {
          await messagesAPI.addReaction(messageId, reactionType);
          console.log('✅ Reaction saved to backend:', { messageId, reactionType });
        }
      } catch (apiError) {
        console.error('❌ Failed to save reaction to backend:', apiError);
        showToast(`Failed to ${isRemovingReaction ? 'remove' : 'add'} reaction. Please try again.`);
        return; // Don't continue if backend fails
      }
      
      // Send reaction via WebSocket - use the format the backend expects
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: isRemovingReaction ? 'remove_reaction' : 'add_reaction',
          message_id: messageId,
          reaction_type: reactionType
        }));
      }
      
      // Update local state optimistically
      setMessages(prevMessages => {
        // Ensure prevMessages is an array
        if (!Array.isArray(prevMessages)) {
          console.warn('⚠️ Previous messages is not an array in state update:', typeof prevMessages, prevMessages);
          // Try to recover - if it's an object with messages property, use that
          if (prevMessages && typeof prevMessages === 'object' && Array.isArray(prevMessages.messages)) {
            console.log('🔧 Recovering messages from object property');
            return prevMessages.messages;
          }
          // Otherwise return empty array to prevent crashes
          return [];
        }
        
        return prevMessages.map(msg => {
          if (msg.id === messageId) {
            // Safely handle reactions array
            const reactions = Array.isArray(msg.reactions) ? msg.reactions : [];
            
            // Double-check each reaction object before using find
            const validReactions = reactions.filter(r => r && typeof r === 'object' && r.user);
            const existingReactionIndex = validReactions.findIndex(r => r.user?.id === user?.id);
            
            if (isRemovingReaction) {
              // Remove the reaction
              return {
                ...msg,
                reactions: validReactions.filter(r => r.user?.id !== user?.id)
              };
            } else if (existingReactionIndex >= 0) {
              // Update existing reaction to new type
              return {
                ...msg,
                reactions: validReactions.map(r => 
                  r.user?.id === user?.id 
                    ? { ...r, reaction_type: reactionType }
                    : r
                )
              };
            } else {
              // Add new reaction
              return {
                ...msg,
                reactions: [...validReactions, {
                  user: { id: user?.id, username: user?.username },
                  reaction_type: reactionType,
                  created_at: new Date().toISOString()
                }]
              };
            }
          }
          return msg;
        });
      });
      
      setShowReactionsMenu(null);
    } catch (error) {
      console.error('Failed to handle reaction:', error);
      showToast('Failed to handle reaction. Please try again.');
    }
  };

  const handleReplyToMessage = (message) => {
    setReplyToMessage(message);
    messageInputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyToMessage(null);
  };

  // Long press handlers for mobile interactions
  const handleMessageLongPress = (message) => {
    if (isMobile) {
      setShowReactionsMenu(message.id);
    }
  };

  const handleTouchStart = (message) => {
    const timer = setTimeout(() => {
      handleMessageLongPress(message);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Swipe to reply functionality (simplified)
  const handleSwipeToReply = (message) => {
    if (isMobile) {
      handleReplyToMessage(message);
    }
  };

  // Get user presence status
  const getUserStatus = (userId) => {
    const status = userStatuses[userId];
    if (!status) return 'offline';
    
    const lastSeen = new Date(status.last_seen);
    const now = new Date();
    const diffInMinutes = (now - lastSeen) / (1000 * 60);
    
    if (diffInMinutes < 5) return 'online';
    return 'offline';
  };

  // Format delivery status
  const getDeliveryStatus = (message) => {
    if (!message.delivered_to) return '';
    
    const deliveredCount = message.delivered_to.length;
    if (deliveredCount === 0) return '✓';
    return '✓✓';
  };

  // Get reactions summary
  const getReactionsSummary = (reactions) => {
    if (!reactions || reactions.length === 0) return null;
    
    const reactionCounts = {};
    reactions.forEach(reaction => {
      reactionCounts[reaction.reaction_type] = (reactionCounts[reaction.reaction_type] || 0) + 1;
    });
    
    return Object.entries(reactionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([emoji, count]) => `${emoji}${count > 1 ? count : ''}`);
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

  const filteredConversations = conversations.filter(conv => {
    // Handle both API structures for search
    const participant = conv.participant || conv.other_participant;
    const fullName = participant?.full_name || participant?.display_name;
    const username = participant?.username;
    
    return (
      fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      username?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

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

        <div className={`messages-container ${selectedConversation && isMobile ? 'conversation-selected' : ''}`}>
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
                filteredConversations.map(conversation => {
                  const userStatus = getUserStatus(conversation.other_participant.id);
                  return (
                    <div
                      key={conversation.id}
                      className={`conversation-item ${selectedConversation?.id === conversation.id ? 'active' : ''} ${conversation.unread_count > 0 ? 'unread' : ''}`}
                      onClick={() => selectConversation(conversation)}
                    >
                      <div className="conversation-avatar-container">
                        {(() => {
                          const participant = conversation.participant || conversation.other_participant;
                          const displayName = participant?.full_name || participant?.display_name || participant?.username;
                          return (
                            <>
                              <img
                                src={getAvatarUrl(participant)}
                                alt={displayName}
                                className="conversation-avatar"
                                onError={(e) => handleImageError(e, 'avatar')}
                              />
                              <div className={`presence-indicator ${userStatus}`}></div>
                            </>
                          );
                        })()}
                      </div>
                      <div className="conversation-info">
                        <div className="conversation-header">
                          {(() => {
                            const participant = conversation.participant || conversation.other_participant;
                            const displayName = participant?.full_name || participant?.display_name || participant?.username;
                            return <h4>{displayName}</h4>;
                          })()}
                          <span className="conversation-time">
                            {conversation.latest_message ? formatTime(conversation.latest_message.created_at) : ''}
                          </span>
                        </div>
                        <p className="last-message">
                          {conversation.latest_message?.content || conversation.latest_message?.body || 'No messages yet'}
                        </p>
                        {conversation.unread_count > 0 && (
                          <span className="unread-count">{conversation.unread_count}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="messages-area">
            {selectedConversation ? (
              <>
                <div className="messages-header-bar">
                  {isMobile && (
                    <button 
                      className="back-button"
                      onClick={goBackToConversations}
                      aria-label="Back to conversations"
                    >
                      ←
                    </button>
                  )}
                  <div className="participant-avatar-container">
                    {(() => {
                      const participant = selectedConversation.participant || selectedConversation.other_participant;
                      const displayName = participant?.full_name || participant?.display_name || participant?.username;
                      return (
                        <>
                          <img
                            src={getAvatarUrl(participant)}
                            alt={displayName}
                            className="participant-avatar"
                            onError={(e) => handleImageError(e, 'avatar')}
                          />
                          <div className={`presence-indicator ${getUserStatus(participant.id)}`}></div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="participant-info">
                    {(() => {
                      const participant = selectedConversation.participant || selectedConversation.other_participant;
                      const displayName = participant?.full_name || participant?.display_name || participant?.username;
                      const username = participant?.username;
                      return (
                        <>
                          <h3>{displayName}</h3>
                          <span className="participant-status">
                            @{username} • 
                            {getUserStatus(participant.id) === 'online' ? ' Online' : ' Offline'}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="messages-list">
                  {Array.isArray(messages) && messages.length > 0 ? (
                    <>
                      {messages.map(message => (
                        <div
                          key={message.id}
                          className={`message-wrapper ${message.sender.username === user?.username ? 'sent' : 'received'}`}
                          onTouchStart={() => handleTouchStart(message)}
                          onTouchEnd={handleTouchEnd}
                          onDoubleClick={() => !isMobile && setShowReactionsMenu(message.id)}
                        >
                          {/* Reply indicator */}
                          {message.reply_to && (
                            <div className="reply-indicator">
                              <div className="reply-line"></div>
                              <div className="reply-content">
                                <span className="reply-author">
                                  {message.reply_to.sender.full_name || message.reply_to.sender.username}
                                </span>
                                <span className="reply-text">
                                  {message.reply_to.content.length > 50 
                                    ? `${message.reply_to.content.substring(0, 50)}...`
                                    : message.reply_to.content
                                  }
                                </span>
                              </div>
                            </div>
                          )}
                          
                          <div className={`message ${message.sender.username === user?.username ? 'sent' : 'received'}`}>
                            <div className="message-content">
                              <p>{message.content}</p>
                              
                              {/* Message reactions */}
                              {message.reactions && message.reactions.length > 0 && (
                                <div className="message-reactions">
                                  {getReactionsSummary(message.reactions)?.map((reaction, index) => (
                                    <span key={index} className="reaction-bubble">
                                      {reaction}
                                    </span>
                                  ))}
                                </div>
                              )}
                              
                              <div className="message-meta">
                                <span className="message-time">
                                  {formatTime(message.created_at)}
                                </span>
                                {message.sender.username === user?.username && (
                                  <span className="delivery-status">
                                    {getDeliveryStatus(message)}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Message actions */}
                            <div className="message-actions">
                              <button 
                                className="action-btn reply-btn"
                                onClick={() => handleReplyToMessage(message)}
                                title="Reply"
                              >
                                ↩️
                              </button>
                              <button 
                                className="action-btn react-btn"
                                onClick={() => setShowReactionsMenu(
                                  showReactionsMenu === message.id ? null : message.id
                                )}
                                title="Add reaction"
                              >
                                😊
                              </button>
                            </div>
                            
                            {/* Reactions menu */}
                            {showReactionsMenu === message.id && (
                              <div className="reactions-menu">
                                {reactions.map(reaction => (
                                  <button
                                    key={reaction}
                                    className="reaction-option"
                                    onClick={() => handleReaction(message.id, reaction)}
                                  >
                                    {reaction}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  ) : (
                    <div className="empty-messages">
                      <p>No messages in this conversation yet</p>
                      <small>Send a message to start the conversation!</small>
                    </div>
                  )}
                </div>

                <form onSubmit={sendMessage} className="message-input-form">
                  {/* Reply preview */}
                  {replyToMessage && (
                    <div className="reply-preview">
                      <div className="reply-preview-content">
                        <div className="reply-preview-header">
                          <span>Replying to {replyToMessage.sender.full_name || replyToMessage.sender.username}</span>
                          <button 
                            type="button" 
                            className="cancel-reply"
                            onClick={cancelReply}
                          >
                            ×
                          </button>
                        </div>
                        <div className="reply-preview-text">
                          {replyToMessage.content.length > 100 
                            ? `${replyToMessage.content.substring(0, 100)}...`
                            : replyToMessage.content
                          }
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="message-input-container">
                    <input
                      ref={messageInputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={replyToMessage ? "Reply to message..." : "Type your message..."}
                      className="message-input"
                    />
                    <button type="submit" className="send-button" disabled={!newMessage.trim()}>
                      <span className="send-icon">➤</span>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="no-conversation-selected">
                <div className="empty-chat-state">
                  <h3>{isMobile ? 'Select a conversation' : 'Select a conversation'}</h3>
                  <p>{isMobile ? 'Choose a conversation to start messaging' : 'Choose a conversation from the sidebar to start messaging'}</p>
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
