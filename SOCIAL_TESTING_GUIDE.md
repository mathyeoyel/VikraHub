# 🧪 VikraHub Social Features Testing Guide

## 🎯 **Complete Testing Checklist**

### **1. Follow System Testing**

#### **Backend API Testing**
```bash
# Test follow endpoint
curl -X POST http://localhost:8000/api/follow/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"target_user_id": 2}'

# Test unfollow endpoint  
curl -X POST http://localhost:8000/api/unfollow/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"target_user_id": 2}'

# Test followers list
curl -X GET http://localhost:8000/api/followers/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test following list
curl -X GET http://localhost:8000/api/following/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **Frontend Component Testing**
1. **Navigate to Dashboard → Social Tab**
2. **Test FollowButton Component:**
   - Click "Follow" button on user suggestions
   - Verify button changes to "Following"
   - Click "Following" to unfollow
   - Check real-time updates

3. **Test FollowStats Component:**
   - Verify follower/following counts update immediately
   - Check stats display correctly

4. **Test FollowNotifications:**
   - Follow another user
   - Check if notification appears in real-time
   - Verify notification shows correct user info

### **2. Messaging System Testing**

#### **WebSocket Connection Testing**
1. **Open Browser Console**
2. **Check WebSocket Logs:**
   ```javascript
   // Should see in console:
   "Connecting to WebSocket: ws://domain/ws/messaging/"
   "WebSocket connected successfully" 
   "WebSocket connection established for user: username"
   ```

#### **Real-time Messaging Testing**
1. **Navigate to Dashboard → Social → Messages Tab**
2. **Send Test Messages:**
   - Type and send a message
   - Verify instant delivery (no page refresh needed)
   - Check message appears in conversation history

3. **Multi-user Testing (if possible):**
   - Open app in two different browsers/users
   - Send message from one user
   - Verify other user receives it instantly

### **3. Activity Feed Testing**

#### **Real-time Activity Updates**
1. **Navigate to Dashboard → Social → Activity Feed**
2. **Test Activity Types:**
   - Follow a user → Check "follow" activity appears
   - Send a message → Check "message" activity appears
   - Update profile → Check "profile_update" activity appears

3. **Connection Status:**
   - Verify "🟢 Live" indicator when WebSocket connected
   - Check "🔴 Offline" when disconnected

### **4. User Discovery Testing**

#### **User Suggestions**
1. **Check UserSuggestions Component:**
   - Verify suggested users appear
   - Test follow buttons on suggestions
   - Click "🔄 Refresh suggestions"

#### **Search Functionality**
1. **Navigate to Discover Tab:**
   - Use search bar to find users
   - Test search results display
   - Follow users from search results

### **5. Social Dashboard Integration**

#### **Tab Navigation Testing**
1. **Test All Dashboard Tabs:**
   - **Activity Feed:** Check real-time updates
   - **Discover:** Test user search and suggestions
   - **Messages:** Verify messaging interface
   - **Network:** Check follower/following management

2. **Quick Actions:**
   - Click floating "💬" button (new message)
   - Click floating "👤+" button (find people)

### **6. Real-time Notifications Testing**

#### **WebSocket Events Testing**
1. **Follow System Events:**
   ```javascript
   // Expected WebSocket messages:
   {
     "type": "follow_notification",
     "data": {
       "follower": "username",
       "message": "username started following you"
     }
   }
   ```

2. **Message Events:**
   ```javascript
   {
     "type": "new_message", 
     "data": {
       "sender": "username",
       "message": "Hello!",
       "conversation_id": 123
     }
   }
   ```

### **7. Error Handling Testing**

#### **Connection Issues**
1. **Disconnect Internet:**
   - Verify graceful WebSocket disconnection
   - Check reconnection attempts (max 5)
   - Test offline UI indicators

2. **API Failures:**
   - Test with invalid tokens
   - Verify error messages display
   - Check fallback behaviors

### **8. Performance Testing**

#### **Load Testing**
1. **Multiple Users:**
   - Test with multiple users following each other
   - Verify real-time updates don't lag
   - Check memory usage in browser

2. **Message Volume:**
   - Send multiple messages quickly
   - Verify all messages are delivered
   - Check UI performance

## 🚀 **Expected Results**

### **✅ Success Indicators:**
- **WebSocket Connection:** "🟢 Live" status in Activity Feed
- **Real-time Updates:** Immediate UI updates without page refresh
- **Follow System:** Instant follow/unfollow with proper state changes
- **Messaging:** Instant message delivery and display
- **Notifications:** Real-time follow notifications
- **User Discovery:** Working search and suggestions
- **Error Handling:** Graceful fallbacks and reconnection

### **❌ Issues to Watch For:**
- WebSocket connection failures
- Delayed or missing real-time updates
- UI state inconsistencies
- Memory leaks from unclosed connections
- API authentication errors
- Missing error messages

## 🔧 **Debugging Tools**

### **Browser Console Commands:**
```javascript
// Check WebSocket status
console.log(window.webSocketContext?.isConnected);

// Monitor WebSocket messages
window.addEventListener('message', console.log);

// Check React contexts
console.log(window.React?.useContext);
```

### **Django Admin Testing:**
1. **Access Admin Panel:** `/admin/`
2. **Check Models:**
   - **Follow objects:** Verify follow relationships
   - **FollowNotification objects:** Check notification creation
   - **User profiles:** Verify user data

3. **Test Data Creation:**
   - Create test users in admin
   - Manually create follow relationships
   - Verify data appears in frontend

## 🎉 **Complete Integration Test**

### **End-to-End User Journey:**
1. **Login** to VikraHub
2. **Navigate** to Dashboard → Social
3. **Discover** users via search or suggestions
4. **Follow** 2-3 users
5. **Check** real-time follow notifications
6. **Send** direct messages
7. **Verify** instant message delivery
8. **Check** Activity Feed for all activities
9. **Test** connection indicators
10. **Logout** and verify cleanup

**Expected Timeline:** 10-15 minutes for complete testing

---

## 📋 **Testing Checklist**

- [ ] Backend API endpoints working
- [ ] WebSocket connection established
- [ ] Follow/unfollow functionality
- [ ] Real-time follow notifications
- [ ] Instant messaging system
- [ ] Activity feed updates
- [ ] User discovery and search
- [ ] Social dashboard navigation
- [ ] Error handling and reconnection
- [ ] Performance under load
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility

**Your VikraHub social platform is ready for comprehensive testing!** 🎊
