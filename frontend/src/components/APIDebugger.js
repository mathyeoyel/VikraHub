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
      const backendUrl = process.env.REACT_APP_API_URL || 'https://api.vikrahub.com/api/';
      console.log('Environment variables:', {
        REACT_APP_API_URL: process.env.REACT_APP_API_URL,
        NODE_ENV: process.env.NODE_ENV,
        USED_URL: backendUrl
      });
      
      setStatus(prev => ({ ...prev, backendUrl }));

      try {
        console.log('Testing API connectivity to:', backendUrl);
        
        const response = await fetch(`${backendUrl}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('API response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('API response data:', data);
          
          setStatus(prev => ({
            ...prev,
            apiTest: 'Success - API is reachable',
            corsTest: 'Success - CORS working',
            error: null
          }));
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error('API test error:', error);
        setStatus(prev => ({
          ...prev,
          apiTest: `Failed - ${error.message}`,
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
      background: 'white',
      border: '1px solid #ccc',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h4>API Debug Info</h4>
      <div><strong>Backend URL:</strong> {status.backendUrl}</div>
      <div><strong>API Test:</strong> <span style={{color: status.apiTest.includes('Success') ? 'green' : 'red'}}>{status.apiTest}</span></div>
      <div><strong>CORS Test:</strong> <span style={{color: status.corsTest.includes('Success') ? 'green' : 'red'}}>{status.corsTest}</span></div>
      {status.error && (
        <div><strong>Error:</strong> <span style={{color: 'red'}}>{status.error}</span></div>
      )}
    </div>
  );
};

export default APIDebugger;
