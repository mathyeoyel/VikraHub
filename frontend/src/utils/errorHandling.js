// Enhanced error handling utilities
export const APIError = class extends Error {
  constructor(message, status, code, details = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
};

export const handleAPIError = (error, showNotification = null) => {
  let errorMessage = 'An unexpected error occurred';
  let errorDetails = null;

  if (error.response) {
    // Server responded with an error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        errorMessage = 'Invalid request. Please check your input.';
        if (data?.detail) errorMessage = data.detail;
        if (data?.errors) errorDetails = data.errors;
        break;
      case 401:
        errorMessage = 'Authentication required. Please log in.';
        break;
      case 403:
        errorMessage = 'You do not have permission to perform this action.';
        break;
      case 404:
        errorMessage = 'The requested resource was not found.';
        break;
      case 429:
        errorMessage = 'Too many requests. Please try again later.';
        break;
      case 500:
        errorMessage = 'Server error. Please try again later.';
        break;
      default:
        errorMessage = data?.detail || data?.message || `Server error (${status})`;
    }
  } else if (error.request) {
    // Network error or no response
    errorMessage = 'Network error. Please check your connection.';
  } else {
    // Other error
    errorMessage = error.message || 'An unexpected error occurred';
  }

  // Show notification if function is provided
  if (showNotification) {
    showNotification(errorMessage, { type: 'error' });
  }

  return new APIError(
    errorMessage, 
    error.response?.status || 0, 
    error.code, 
    errorDetails
  );
};

export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry client errors (4xx) except 429
      if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
        break;
      }
      
      // Wait before retrying
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
};

export const isOnline = () => navigator.onLine;

export const handleOfflineError = (showNotification = null) => {
  const message = 'You are currently offline. Please check your internet connection.';
  if (showNotification) {
    showNotification(message, { type: 'warning' });
  }
  return new APIError(message, 0, 'OFFLINE');
};

// Form validation helper
export const handleValidationErrors = (errors, setFieldErrors = null) => {
  const formattedErrors = {};
  
  if (typeof errors === 'object' && errors !== null) {
    Object.keys(errors).forEach(field => {
      const fieldErrors = Array.isArray(errors[field]) ? errors[field] : [errors[field]];
      formattedErrors[field] = fieldErrors.join(', ');
    });
  }
  
  if (setFieldErrors) {
    setFieldErrors(formattedErrors);
  }
  
  return formattedErrors;
};

// Success notification helper
export const handleAPISuccess = (message, showNotification = null) => {
  if (showNotification) {
    showNotification(message, { type: 'success' });
  }
};

export default {
  APIError,
  handleAPIError,
  retryRequest,
  isOnline,
  handleOfflineError,
  handleValidationErrors,
  handleAPISuccess
};
