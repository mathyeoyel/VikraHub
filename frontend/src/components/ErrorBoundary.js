import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Report error to monitoring service (if available)
    if (window.reportError) {
      window.reportError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      const { fallback: FallbackComponent } = this.props;
      
      if (FallbackComponent) {
        return (
          <FallbackComponent 
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onRetry={this.handleRetry}
          />
        );
      }

      // Default error UI
      return (
        <div style={{ 
          padding: '40px 20px', 
          background: '#f8f9fa', 
          border: '1px solid #dee2e6',
          borderRadius: '12px',
          margin: '20px',
          textAlign: 'center',
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ color: '#333', marginBottom: '16px' }}>Oops! Something went wrong</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            We apologize for the inconvenience. An unexpected error occurred.
          </p>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              onClick={this.handleRetry}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #ffa000, #ffb84d)',
                color: '#0a1628',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              Try Again
            </button>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              Reload Page
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '24px', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Error Details (Development Only)
              </summary>
              <div style={{ marginTop: '12px' }}>
                <h4>Error:</h4>
                <pre style={{ 
                  background: '#f1f3f4', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  fontSize: '12px',
                  overflow: 'auto'
                }}>
                  {this.state.error.toString()}
                </pre>
                
                <h4>Component Stack:</h4>
                <pre style={{ 
                  background: '#f1f3f4', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  fontSize: '12px',
                  overflow: 'auto'
                }}>
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = (Component, fallback) => {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

// Custom error fallback components
export const APIErrorFallback = ({ error, onRetry }) => (
  <div style={{
    padding: '24px',
    background: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '8px',
    textAlign: 'center',
    margin: '16px 0'
  }}>
    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🚫</div>
    <h3 style={{ color: '#856404', marginBottom: '8px' }}>Failed to load data</h3>
    <p style={{ color: '#856404', marginBottom: '16px' }}>
      We couldn't fetch the information you requested.
    </p>
    {onRetry && (
      <button 
        onClick={onRetry}
        style={{
          padding: '8px 16px',
          background: '#ffa000',
          color: '#0a1628',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: '600'
        }}
      >
        Retry
      </button>
    )}
  </div>
);

export const NetworkErrorFallback = ({ error, onRetry }) => (
  <div style={{
    padding: '24px',
    background: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '8px',
    textAlign: 'center',
    margin: '16px 0'
  }}>
    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📡</div>
    <h3 style={{ color: '#721c24', marginBottom: '8px' }}>Connection Problem</h3>
    <p style={{ color: '#721c24', marginBottom: '16px' }}>
      Please check your internet connection and try again.
    </p>
    {onRetry && (
      <button 
        onClick={onRetry}
        style={{
          padding: '8px 16px',
          background: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: '600'
        }}
      >
        Retry
      </button>
    )}
  </div>
);

export default ErrorBoundary;
