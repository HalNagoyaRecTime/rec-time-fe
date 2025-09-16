import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

registerSW({
  immediate: true,
  onNeedRefresh() {},
  onOfflineReady() {}
})

function requestNotificationPermission() {
  if ('Notification' in window && 'serviceWorker' in navigator) {
    console.log('通知権限:', Notification.permission)

    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification('Hello from PWA!', {
            body: 'これはテスト通知です 🎉',
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png'
          })
        })
      } else {
        console.log('通知が拒否されました')
      }
    })
  }
}

// 🔑 グローバル公開
window.requestNotificationPermission = requestNotificationPermission