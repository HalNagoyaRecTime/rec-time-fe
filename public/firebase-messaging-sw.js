// Firebase Messaging Service Worker for FCM Background Messages
// This file is required by Firebase for handling background messages
// It should be a separate file from the main service worker

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAUDY7ty75NHqwfmT4xGiTeJj3f5VT0Duc",
  authDomain: "rec-time-593b0.firebaseapp.com",
  projectId: "rec-time-593b0",
  storageBucket: "rec-time-593b0.firebasestorage.app",
  messagingSenderId: "885151050655",
  appId: "1:885151050655:web:873c0e58da98316a4fabaa",
  measurementId: "G-5YRL3CV57Z"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

console.log('[firebase-messaging-sw] Firebase 초기화 완료');

// 백그라운드 메시지 핸들러
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw] FCM 백그라운드 메시지 수신:', payload);
    console.log('[firebase-messaging-sw] 전체 페이로드:', JSON.stringify(payload, null, 2));

    // 백엔드가 notification 필드 없이 data만 보낼 수 있으므로 처리
    let notificationTitle = 'RecTime 알림';
    let notificationBody = '새로운 알림이 있습니다';
    
    if (payload.notification) {
        // 표준 FCM notification 필드 사용
        notificationTitle = payload.notification.title || notificationTitle;
        notificationBody = payload.notification.body || notificationBody;
    } else if (payload.data) {
        // data 필드에서 title/body 추출 (백엔드가 data만 보낼 경우)
        notificationTitle = payload.data.title || payload.data.Title || notificationTitle;
        notificationBody = payload.data.body || payload.data.Body || payload.data.message || notificationBody;
    }

    const notificationOptions = {
        body: notificationBody,
        icon: '/icons/pwa-192.png',
        badge: '/icons/pwa-192.png',
        tag: payload.data?.eventId || payload.data?.event_id || 'fcm-background-notification',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: payload.data || {},
        actions: [
            {
                action: 'open',
                title: '앱 열기',
                icon: '/icons/pwa-192.png'
            },
            {
                action: 'close',
                title: '닫기'
            }
        ]
    };

    console.log('[firebase-messaging-sw] 알림 표시:', notificationTitle, notificationBody);

    // 알림 표시
    return self.registration.showNotification(notificationTitle, notificationOptions).catch((error) => {
        console.error('[firebase-messaging-sw] 알림 표시 실패:', error);
    });
});

