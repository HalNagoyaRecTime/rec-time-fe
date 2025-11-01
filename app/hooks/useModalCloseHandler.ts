// === モーダル閉じる処理 Hook ===

import { useState, useCallback } from "react";

interface ModalCloseHandlers {
    isClosingState: boolean;
    handleClose: () => void;
    handleBackdropClick: (e: React.MouseEvent) => void;
}

/**
 * モーダルの閉じるアニメーションと各ハンドラーを管理する hook
 * @param onClose - モーダルを閉じるコールバック
 * @param onClosing - モーダル閉じ始めるときのコールバック（オプション）
 * @returns 閉じる処理関連のハンドラーと状態
 */
export function useModalCloseHandler(
    onClose: () => void,
    onClosing?: () => void
): ModalCloseHandlers {
    const [isClosingState, setIsClosingState] = useState(false);

    // 閉じるアニメーション付きの処理
    const handleClose = useCallback(() => {
        setIsClosingState(true);
        onClosing?.();
        setTimeout(() => {
            onClose();
            setIsClosingState(false);
        }, 300);
    }, [onClose, onClosing]);

    // 背景クリックで閉じる
    const handleBackdropClick = useCallback(
        (e: React.MouseEvent) => {
            if (e.target === e.currentTarget) {
                handleClose();
            }
        },
        [handleClose]
    );

    return {
        isClosingState,
        handleClose,
        handleBackdropClick,
    };
}
