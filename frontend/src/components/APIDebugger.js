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
      console.log('Environment variables:', {
        REACT_APP_API_URL: process.env.REACT_APP_API_URL,
        NODE_ENV: process.env.NODE_ENV
      });
      
      setStatus(prev => ({ ...prev, backendUrl }));

      try {
        // Test basic API connectivity
        console.log('Testing API connectivity to:', backendUrl);
        
        // First try the root endpoint
        let response = await fetch(`${backendUrl}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('Root API response status:', response.status);

        if (!response.ok) {
          // Try the backend root (without /api/)
          const backendRoot = backendUrl.replace('/api/', '/');
          console.log('Trying backend root:', backendRoot);
          
          response = await fetch(backendRoot, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          console.log('Backend root response status:', response.status);
        }

        if (response.ok) {
          const data = await response.json();
          console.log('API response data:', data);
          setStatus(prev => ({ 
            ...prev, 
            apiTest: 'Success - API is reachable',
            corsTest: 'Success - CORS working'
          }));
        } else {
          const errorText = await response.text();
          console.log('Error response text:', errorText);
          setStatus(prev => ({ 
            ...prev, 
            apiTest: `Failed - Status: ${response.status}`,
            corsTest: response.status === 404 ? 'API endpoint not found' : 'CORS may be failing'
          }));
        }
      } catch (error) {
        console.error('API test error:', error);
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
