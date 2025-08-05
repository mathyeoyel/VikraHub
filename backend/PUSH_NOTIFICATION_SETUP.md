# Environment Variables for Notification System

# Add these to your .env file for push notification support

# Firebase Cloud Messaging (for iOS/Android push notifications)
FCM_SERVER_KEY=your_fcm_server_key_here

# Web Push Notifications (VAPID keys)
VAPID_PRIVATE_KEY=your_vapid_private_key_here
VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_EMAIL=mailto:admin@vikrahub.com

# Instructions:

## 1. Firebase Cloud Messaging Setup:
# - Go to Firebase Console (https://console.firebase.google.com/)
# - Create a new project or use existing one
# - Go to Project Settings > Cloud Messaging
# - Copy the Server key and set it as FCM_SERVER_KEY

## 2. VAPID Keys for Web Push:
# Generate VAPID keys using:
# npx web-push generate-vapid-keys
# 
# Or using Python:
# from pywebpush import webpush
# vapid_keys = webpush.generate_vapid_keys()
# print("Private Key:", vapid_keys['private_key'])
# print("Public Key:", vapid_keys['public_key'])

## 3. Frontend Integration:
# - Add VAPID_PUBLIC_KEY to your frontend environment
# - Implement service worker for web push notifications
# - Register device tokens with the /api/devices/ endpoint

## 4. Testing:
# - Use the /api/devices/test_push/ endpoint to test notifications
# - Check browser console for registration success/errors
# - Verify notifications appear in browser/mobile device
