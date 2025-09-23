import { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

// ブラウザが通知APIに対応しているか確認
if (!("Notification" in window)) {
  console.log("このブラウザはデスクトップ通知に対応していません。");
}

function App() {
  const [events, setEvents] = useState([]);
  
  // イベントデータを読み込み、通知をスケジュールする
  useEffect(() => {
    // 通知の許可をリクエスト
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
    
    // JSON ファイルからイベントデータを取得
    fetch('/events.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('ネットワークエラーが発生しました');
        }
        return response.json();
      })
      .then(data => {
        setEvents(data);
        console.log("JSON データが正常に読み込まれました：", data);
        
        // スケジュールされた通知をセット
        scheduleNotifications(data);
      })
      .catch(error => {
        console.error('JSON データの読み込みに失敗しました：', error);
      });
  }, []);

  // 通知をスケジュールする関数
  const scheduleNotifications = (eventsData) => {
    if (Notification.permission === "granted") {
      eventsData.forEach(event => {
        const eventTime = new Date(event.time);
        const now = new Date();
        const timeDifference = eventTime.getTime() - now.getTime();
        
        // イベントが未来にあり、かつ1時間以内であればスケジュール
        if (timeDifference > 0 && timeDifference <= 3600000) {
          setTimeout(() => {
            // 時刻をフォーマット
            const eventHour = eventTime.getHours().toString().padStart(2, '0');
            const eventMinute = eventTime.getMinutes().toString().padStart(2, '0');
            const formattedTime = `${eventHour}${eventMinute}`;

            // 通知のフォーマットを生成
            const notificationTitle = `次のイベントの集合時刻`;
            const notificationBody = `${event.studentName}さんの次の予定は${event.title}で、${formattedTime}分に集合場所${event.location}に集合です。`;

            new Notification(notificationTitle, { body: notificationBody });
          }, timeDifference);
        }
      });
      console.log("通知スケジューリング完了。");
    }
  };

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <div style={{ marginTop: '20px' }}>
        <p>通知は自動的にスケジュールされます。</p>
        <p>ブラウザの許可を確認してください。</p>
      </div>
    </>
  );
}

export default App;
