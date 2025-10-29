import React, { useState, useEffect, useRef } from "react";
import { useAppVersion } from "~/hooks/useAppVersion";
import { reinstallPWA } from "~/utils/clearCache";
import UpdateModal from "~/components/ui/update-modal";

export default function footer() {
    const currentYear = new Date().getFullYear();
    const appVersion = useAppVersion();
    const [showReinstallModal, setShowReinstallModal] = useState(false);
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 長押し開始（隠し機能）
    const handleLongPressStart = () => {
        longPressTimerRef.current = setTimeout(() => {
            setShowReinstallModal(true);
        }, 5000);
    };

    // 長押し終了
    const handleLongPressEnd = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    // 再インストール実行
    const handleReinstall = async () => {
        await reinstallPWA();
    };

    // クリーンアップ
    useEffect(() => {
        return () => {
            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
            }
        };
    }, []);

    return (
        <>
            <footer className="flex w-full flex-col justify-center bg-white px-2 pb-2 drop-shadow-2xl">
                <div className="flex w-full justify-center">
                    <p
                        className="text-sm text-blue-950 select-none"
                        onTouchStart={handleLongPressStart}
                        onTouchEnd={handleLongPressEnd}
                        onMouseDown={handleLongPressStart}
                        onMouseUp={handleLongPressEnd}
                        onMouseLeave={handleLongPressEnd}
                    >
                        &copy; {currentYear} HAL, Inc. ALL RIGHTS RESERVED.
                    </p>
                </div>
            </footer>

            {/* 手動再インストールモーダル */}
            {showReinstallModal && (
                <UpdateModal
                    onUpdate={handleReinstall}
                    version={appVersion}
                    message="PWAを再インストール"
                    isDebugMode={true}
                />
            )}
        </>
    );
}
