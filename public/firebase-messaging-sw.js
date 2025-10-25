// Firebase Cloud Messaging Service Worker
// Firebase Cloud Messaging Service Worker

// Import Firebase SDKs (ES6 module style)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAUDY7ty75NHqwfmT4xGiTeJj3f5VT0Duc",
  authDomain: "rec-time-593b0.firebaseapp.com",
  projectId: "rec-time-593b0",
  storageBucket: "rec-time-593b0.firebasestorage.app",
  messagingSenderId: "885151050655",
  appId: "1:885151050655:web:873c0e58da98316a4fabaa",
  measurementId: "G-5YRL3CV57Z"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// FCM messaging instance
const messaging = firebase.messaging();

// Background message handling
// Purpose: When FCM sends push notifications from backend, display them
// in the same format as existing Service Worker notifications
// even when app is in background/terminated state
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'RecTime 通知設定';
  const notificationOptions = {
    body: payload.notification?.body || '新しい通知があります',
    icon: '/icons/pwa-192.png',
    badge: '/icons/pwa-192.png',
    tag: payload.data?.eventId || 'fcm-background-notification',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: payload.data || {},
    actions: [
      {
        action: 'open',
        title: 'アプリを開く',
        icon: '/icons/pwa-192.png'
      },
      {
        action: 'close',
        title: '閉じる'
      }
    ]
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[FCM] Notification clicked:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Open app or focus
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Notification close handling
self.addEventListener('notificationclose', (event) => {
  console.log('[FCM] Notification closed:', event);
});

console.log('[FCM] Service Worker initialized');
