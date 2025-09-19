// src/MovingLine.jsx

import React, { useState, useEffect } from 'react';

function MovingLine() {
  // 線の垂直位置(top)を管理するstate。初期値は0。
  const [topPosition, setPosition] = useState(0);

  useEffect(() => {
    // 60000ミリ秒（1分）ごとに実行するタイマー
    const intervalId = setInterval(() => {
      // 現在の位置に30を足して、stateを更新する
      setPosition(prevPosition => prevPosition + 30);
    }, 3600000);

    // コンポーネントが不要になったらタイマーを停止
    return () => {
      clearInterval(intervalId);
    };
  }, []); // 初回レンダリング時に一度だけ実行

  // 親要素のスタイル（線の移動範囲を確保するため）
  const containerStyle = {
    position: 'relative', // 子要素の'absolute'の基準点にする
    height: '500px',      // 線が移動するスペース
    border: '1px solid #eee',
    marginTop: '20px'
  };

  // 線のスタイル
  const lineStyle = {
    position: 'absolute',
    top: `${topPosition}px`, // stateの値をCSSのtopプロパティに適用
    left: '20px',
    width: '100px',
    height: '2px',
    backgroundColor: 'dodgerblue',
    transition: 'top 0.5s ease-out' // 0.5秒かけてスムーズに移動するアニメーション
  };

  return (
    <div>
      <h2>移動する線</h2>
      <div style={containerStyle}>
        <div style={lineStyle}></div>
      </div>
    </div>
  );
}

export default MovingLine;