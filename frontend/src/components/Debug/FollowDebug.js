// frontend/src/components/Debug/FollowDebug.js
import React, { useState } from 'react';
import { useFollow } from '../../hooks/useFollow';
import { followAPI } from '../../api';

/**
 * Debug component to test follow functionality
 */
const FollowDebug = () => {
  const [targetUserId, setTargetUserId] = useState('2');
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const {
    isFollowing,
    followersCount,
    isLoading,
    error,
    refreshFollowStatus
  } = useFollow(targetUserId);

  const testApiDirectly = async () => {
    setLoading(true);
    try {
      const response = await followAPI.getFollowStats(targetUserId);
      setApiResponse(response.data);
      console.log('Direct API call result:', response.data);
    } catch (error) {
      console.error('Direct API call failed:', error);
      setApiResponse({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      padding: '20px', 
      border: '2px solid #ccc',
      borderRadius: '8px',
      zIndex: 9999,
      maxWidth: '400px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <h3>🔍 Follow Debug Panel</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <label>Target User ID: </label>
        <input 
          type="number" 
          value={targetUserId} 
          onChange={(e) => setTargetUserId(e.target.value)}
          style={{ marginLeft: '10px', padding: '5px' }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>React Query Hook Results:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>isFollowing: {isFollowing ? '✅ True' : '❌ False'}</li>
          <li>followersCount: {followersCount}</li>
          <li>isLoading: {isLoading ? '⏳ True' : '✅ False'}</li>
          <li>error: {error ? '❌ ' + error.message : '✅ None'}</li>
        </ul>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={testApiDirectly} 
          disabled={loading}
          style={{ 
            padding: '8px 16px', 
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {loading ? '⏳ Testing...' : '🧪 Test API Directly'}
        </button>
        
        <button 
          onClick={refreshFollowStatus}
          style={{ 
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh Cache
        </button>
      </div>

      {apiResponse && (
        <div style={{ marginTop: '10px' }}>
          <strong>Direct API Response:</strong>
          <pre style={{ 
            fontSize: '12px', 
            background: '#f8f9fa', 
            padding: '10px', 
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '200px'
          }}>
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        💡 This debug panel helps identify follow state issues
      </div>
    </div>
  );
};

export default FollowDebug;
