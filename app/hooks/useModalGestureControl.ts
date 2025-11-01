// === モーダル ジェスチャーコントロール Hook ===

import React, { useRef, useState, useCallback } from "react";

/**
 * モーダルのドラッグ・スワイプ・タッチハンドリングを管理する hook
 * @param scrollRef - スクロール可能な要素への ref
 * @returns ジェスチャーハンドラーと状態
 */
export function useModalGestureControl(scrollRef: React.RefObject<HTMLDivElement>) {
    const [translateY, setTranslateY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const startY = useRef(0);
    const startScrollTop = useRef(0);

    // スクロール可能領域でのタッチ開始
    const handleScrollTouchStart = useCallback(
        (e: React.TouchEvent) => {
            if (!scrollRef.current) return;

            startY.current = e.touches[0].clientY;
            startScrollTop.current = scrollRef.current.scrollTop;
            setIsDragging(true);
        },
        [scrollRef]
    );

    // スクロール可能領域でのタッチ移動
    const handleScrollTouchMove = useCallback(
        (e: React.TouchEvent) => {
            if (!isDragging || !scrollRef.current) return;

            const currentY = e.touches[0].clientY;
            const diff = currentY - startY.current;
            const scrollTop = scrollRef.current.scrollTop;

            // スクロール位置が上端（0）で、かつ下方向にドラッグしている場合のみモーダルを動かす
            if (scrollTop === 0 && diff > 0) {
                setTranslateY(diff);
                e.preventDefault(); // 背景へのスクロール防止
            } else {
                // それ以外は通常のスクロールを許可
                setTranslateY(0);
            }
        },
        [isDragging, scrollRef]
    );

    // スクロール可能領域でのタッチ終了
    const handleScrollTouchEnd = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);
        // translateY のリセットはモーダルを閉じるかどうかで呼び出し側で判断
        // ここでは状態リセットのみ
    }, [isDragging]);

    // ハンドルバー（掴める部分）でのタッチハンドラーを生成
    const createHandlerbarTouchHandlers = useCallback(
        (onClose: () => void) => ({
            onTouchStart: (e: React.TouchEvent) => {
                e.stopPropagation();
                startY.current = e.touches[0].clientY;
                setIsDragging(true);
            },
            onTouchMove: (e: React.TouchEvent) => {
                if (!isDragging) return;
                e.stopPropagation();
                const currentY = e.touches[0].clientY;
                const diff = currentY - startY.current;
                if (diff > 0) {
                    setTranslateY(diff);
                }
            },
            onTouchEnd: (e: React.TouchEvent) => {
                e.stopPropagation();
                if (translateY > 100) {
                    onClose();
                } else {
                    setTranslateY(0);
                }
                setIsDragging(false);
            },
        }),
        [isDragging, translateY]
    );

    return {
        // 状態
        translateY,
        isDragging,

        // ハンドラー
        handleScrollTouchStart,
        handleScrollTouchMove,
        handleScrollTouchEnd,
        createHandlerbarTouchHandlers,

        // ユーティリティ
        resetTranslateY: () => setTranslateY(0),
        resetIsDragging: () => setIsDragging(false),
    };
}
