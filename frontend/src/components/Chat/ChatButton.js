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
    // ✨ Enhanced recipient validation as requested
    const finalRecipientId = recipientId || fetchedRecipientId;
    
    if (!finalRecipientId) {
      console.warn("❌ Missing recipientId, aborting chat send.");
      console.warn("ChatButton validation failed:", {
        recipientId,
        fetchedRecipientId,
        recipientUsername,
        recipientName,
        loading,
        error
      });
      return;
    }

    if (!recipientUser || !recipientUser.id) {
      console.warn("❌ Cannot open chat: Missing recipient information or recipient ID not yet loaded");
      console.warn("Recipient user validation failed:", recipientUser);
      return;
    }

    // Additional validation for numeric ID
    const numericId = parseInt(finalRecipientId);
    if (isNaN(numericId)) {
      console.warn("❌ Invalid recipient ID (not numeric):", finalRecipientId);
      return;
    }

    console.log("✅ ChatButton validation passed, opening chat modal");
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
        <i className="fas fa-spinner chat-icon spinning"></i>
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
        <i className="fas fa-times chat-icon"></i>
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
        <i className="fas fa-comments chat-icon"></i>
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
