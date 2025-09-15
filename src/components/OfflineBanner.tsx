import React from 'react';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

const OfflineBanner: React.FC = () => {
  const { isOffline } = useOfflineStatus();

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black px-4 py-2 text-center">
      <div className="flex items-center justify-center space-x-2">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span className="font-medium">オフラインモード</span>
        <div className="text-sm">
          - 保存されたデータを表示しています
        </div>
      </div>
    </div>
  );
};

export default OfflineBanner;