// src/CurrentTime.jsx

import React, { useState, useEffect } from 'react';

function CurrentTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  return (
    <div>
      <h2>現在時刻</h2>
      <p>{time.toLocaleTimeString()}</p>
    </div>
  );
}

export default CurrentTime;