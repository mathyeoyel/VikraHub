// frontend/src/components/Chat/ChatButton.js
import React, { useState, useEffect } from 'react';
import ChatModal from './ChatModal';
import { userAPI } from '../../api';
import { handleImageError } from '../../utils/imageUtils';
import './ChatButton.css';

const ChatButton = ({ 
  user, 
  recipientUsername, 
  recipientName, 
  recipientId,
  buttonText = "Message", 
  className = "", 
  variant = "primary",
  size = "medium"
}) => {
  const [showChatModal, setShowChatModal] = useState(false);
  const [fetchedRecipientId, setFetchedRecipientId] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch recipient data based on username if recipientId is not provided
  useEffect(() => {
    if (recipientUsername && !recipientId) {
      const fetchRecipientData = async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await userAPI.getUserByUsername(recipientUsername);
          if (response.data && response.data.id) {
            setFetchedRecipientId(response.data.id);
          } else {
            console.error("Recipient not found for username:", recipientUsername);
            setError("Recipient not found");
          }
        } catch (err) {
          console.error("Failed to fetch recipient data:", err);
          setError("Failed to load recipient data");
        } finally {
          setLoading(false);
        }
      };

      fetchRecipientData();
    }
  }, [recipientUsername, recipientId]);

  // Create a proper user object for the chat modal
  const getRecipientUser = () => {
    // If user object is provided directly, use it
    if (user && user.id && user.username) {
      return {
        ...user,
        id: parseInt(user.id) // Ensure ID is numeric
      };
    }
    
    // Use provided recipientId or fetched one
    const finalRecipientId = recipientId || fetchedRecipientId;
    
    // If individual props are provided, construct user object
    if (recipientUsername && finalRecipientId) {
      const numericId = parseInt(finalRecipientId);
      if (isNaN(numericId)) {
        console.error("ChatButton: recipientId must be numeric:", finalRecipientId);
        return null;
      }
      
      return {
        id: numericId, // Always use numeric ID
        username: recipientUsername,
        full_name: recipientName || recipientUsername,
        avatar: null // Will use default avatar generation
      };
    }
    
    if (!loading && !error) {
      console.error("ChatButton: Missing recipient info or invalid ID", { 
        user, 
        recipientUsername, 
        recipientName, 
        recipientId, 
        fetchedRecipientId 
      });
    }
    return null;
  };

  const recipientUser = getRecipientUser();

  const handleChatClick = () => {
    if (!recipientUser) {
      console.warn("Cannot open chat: Missing recipient information or recipient ID not yet loaded");
      return;
    }
    setShowChatModal(true);
  };

  // Note: Global image error handler (handleImageError) is available 
  // from utils/imageUtils for any images that need fallback support

  // Size-based styling
  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'chat-button-small';
      case 'large': return 'chat-button-large';
      default: return 'chat-button-medium';
    }
  };

  // Show loading state
  if (loading) {
    return (
      <button 
        className={`chat-button chat-button-${variant} ${getSizeClass()} ${className}`}
        disabled
      >
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="currentColor"
          className="chat-icon spinning"
        >
          <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
        </svg>
        Loading...
      </button>
    );
  }

  // Show error state
  if (error) {
    return (
      <button 
        className={`chat-button chat-button-disabled ${getSizeClass()} ${className}`}
        disabled
        title={`Error: ${error}`}
      >
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="currentColor"
          className="chat-icon"
        >
          <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"/>
        </svg>
        Unavailable
      </button>
    );
  }

  return (
    <>
      <button 
        onClick={handleChatClick}
        className={`chat-button chat-button-${variant} ${getSizeClass()} ${className}`}
        title={`Send a message to ${recipientUser?.full_name || recipientUser?.username || 'user'}`}
        disabled={!recipientUser}
      >
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="currentColor"
          className="chat-icon"
        >
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
        {buttonText}
      </button>
      
      {recipientUser && (
        <ChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          recipientUser={recipientUser}
        />
      )}
    </>
  );
};

export default ChatButton;
