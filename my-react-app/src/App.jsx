// src/App.jsx

import React from 'react';
import CurrentTime from './CurrentTime'; // 作成したコンポーネントをインポート
import './App.css'; // スタイルはお好みで

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Reactアプリへようこそ！</h1>
        <CurrentTime /> {/* ここでコンポーネントを呼び出す */}
      </header>
    </div>
  );
}

export default App;