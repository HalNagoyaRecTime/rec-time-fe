// src/TimeTable.jsx

import React, { useState, useEffect } from 'react';

function TimeTable() {

  const HOUR_HEIGHT = 80;
  // --- ここから変更 ---
  const PADDING_TOP = 20; // 上の余白を定数として定義

  // 停止位置にパディングを追加
  const stopPosition = (18-9) * HOUR_HEIGHT + PADDING_TOP;

  // 現在時刻に基づいて初期位置を計算する関数
  const getCurrentPosition = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const second = now.getSeconds();
    
    // 9時より前なら、9時の位置（=パディング分）を返す
    if (hour < 9) {
      return PADDING_TOP;
    }
    // 18時以降なら、18時の位置を返す
    if (hour >= 18) {
      return stopPosition;
    }
    
    const hourDiff = hour - 9;
    const minutePosition = (minute * 60 + second) * (HOUR_HEIGHT / 3600);
    
    // 計算結果にパディングを追加して返す
    return hourDiff * HOUR_HEIGHT + minutePosition + PADDING_TOP;
  };

  const [topPosition, setTopPosition] = useState(getCurrentPosition());

  useEffect(() => {
    // useEffect内でも、パディングを考慮した位置を再設定
    const initialPosition = getCurrentPosition();
    setTopPosition(initialPosition);

    const intervalId = setInterval(() => {
      setTopPosition(prevPosition => {
        if (prevPosition >= stopPosition) {
            clearInterval(intervalId);
            return stopPosition;
        }
        return prevPosition + (HOUR_HEIGHT / 3600); // 1秒あたりの移動距離を正確に
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const hours = Array.from({ length: 10 }, (_, i) => i + 9);

  // コンテナのスタイル定義に定数を使用
  const timelineContainerStyle = {
    position: 'relative',
    padding: `${PADDING_TOP}px 0 20px 70px`,
    borderLeft: '2px solid #ddd',
    marginTop: '20px',
  };
  // --- ここまで変更 ---

  const lineStyle = {
    position: 'absolute',
    top: `${topPosition}px`,
    left: 0,
    width: '550px',
    height: '2px',
    backgroundColor: 'red',
    transition: 'top 0.1s linear', // アニメーションを滑らかに
    zIndex: 10
  };

  return (
    <div>
      <h2>タイムテーブル</h2>
      <div style={timelineContainerStyle}>
        
        <div style={lineStyle}></div>

        {hours.map(hour => (
          <div
            key={hour}
            style={{
              position: 'relative',
              height: `${HOUR_HEIGHT}px`,
              borderTop: '1px solid #eee',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 0,
                left: '-50px',
                transform: 'translateY(-50%)',
                fontSize: '14px',
                color: '#555',
              }}
            >
              {`${hour}:00`}    
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TimeTable;