import React, { useState, useRef, useEffect } from "react";

interface ImageData {
    src: string;
    title: string;
}

interface ZoomableImageModalProps {
    images: ImageData[];
    initialIndex: number;
    isOpen: boolean;
    onClose: () => void;
}

export default function ZoomableImageModal({ images, initialIndex, isOpen, onClose }: ZoomableImageModalProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [showUI, setShowUI] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [swipeDownDistance, setSwipeDownDistance] = useState(0);
    const [isClosing, setIsClosing] = useState(false);

    const lastTouchDistance = useRef<number | null>(null);
    const touchStartPos = useRef<{ x: number; y: number; time: number } | null>(null);
    const swipeStartX = useRef<number | null>(null);
    const swipeStartY = useRef<number | null>(null);
    const lastTapTime = useRef<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // 全ての画像を事前にプリロード
    useEffect(() => {
        images.forEach((img) => {
            const image = new Image();
            image.src = img.src;
        });
    }, [images]);

    // インデックス変更時にズームとポジションをリセット
    useEffect(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, [currentIndex]);

    const nextImage = () => {
        if (currentIndex < images.length - 1 && !isTransitioning) {
            setIsTransitioning(true);
            setCurrentIndex((prev) => prev + 1);
            setTimeout(() => setIsTransitioning(false), 300);
        }
    };

    const prevImage = () => {
        if (currentIndex > 0 && !isTransitioning) {
            setIsTransitioning(true);
            setCurrentIndex((prev) => prev - 1);
            setTimeout(() => setIsTransitioning(false), 300);
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        touchStartPos.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };

        if (e.touches.length === 2) {
            // ピンチズーム開始
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
            lastTouchDistance.current = distance;
        } else if (e.touches.length === 1) {
            if (scale > 1) {
                // ズーム中はドラッグ
                setIsDragging(true);
                setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
            } else {
                // 等倍時はスワイプ判定用
                swipeStartX.current = touch.clientX;
                swipeStartY.current = touch.clientY;
            }
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && lastTouchDistance.current) {
            // ピンチズーム
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
            const delta = distance - lastTouchDistance.current;
            const newScale = Math.max(1, Math.min(4, scale + delta * 0.01));
            setScale(newScale);
            lastTouchDistance.current = distance;
        } else if (e.touches.length === 1) {
            const touch = e.touches[0];

            if (isDragging && scale > 1) {
                // ズーム中のドラッグ
                setPosition({
                    x: touch.clientX - dragStart.x,
                    y: touch.clientY - dragStart.y,
                });
            } else if (swipeStartY.current !== null && scale === 1) {
                // 上から下へのスワイプ判定（閉じる動作）
                const swipeY = touch.clientY - swipeStartY.current;
                if (swipeY > 0) {
                    setSwipeDownDistance(swipeY);
                    // UI を非表示にする
                    setShowUI(false);
                }
            }
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const touch = e.changedTouches[0];

        // 上から下へのスワイプで閉じる判定
        if (swipeDownDistance > 100) {
            // アニメーションを開始
            setIsClosing(true);
            // アニメーション完了後にモーダルを閉じる
            setTimeout(() => {
                onClose();
                setIsClosing(false);
                setSwipeDownDistance(0);
            }, 300);
            return;
        }
        setSwipeDownDistance(0);

        // タップ判定（移動距離が小さく、時間が短い場合）
        if (touchStartPos.current) {
            const dx = Math.abs(touch.clientX - touchStartPos.current.x);
            const dy = Math.abs(touch.clientY - touchStartPos.current.y);
            const dt = Date.now() - touchStartPos.current.time;

            if (dx < 10 && dy < 10 && dt < 300) {
                const now = Date.now();
                const timeSinceLastTap = now - lastTapTime.current;

                // ダブルタップ判定（300ms以内の連続タップ）
                if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
                    // ダブルタップ処理：等倍時のみズームイン
                    if (scale === 1) {
                        // タップした位置を中心にズームイン（3倍）
                        if (containerRef.current) {
                            const rect = containerRef.current.getBoundingClientRect();
                            const tapX = touch.clientX - rect.left - rect.width / 2;
                            const tapY = touch.clientY - rect.top - rect.height / 2;

                            setScale(3);
                            setPosition({ x: -tapX, y: -tapY });
                        }
                    }
                    // ズーム中のダブルタップは何もしない
                    lastTapTime.current = 0;
                } else {
                    // シングルタップ処理
                    if (scale > 1) {
                        // ズーム中の場合はズーム解除してUI表示
                        setScale(1);
                        setPosition({ x: 0, y: 0 });
                        setShowUI(true); // UI表示
                    } else {
                        // 等倍の場合はUI表示切替
                        setShowUI((prev) => !prev);
                    }
                    lastTapTime.current = now;
                }
            }
        }

        // 左右スワイプ判定（等倍時のみ）
        if (swipeStartX.current !== null && scale === 1 && swipeDownDistance === 0) {
            const swipeDistance = touch.clientX - swipeStartX.current;
            if (Math.abs(swipeDistance) > 50) {
                if (swipeDistance < 0) {
                    // 右から左へスワイプ → 次の画像
                    nextImage();
                } else {
                    // 左から右へスワイプ → 前の画像
                    prevImage();
                }
            }
        }

        setIsDragging(false);
        lastTouchDistance.current = null;
        touchStartPos.current = null;
        swipeStartX.current = null;
        swipeStartY.current = null;
    };

    // PCのマウスクリック対応
    const handleClick = (e: React.MouseEvent) => {
        // タッチイベントと重複しないように、タッチデバイスでは無効化
        if ("ontouchstart" in window) return;

        const target = e.target as HTMLElement;
        // ボタンやインジケーターのクリックは無視
        if (target.tagName === "BUTTON" || target.closest("button")) return;

        const now = Date.now();
        const timeSinceLastClick = now - lastTapTime.current;

        // ダブルクリック判定
        if (timeSinceLastClick < 300 && timeSinceLastClick > 0) {
            if (scale === 1 && containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const clickX = e.clientX - rect.left - rect.width / 2;
                const clickY = e.clientY - rect.top - rect.height / 2;

                setScale(3);
                setPosition({ x: -clickX, y: -clickY });
            }
            lastTapTime.current = 0;
        } else {
            // シングルクリック
            if (scale > 1) {
                setScale(1);
                setPosition({ x: 0, y: 0 });
                setShowUI(true);
            } else {
                setShowUI((prev) => !prev);
            }
            lastTapTime.current = now;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* 背景オーバーレイ - スワイプでゆっくりフェードアウト */}
            <div
                className="absolute inset-0 bg-black"
                style={{
                    opacity: isClosing ? 0 : swipeDownDistance > 0 ? Math.max(0, 1 - swipeDownDistance / 600) : 1,
                    transition: isClosing ? "opacity 0.3s ease-out" : "none",
                }}
            />

            {/* 閉じるボタン - 上からスライドイン */}
            <button
                onClick={onClose}
                className="absolute left-4 z-10 text-5xl text-white transition-all duration-300 hover:text-[#FFB400]"
                style={{
                    top: showUI ? "1rem" : "-4rem",
                    opacity: showUI ? 1 : 0,
                    pointerEvents: showUI ? "auto" : "none",
                }}
            >
                ×
            </button>

            {/* 左ナビゲーション */}
            {currentIndex > 0 && (
                <button
                    onClick={prevImage}
                    className="absolute top-1/2 left-4 z-10 -translate-y-1/2 text-6xl text-white transition-opacity duration-300 hover:text-[#FFB400]"
                    style={{ opacity: showUI ? 1 : 0, pointerEvents: showUI ? "auto" : "none" }}
                >
                    ‹
                </button>
            )}

            {/* 右ナビゲーション */}
            {currentIndex < images.length - 1 && (
                <button
                    onClick={nextImage}
                    className="absolute top-1/2 right-4 z-10 -translate-y-1/2 text-6xl text-white transition-opacity duration-300 hover:text-[#FFB400]"
                    style={{ opacity: showUI ? 1 : 0, pointerEvents: showUI ? "auto" : "none" }}
                >
                    ›
                </button>
            )}

            {/* 画像タイトル - 上からスライドイン */}
            <div
                className="absolute left-1/2 z-10 -translate-x-1/2 text-lg text-white transition-all duration-300"
                style={{
                    top: showUI ? "1rem" : "-4rem",
                    opacity: showUI ? 1 : 0,
                }}
            >
                {images[currentIndex].title}
            </div>

            {/* 画像表示エリア - 横スクロールコンテナ、スワイプで移動 */}
            <div
                ref={containerRef}
                className="relative z-10 h-full w-full overflow-hidden"
                style={{
                    transform: isClosing
                        ? "translateY(100vh)"
                        : swipeDownDistance > 0
                          ? `translateY(${swipeDownDistance}px)`
                          : "none",
                    transition: isClosing ? "transform 0.3s ease-out" : "none",
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={handleClick}
            >
                <div
                    className="flex h-full"
                    style={{
                        transform: `translateX(-${currentIndex * 100}%)`,
                        transition: isTransitioning ? "transform 0.3s ease-out" : "none",
                    }}
                >
                    {images.map((image, index) => (
                        <div
                            key={index}
                            className="relative flex h-full w-full flex-shrink-0 items-center justify-center"
                        >
                            <img
                                src={image.src}
                                alt={image.title}
                                className="max-h-full max-w-full object-contain"
                                style={{
                                    transform:
                                        index === currentIndex
                                            ? `translate(${position.x}px, ${position.y}px) scale(${scale})`
                                            : "none",
                                    transition: scale === 1 || scale === 3 ? "transform 0.3s ease-out" : "none",
                                    cursor: scale > 1 ? "move" : "default",
                                }}
                                draggable={false}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* サムネイルインジケーター - 下からスライドイン */}
            {images.length > 1 && (
                <div
                    className="absolute left-1/2 z-10 flex -translate-x-1/2 gap-2 transition-all duration-300"
                    style={{
                        bottom: showUI ? "1rem" : "-4rem",
                        opacity: showUI ? 1 : 0,
                    }}
                >
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                if (!isTransitioning) {
                                    setIsTransitioning(true);
                                    setCurrentIndex(index);
                                    setTimeout(() => setIsTransitioning(false), 300);
                                }
                            }}
                            className={`h-3 w-3 rounded-full transition-all ${
                                index === currentIndex ? "bg-[#FFB400]" : "bg-gray-500"
                            }`}
                            style={{ pointerEvents: showUI ? "auto" : "none" }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}