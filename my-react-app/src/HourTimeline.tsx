// src/HourTimeline.jsx

import React from 'react';

function HourTimeline() {
  // 表示したい時間（9時から20時）を配列として作成
  const hours = Array.from({ length: 12 }, (_, i) => i + 9);

  return (
    // タイムライン全体のコンテナ
    <div style={{ padding: '20px 0 20px 70px' }}>
      {hours.map(hour => (
        // 各時間ごとのブロック
        <div
          key={hour}
          style={{
            position: 'relative',   // 時間ラベルを配置する基準点にする
            height: '80px',         // 1時間分の高さ
            borderTop: '1px solid #eee',
          }}
        >
          {/* 時間ラベル (例: "9:00") */}
          <span
            style={{
              position: 'absolute',
              top: 0,
              left: '-50px',
              transform: 'translateY(-50%)', // 線の中央に配置
              fontSize: '14px',
              color: '#555',
            }}
          >
            {`${hour}:00`}
          </span>
        </div>
      ))}
    </div>
  );
}

export default HourTimeline;