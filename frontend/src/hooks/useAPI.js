import { useState, useCallback } from 'react';
import { useNotifications } from '../components/common/NotificationContext';
import { handleAPIError, retryRequest, isOnline, handleOfflineError } from '../utils/errorHandling';

export const useAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showError, showSuccess } = useNotifications();

  const executeRequest = useCallback(async (
    requestFn, 
    options = {}
  ) => {
    const {
      showSuccessMessage = null,
      showErrorNotification = true,
      retries = 0,
      onSuccess = null,
      onError = null
    } = options;

    // Check if online
    if (!isOnline()) {
      const offlineError = handleOfflineError(showErrorNotification ? showError : null);
      setError(offlineError);
      if (onError) onError(offlineError);
      return { data: null, error: offlineError };
    }

    setLoading(true);
    setError(null);

    try {
      const requestFunction = retries > 0 
        ? () => retryRequest(requestFn, retries)
        : requestFn;

      const response = await requestFunction();
      
      if (showSuccessMessage) {
        showSuccess(showSuccessMessage);
      }
      
      if (onSuccess) {
        onSuccess(response.data);
      }

      return { data: response.data, error: null };
    } catch (err) {
      const apiError = handleAPIError(err, showErrorNotification ? showError : null);
      setError(apiError);
      
      if (onError) {
        onError(apiError);
      }

      return { data: null, error: apiError };
    } finally {
      setLoading(false);
    }
  }, [showError, showSuccess]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    loading,
    error,
    executeRequest,
    reset
  };
};

// Hook for form submissions with validation
export const useFormSubmission = () => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const { showError, showSuccess } = useNotifications();

  const submitForm = useCallback(async (
    submitFn,
    options = {}
  ) => {
    const {
      successMessage = 'Form submitted successfully',
      onSuccess = null,
      onError = null,
      resetOnSuccess = true
    } = options;

    setLoading(true);
    setErrors({});
    setFieldErrors({});

    try {
      const response = await submitFn();
      
      if (resetOnSuccess) {
        setErrors({});
        setFieldErrors({});
      }
      
      showSuccess(successMessage);
      
      if (onSuccess) {
        onSuccess(response.data);
      }

      return { data: response.data, success: true };
    } catch (err) {
      const apiError = handleAPIError(err);
      
      // Handle validation errors
      if (err.response?.status === 400 && err.response?.data) {
        const validationErrors = err.response.data;
        setFieldErrors(validationErrors);
      } else {
        setErrors({ general: apiError.message });
        showError(apiError.message);
      }
      
      if (onError) {
        onError(apiError);
      }

      return { data: null, success: false, error: apiError };
    } finally {
      setLoading(false);
    }
  }, [showError, showSuccess]);

  const clearErrors = useCallback(() => {
    setErrors({});
    setFieldErrors({});
  }, []);

  return {
    loading,
    errors,
    fieldErrors,
    submitForm,
    clearErrors
  };
};

// Hook for paginated data
export const usePaginatedAPI = (fetchFn, dependencies = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const { showError } = useNotifications();

  const loadData = useCallback(async (pageNum = 1, reset = false) => {
    setLoading(true);
    if (reset) {
      setError(null);
      setData([]);
    }

    try {
      const response = await fetchFn(pageNum);
      const newData = response.data.results || response.data;
      
      setData(prev => reset ? newData : [...prev, ...newData]);
      setHasMore(!!response.data.next);
      setPage(pageNum);
    } catch (err) {
      const apiError = handleAPIError(err, showError);
      setError(apiError);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, showError]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadData(page + 1, false);
    }
  }, [loading, hasMore, page, loadData]);

  const refresh = useCallback(() => {
    loadData(1, true);
  }, [loadData]);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    page
  };
};

export default useAPI;
