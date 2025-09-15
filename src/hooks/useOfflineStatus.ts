import { useState, useEffect } from 'react';

export function useOfflineStatus() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      console.log('[App] Network: Online');
      setIsOffline(false);
    };

    const handleOffline = () => {
      console.log('[App] Network: Offline');
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial state check
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOffline,
    isOnline: !isOffline
  };
}