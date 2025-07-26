// frontend/src/components/Chat/ChatButton.js
import React, { useState } from 'react';
import ChatModal from './ChatModal';
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

  // Create a proper user object for the chat modal
  const getRecipientUser = () => {
    // If user object is provided directly, use it
    if (user && user.id && user.username) {
      return user;
    }
    
    // If individual props are provided, construct user object
    if (recipientUsername) {
      return {
        id: recipientId || recipientUsername, // Use ID if available, fallback to username
        username: recipientUsername,
        full_name: recipientName || recipientUsername,
        avatar: null // Will use default avatar generation
      };
    }
    
    console.error("ChatButton: Missing recipient info", { user, recipientUsername, recipientName, recipientId });
    return null;
  };

  const recipientUser = getRecipientUser();

  const handleChatClick = () => {
    if (!recipientUser) {
      console.error("Cannot open chat: Missing recipient information");
      return;
    }
    setShowChatModal(true);
  };

  // Size-based styling
  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'chat-button-small';
      case 'large': return 'chat-button-large';
      default: return 'chat-button-medium';
    }
  };

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
