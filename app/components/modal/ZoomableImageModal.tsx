import React, { useState, useRef, useEffect } from "react";
import { MdFileDownload } from "react-icons/md";
import { FaXmark } from "react-icons/fa6";

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
    const singleTapTimeout = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const swipeDirection = useRef<"horizontal" | "vertical" | null>(null);

    // imagesプロップまたはinitialIndexプロップが変更されたときにcurrentIndexをリセット
    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [images, initialIndex]);

    // モーダルが開いたときにメニューを必ず表示する
    useEffect(() => {
        if (isOpen) {
            setShowUI(true);
        }
    }, [isOpen]);

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

    // キーボード操作
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            } else if (e.key === "ArrowLeft") {
                prevImage();
            } else if (e.key === "ArrowRight") {
                nextImage();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, currentIndex, images.length, onClose]);

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

    const downloadImage = async () => {
        const currentImage = images[currentIndex];

        // ダウンロード確認ダイアログを表示
        const fileName = `${currentImage.title.replace(/[/\\?%*:|"<>]/g, "-")}.jpg`;
        const confirmed = window.confirm(`「${currentImage.title}」をダウンロードしますか？`);

        if (!confirmed) {
            return; // キャンセルされた場合は何もしない
        }

        try {
            // 画像をfetchしてblobに変換
            const response = await fetch(currentImage.src);
            const blob = await response.blob();

            // ダウンロード用のURLを生成
            const url = window.URL.createObjectURL(blob);

            // ダウンロード用のリンクを作成してクリック
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // URLを解放
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("画像のダウンロードに失敗しました:", error);
            window.alert("画像のダウンロードに失敗しました。");
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
            } else if (swipeStartX.current !== null && swipeStartY.current !== null && scale === 1) {
                const deltaX = Math.abs(touch.clientX - swipeStartX.current);
                const deltaY = Math.abs(touch.clientY - swipeStartY.current);

                // スワイプ方向がまだ確定していない場合
                if (!swipeDirection.current && (deltaX > 15 || deltaY > 15)) {
                    // 横方向と縦方向の移動量を比較して方向を確定
                    swipeDirection.current = deltaX > deltaY ? "horizontal" : "vertical";
                }

                // 確定した方向に応じて処理
                if (swipeDirection.current === "vertical") {
                    // 縦方向のスワイプ（閉じる動作）
                    const swipeY = touch.clientY - swipeStartY.current;
                    if (swipeY > 0) {
                        setSwipeDownDistance(swipeY);
                        // UI を非表示にする
                        setShowUI(false);
                    }
                }
                // 横方向のスワイプは handleTouchEnd で処理
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

                // ダブルタップ判定（200ms以内の連続タップ）
                if (timeSinceLastTap < 200 && timeSinceLastTap > 0) {
                    // 保留中のシングルタップ処理をキャンセル
                    if (singleTapTimeout.current) {
                        clearTimeout(singleTapTimeout.current);
                        singleTapTimeout.current = null;
                    }

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
                    // シングルタップの可能性（ダブルタップ判定待ち）
                    lastTapTime.current = now;

                    // 既存のシングルタップタイマーをキャンセル
                    if (singleTapTimeout.current) {
                        clearTimeout(singleTapTimeout.current);
                    }

                    // 200ms後にダブルタップが来なければシングルタップとして処理
                    singleTapTimeout.current = setTimeout(() => {
                        if (scale > 1) {
                            // ズーム中の場合はズーム解除のみ（メニュー表示状態は変更しない）
                            setScale(1);
                            setPosition({ x: 0, y: 0 });
                        } else {
                            // 等倍の場合はUI表示切替
                            setShowUI((prev) => !prev);
                        }
                        singleTapTimeout.current = null;
                    }, 200);
                }
            }
        }

        // 左右スワイプ判定（等倍時のみ、かつ横方向のスワイプのみ）
        if (
            swipeStartX.current !== null &&
            scale === 1 &&
            swipeDownDistance === 0 &&
            swipeDirection.current === "horizontal"
        ) {
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
        swipeDirection.current = null;
    };

    // PCのマウスクリック対応
    const handleClick = (e: React.MouseEvent) => {
        // タッチイベントと重複しないように、タッチデバイスでは無効化
        if ("ontouchstart" in window) return;

        const target = e.target as HTMLElement;
        // ボタンやインジケーターのクリックは無視
        if (target.tagName === "BUTTON" || target.closest("button")) return;

        // 画像要素以外をクリックした場合はモーダルを閉じる
        if (target.tagName !== "IMG") {
            onClose();
        }
        // 画像をクリックした場合は何もしない
    };

    if (!isOpen) return null;

    // imagesプロップの変更後に古いcurrentIndexでレンダリングしようとするのを防ぐ
    if (currentIndex >= images.length) {
        // 不正なインデックスの場合、何もレンダリングせず、useEffectがcurrentIndexを更新して再レンダリングするのを待つ
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-label="画像ビューア"
        >
            {/* 背景オーバーレイ - スワイプでゆっくりフェードアウト */}
            <div
                className="absolute inset-0 bg-black/90"
                style={{
                    opacity: isClosing ? 0 : swipeDownDistance > 0 ? Math.max(0, 1 - swipeDownDistance / 600) : 1,
                    transition: isClosing ? "opacity 0.3s ease-out" : "none",
                }}
                onClick={() => {
                    // PC環境でのみ、背景クリックでモーダルを閉じる
                    if (!("ontouchstart" in window)) {
                        onClose();
                    }
                }}
            />

            {/* ヘッダー（閉じるボタン、タイトル、ダウンロードボタン） - 上からスライドイン */}
            <div
                className="absolute right-0 left-0 z-[1000] flex max-w-full items-center gap-4 px-4 transition-all duration-300"
                style={{
                    top: showUI ? "1rem" : "-4rem",
                    opacity: showUI ? 1 : 0,
                    pointerEvents: showUI ? "auto" : "none",
                }}
            >
                {/* 閉じるボタン */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-black transition-all duration-300 hover:bg-[#fff]/10"
                    aria-label="閉じる"
                >
                    <FaXmark className="h-6 w-6 text-white" />
                </button>

                {/* タイトル */}
                <div className="flex h-10 min-w-0 flex-1 items-center justify-center">
                    <p className="truncate rounded-2xl bg-black px-4 py-1 text-lg text-white">
                        {images[currentIndex].title}
                    </p>
                </div>

                {/* ダウンロードボタン */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        void downloadImage();
                    }}
                    className="flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-black transition-all duration-300 hover:bg-[#fff]/10"
                    aria-label="画像をダウンロード"
                >
                    <MdFileDownload className="h-6 w-6 text-white" />
                </button>
            </div>

            {/* 左ナビゲーション */}
            {currentIndex > 0 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        prevImage();
                    }}
                    className="absolute top-1/2 left-4 z-[10001] -translate-y-1/2 text-6xl text-white transition-opacity duration-300 hover:text-[#FFB400]"
                    style={{ opacity: showUI ? 1 : 0, pointerEvents: showUI ? "auto" : "none" }}
                >
                    ‹
                </button>
            )}

            {/* 右ナビゲーション */}
            {currentIndex < images.length - 1 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        nextImage();
                    }}
                    className="absolute top-1/2 right-4 z-[10001] -translate-y-1/2 text-6xl text-white transition-opacity duration-300 hover:text-[#FFB400]"
                    style={{ opacity: showUI ? 1 : 0, pointerEvents: showUI ? "auto" : "none" }}
                >
                    ›
                </button>
            )}

            {/* 画像表示エリア - 横スクロールコンテナ、スワイプで移動 */}
            <div
                ref={containerRef}
                className="relative z-10 h-full w-full overflow-hidden py-[4rem]"
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
                            onClick={(e) => {
                                e.stopPropagation();
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
