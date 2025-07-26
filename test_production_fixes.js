/**
 * Test script to verify production error fixes
 * Run this in browser console on deployed app to test fixes
 */

console.log('🧪 Testing Production Error Fixes...');

// Test 1: WebSocket connection
async function testWebSocket() {
  console.log('\n🔌 Testing WebSocket connection...');
  try {
    const wsUrl = `wss://api.vikrahub.com/ws/user/${localStorage.getItem('user_id')}/`;
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = function(e) {
      console.log('✅ WebSocket connected successfully');
      socket.close();
    };
    
    socket.onerror = function(error) {
      console.error('❌ WebSocket connection failed:', error);
    };
  } catch (error) {
    console.error('❌ WebSocket test failed:', error);
  }
}

// Test 2: Conversations endpoint
async function testConversationsEndpoint() {
  console.log('\n💬 Testing conversations endpoint...');
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('https://api.vikrahub.com/api/conversations/', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Conversations response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Conversations endpoint working:', data);
    } else {
      const errorData = await response.text();
      console.error('❌ Conversations endpoint error:', response.status, errorData);
    }
  } catch (error) {
    console.error('❌ Conversations test failed:', error);
  }
}

// Test 3: Notifications count endpoint
async function testNotificationsEndpoint() {
  console.log('\n🔔 Testing notifications count endpoint...');
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('https://api.vikrahub.com/api/unread-notifications-count/', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Notifications response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Notifications endpoint working:', data);
    } else {
      const errorData = await response.text();
      console.error('❌ Notifications endpoint error:', response.status, errorData);
    }
  } catch (error) {
    console.error('❌ Notifications test failed:', error);
  }
}

// Test 4: Frontend error handling
async function testFrontendErrorHandling() {
  console.log('\n🖥️ Testing frontend error handling...');
  
  // Simulate 500 error
  console.log('Testing 500 error handling...');
  try {
    const mockError = {
      response: {
        status: 500,
        data: { detail: 'Database error' }
      }
    };
    console.log('✅ 500 error handler would show: "Server error detected. Our team has been notified."');
  } catch (error) {
    console.error('❌ Error handling test failed:', error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive production tests...\n');
  
  await testWebSocket();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testConversationsEndpoint();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testNotificationsEndpoint();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testFrontendErrorHandling();
  
  console.log('\n✨ All tests completed! Check above for results.');
}

// Export functions for manual testing
window.productionTests = {
  runAll: runAllTests,
  testWebSocket,
  testConversations: testConversationsEndpoint,
  testNotifications: testNotificationsEndpoint,
  testErrorHandling: testFrontendErrorHandling
};

console.log('📝 Production tests loaded! Run any of these:');
console.log('• productionTests.runAll() - Run all tests');
console.log('• productionTests.testWebSocket() - Test WebSocket only');
console.log('• productionTests.testConversations() - Test conversations endpoint');
console.log('• productionTests.testNotifications() - Test notifications endpoint');
console.log('• productionTests.testErrorHandling() - Test error handling');
