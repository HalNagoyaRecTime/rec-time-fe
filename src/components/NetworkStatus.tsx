import React, { useState, useEffect } from 'react';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

const NetworkStatus: React.FC = () => {
  const { isOffline, isOnline } = useOfflineStatus();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (isOffline) {
      setToastMessage('インターネット接続が切断されました');
      setShowToast(true);
    } else if (isOnline) {
      setToastMessage('インターネット接続が復旧しました');
      setShowToast(true);
    }

    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOffline, isOnline, showToast]);

  return (
    <>
      {/* Toast notification */}
      {showToast && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          isOffline
            ? 'bg-red-500 text-white'
            : 'bg-green-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isOffline ? 'bg-white animate-pulse' : 'bg-white'
            }`}></div>
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Status indicator in corner */}
      <div className="fixed top-4 right-4 z-40">
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
          isOffline
            ? 'bg-red-100 text-red-800 border border-red-300'
            : 'bg-green-100 text-green-800 border border-green-300'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            isOffline ? 'bg-red-500' : 'bg-green-500'
          }`}></div>
          <span>{isOffline ? 'オフライン' : 'オンライン'}</span>
        </div>
      </div>
    </>
  );
};

export default NetworkStatus;