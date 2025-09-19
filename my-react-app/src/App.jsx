// src/App.jsx

import React from 'react';
import MovingLine from './MovingLine'; // 作成したコンポーネントをインポート
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>React アニメーション</h1>
        <MovingLine /> {/* コンポーネント呼び出し */}
      </header>
    </div>
  );
}

export default App;