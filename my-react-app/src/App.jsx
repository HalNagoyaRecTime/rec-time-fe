// src/App.jsx

import React from 'react';
import TimeTable from './TimeTable'; // 作成したTimeTableコンポーネントをインポート
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>リアルタイム タイムテーブル</h1>
        <TimeTable />
      </header>
    </div>
  );
}

export default App;