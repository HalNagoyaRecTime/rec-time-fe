// src/TimeTable.jsx

import React, { useState, useEffect } from 'react';

function TimeTable() {

  const HOUR_HEIGHT = 80;
  const stopPosition = (18-9) * HOUR_HEIGHT;

  // 現在時刻に基づいて初期位置を計算
  const getCurrentPosition = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const second = now.getSeconds();
    
    // 9時から18時までの範囲内でのみ計算
    if (hour < 9 || hour >= 18) {
      return 0;
    }
    
    // 9時を基準とした時間差（時間）
    const hourDiff = hour - 9;
    // 分と秒を考慮した位置計算
    const minutePosition = (minute * 60 + second) * (HOUR_HEIGHT / 3600);
    
    return hourDiff * HOUR_HEIGHT + minutePosition;
  };

  const [topPosition, setTopPosition] = useState(getCurrentPosition());

  useEffect(() => {
    // 現在時刻から開始位置を再計算
    const initialPosition = getCurrentPosition();
    setTopPosition(initialPosition);

    const intervalId = setInterval(() => {
      setTopPosition(prevPosition => {
        if (prevPosition >= stopPosition) {
            clearInterval(intervalId);
            return stopPosition;
        }
        return prevPosition + 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const hours = Array.from({ length: 10 }, (_, i) => i + 9);


  const timelineContainerStyle = {
    position: 'relative',
    padding: '20px 0 20px 70px',
    borderLeft: '2px solid #ddd',
    marginTop: '20px',
  };

  const lineStyle = {
    position: 'absolute',
    top: `${topPosition}px`,
    left: 0,
    width: '550px',
    height: '2px',
    backgroundColor: 'red',
    transition: 'top 0.5s ease-out',
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
              height: '80px',
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