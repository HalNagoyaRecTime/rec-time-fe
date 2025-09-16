import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

// ブラウザが通知APIに対応しているか確認
if (!("Notification" in window)) {
  console.log("このブラウザはデスクトップ通知に対応していません。");
}

function App() {
  const [count, setCount] = useState(0);

  // 通知許可をリクエストする関数
  const requestNotificationPermission = () => {
    // 許可の状態を確認
    if (Notification.permission === "granted") {
      console.log("すでに通知の許可を得ています。");
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          console.log("ユーザーが通知を許可しました！");
        } else {
          console.log("ユーザーが通知を拒否しました。");
        }
      });
    }
  };

  // 通知を表示する関数
  const showNotification = () => {
    if (Notification.permission === "granted") {
      new Notification("イベント通知：", {
        body: "注意してください、運動会の競技がまもなく始まります！"
      });
    } else {
      console.log("通知の許可がないため、通知を送信できません。");
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
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>

      {/* 追加したボタン */}
      <div style={{ marginTop: '20px' }}>
        <button onClick={requestNotificationPermission}>通知の許可をリクエスト</button>
        <button onClick={showNotification} style={{ marginLeft: '10px' }}>通知を表示</button>
      </div>
    </>
  );
}

export default App;