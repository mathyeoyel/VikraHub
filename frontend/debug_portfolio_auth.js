// Debug Portfolio Authentication Issue
// Run this in browser console to debug the 403 error

console.log('🔍 Debugging Portfolio Authentication Issue...');

// Check if user is logged in
const token = localStorage.getItem('access_token');
const user = JSON.parse(localStorage.getItem('user') || 'null');

console.log('Authentication Status:', {
  hasToken: !!token,
  tokenExists: token ? true : false,
  tokenLength: token ? token.length : 0,
  user: user,
  userId: user?.id,
  username: user?.username
});

// Check the portfolio item we're trying to edit
const portfolioItemId = 10;
console.log(`Trying to edit portfolio item ${portfolioItemId}`);

// Make a test request to see what the server responds with
fetch(`https://api.vikrahub.com/api/portfolio/${portfolioItemId}/`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Portfolio Item Data:', data);
  console.log('Item Owner:', data.user);
  console.log('Current User:', user);
  console.log('Ownership Match:', data.user?.id === user?.id);
})
.catch(error => console.error('Error fetching portfolio item:', error));

// Try to get current user profile
fetch('https://api.vikrahub.com/api/users/me/', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
})
.then(data => {
  console.log('Current User Profile:', data);
  console.log('Profile vs LocalStorage match:', data.id === user?.id);
})
.catch(error => console.error('Error fetching user profile:', error));
