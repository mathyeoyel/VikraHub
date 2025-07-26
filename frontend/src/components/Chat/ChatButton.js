// frontend/src/components/Chat/ChatButton.js
import React, { useState } from 'react';
import ChatModal from './ChatModal';
import './ChatButton.css';

const ChatButton = ({ user, buttonText = "Message", className = "", variant = "primary" }) => {
  const [showChatModal, setShowChatModal] = useState(false);

  const handleChatClick = () => {
    setShowChatModal(true);
  };

  return (
    <>
      <button 
        onClick={handleChatClick}
        className={`chat-button chat-button-${variant} ${className}`}
        title={`Send a message to ${user?.full_name || user?.username}`}
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
      
      <ChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        recipientUser={user}
      />
    </>
  );
};

export default ChatButton;
