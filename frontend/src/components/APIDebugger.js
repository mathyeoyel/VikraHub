import React, { useState, useEffect } from 'react';

const APIDebugger = () => {
  const [status, setStatus] = useState({
    backendUrl: '',
    apiTest: 'Testing...',
    corsTest: 'Testing...',
    error: null
  });

  useEffect(() => {
    const testAPI = async () => {
      const backendUrl = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/';
      setStatus(prev => ({ ...prev, backendUrl }));

      try {
        // Test basic API connectivity
        const response = await fetch(`${backendUrl}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStatus(prev => ({ 
            ...prev, 
            apiTest: 'Success - API is reachable',
            corsTest: 'Success - CORS working'
          }));
        } else {
          setStatus(prev => ({ 
            ...prev, 
            apiTest: `Failed - Status: ${response.status}`,
            corsTest: response.status === 404 ? 'API endpoint not found' : 'CORS may be failing'
          }));
        }
      } catch (error) {
        setStatus(prev => ({ 
          ...prev, 
          apiTest: 'Failed - Network error',
          corsTest: 'Failed - Likely CORS issue',
          error: error.message
        }));
      }
    };

    testAPI();
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: '#fff', 
      border: '1px solid #ccc', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>API Debug Info</h4>
      <p><strong>Backend URL:</strong> {status.backendUrl}</p>
      <p><strong>API Test:</strong> {status.apiTest}</p>
      <p><strong>CORS Test:</strong> {status.corsTest}</p>
      {status.error && <p><strong>Error:</strong> {status.error}</p>}
    </div>
  );
};

export default APIDebugger;
