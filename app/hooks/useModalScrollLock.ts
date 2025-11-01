// === モーダル背景スクロール無効化 Hook ===

import { useEffect } from "react";

/**
 * モーダルが開いている間、背景のスクロールとpull-to-refreshを無効化
 * @param isOpen - モーダルが開いているか
 */
export function useModalScrollLock(isOpen: boolean) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            document.body.style.overscrollBehavior = "none";
            document.documentElement.style.overflow = "hidden";
            document.documentElement.style.overscrollBehavior = "none";

            return () => {
                document.body.style.overflow = "";
                document.body.style.overscrollBehavior = "";
                document.documentElement.style.overflow = "";
                document.documentElement.style.overscrollBehavior = "";
            };
        }
    }, [isOpen]);
}
