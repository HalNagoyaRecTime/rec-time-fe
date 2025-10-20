// Firebase Cloud Messaging Service Worker
// Firebase Cloud Messaging Service Worker

// Firebase SDKs를 import (ES6 모듈 방식)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyAUDY7ty75NHqwfmT4xGiTeJj3f5VT0Duc",
  authDomain: "rec-time-593b0.firebaseapp.com",
  projectId: "rec-time-593b0",
  storageBucket: "rec-time-593b0.firebasestorage.app",
  messagingSenderId: "885151050655",
  appId: "1:885151050655:web:873c0e58da98316a4fabaa",
  measurementId: "G-5YRL3CV57Z"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// FCM 메시징 인스턴스
const messaging = firebase.messaging();

// 백그라운드 메시지 수신 처리
// 역할: FCM이 백엔드에서 푸시 알림을 보낼 때 앱이 백그라운드/종료 상태에서도
// 기존 Service Worker 알림과 동일한 형태로 표시
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM] 백그라운드 메시지 수신:', payload);

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

  // 알림 표시
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('[FCM] 알림 클릭:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // 앱 열기 또는 포커스
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열린 창이 있으면 포커스
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      // 새 창 열기
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// 알림 닫기 처리
self.addEventListener('notificationclose', (event) => {
  console.log('[FCM] 알림 닫기:', event);
});

console.log('[FCM] Service Worker 초기화 완료');
