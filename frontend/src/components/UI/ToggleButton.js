import React, { useState, useCallback } from 'react';
import { useAuth } from '../Auth/AuthContext';
import './ToggleButton.css';

/**
 * Reusable toggle button component for any action that has two states
 * (like/unlike, follow/unfollow, subscribe/unsubscribe, etc.)
 */
const ToggleButton = ({
  // Content & State
  id,
  initialState = false,
  initialCount = 0,
  
  // Button Text & Icons
  activeText = 'Active',
  inactiveText = 'Inactive',
  activeIcon = '✓',
  inactiveIcon = '○',
  loadingIcon = '⟳',
  
  // API Functions
  activateAPI, // Function to call when activating (e.g., like, follow)
  deactivateAPI, // Function to call when deactivating (e.g., unlike, unfollow)
  
  // Styling & Behavior
  size = 'medium', // 'small', 'medium', 'large'
  variant = 'default', // 'default', 'primary', 'secondary', 'outline'
  showCount = false,
  showIcon = true,
  showText = true,
  disabled = false,
  requireAuth = true,
  
  // Callbacks
  onStateChange,
  onError,
  
  // Additional props
  className = '',
  title,
  ariaLabel,
  ...props
}) => {
  const { isAuthenticated } = useAuth();
  const [isActive, setIsActive] = useState(initialState);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Check authentication if required
    if (requireAuth && !isAuthenticated) {
      const action = isActive ? 'deactivate' : 'activate';
      alert(`Please log in to ${action} this content`);
      return;
    }

    if (isLoading || disabled) return;

    // Store previous state for rollback
    const previousState = isActive;
    const previousCount = count;

    // Optimistically update UI
    const newState = !isActive;
    setIsActive(newState);
    setIsLoading(true);

    // Update count optimistically if showCount is enabled
    if (showCount) {
      setCount(prev => newState ? prev + 1 : Math.max(0, prev - 1));
    }

    try {
      // Choose the appropriate API function
      const apiFunction = newState ? activateAPI : deactivateAPI;
      
      if (!apiFunction) {
        throw new Error(`API function not provided for ${newState ? 'activation' : 'deactivation'}`);
      }

      const response = await apiFunction(id);
      
      // Handle different response structures
      let actualState = newState;
      let actualCount = count;

      if (response && typeof response === 'object') {
        // Handle response with status field
        if (response.status) {
          actualState = response.status === 'liked' || 
                       response.status === 'followed' || 
                       response.status === 'active';
        }
        
        // Handle response with count field
        if (typeof response.count === 'number') {
          actualCount = response.count;
        } else if (typeof response.like_count === 'number') {
          actualCount = response.like_count;
        } else if (typeof response.follow_count === 'number') {
          actualCount = response.follow_count;
        }

        // Handle response data wrapper
        if (response.data) {
          if (response.data.status) {
            actualState = response.data.status === 'liked' || 
                         response.data.status === 'followed' || 
                         response.data.status === 'active';
          }
          if (typeof response.data.count === 'number') {
            actualCount = response.data.count;
          } else if (typeof response.data.like_count === 'number') {
            actualCount = response.data.like_count;
          } else if (typeof response.data.follow_count === 'number') {
            actualCount = response.data.follow_count;
          }
        }
      }

      // Update final state
      setIsActive(actualState);
      if (showCount) {
        setCount(actualCount);
      }

      // Notify parent component
      if (onStateChange) {
        onStateChange({
          id,
          isActive: actualState,
          count: actualCount,
          previousState,
          previousCount
        });
      }

    } catch (error) {
      console.error('Error toggling state:', error);
      
      // Rollback optimistic updates
      setIsActive(previousState);
      if (showCount) {
        setCount(previousCount);
      }

      // Handle error
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          `Failed to ${newState ? 'activate' : 'deactivate'}. Please try again.`;
      
      if (onError) {
        onError(error, errorMessage);
      } else {
        alert(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    isActive, count, isLoading, disabled, requireAuth, isAuthenticated,
    id, activateAPI, deactivateAPI, showCount, onStateChange, onError
  ]);

  const getButtonClass = useCallback(() => {
    let baseClass = `toggle-button toggle-button--${size} toggle-button--${variant}`;
    
    if (isActive) baseClass += ' toggle-button--active';
    if (isLoading) baseClass += ' toggle-button--loading';
    if (disabled) baseClass += ' toggle-button--disabled';
    if (className) baseClass += ` ${className}`;
    
    return baseClass;
  }, [size, variant, isActive, isLoading, disabled, className]);

  const formatCount = useCallback((num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }, []);

  const buttonTitle = title || (isActive ? 
    `${activeText} (click to ${inactiveText.toLowerCase()})` : 
    `${inactiveText} (click to ${activeText.toLowerCase()})`
  );

  const buttonAriaLabel = ariaLabel || 
    `${isActive ? activeText : inactiveText}. Click to ${isActive ? inactiveText.toLowerCase() : activeText.toLowerCase()}`;

  return (
    <button
      onClick={handleToggle}
      className={getButtonClass()}
      disabled={isLoading || disabled}
      title={buttonTitle}
      aria-label={buttonAriaLabel}
      aria-pressed={isActive}
      {...props}
    >
      {showIcon && (
        <span className="toggle-button__icon">
          {isLoading ? loadingIcon : (isActive ? activeIcon : inactiveIcon)}
        </span>
      )}
      
      {showText && (
        <span className="toggle-button__text">
          {isLoading ? 'Loading...' : (isActive ? activeText : inactiveText)}
        </span>
      )}
      
      {showCount && (
        <span className="toggle-button__count">
          {formatCount(count)}
        </span>
      )}
    </button>
  );
};

export default ToggleButton;
