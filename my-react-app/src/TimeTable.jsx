// src/TimeTable.jsx

import React, { useState, useEffect } from 'react';

function TimeTable() {

  const [topPosition, setTopPosition] = useState(0);

  useEffect(() => {

    const intervalId = setInterval(() => {
      setTopPosition(prevPosition => prevPosition + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const hours = Array.from({ length: 12 }, (_, i) => i + 9);


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
    width: '100px',
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