import { useState, useRef, useEffect } from "react";

// アニメーションステートマシン：idle → opening → open → closing → idle
type AnimationState = "idle" | "opening" | "open" | "closing";

/**
 * スケジュールイベントカード用のアニメーション・モーダル管理カスタムフック
 *
 * 責務：
 * - フリップカードの回転管理
 * - モーダルの開閉状態管理
 * - アニメーション状態管理（ステートマシン）
 * - 2秒リカバリメカニズム（スタック状態防止）
 * - タイムアウト管理とクリーンアップ
 */
export function useScheduleEventCardAnimation(
    onModalStateChange?: (isOpen: boolean) => void
) {
    const [showModal, setShowModal] = useState(false);
    const [rotationDeg, setRotationDeg] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [animationState, setAnimationState] = useState<AnimationState>("idle");

    // タイムアウトとクリーンアップを管理するRef
    const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const recoveryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // クリーンアップ効果：アンマウント時にタイムアウトをクリアしてメモリリークと状態不一致を防ぐ
    useEffect(() => {
        return () => {
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
            }
            if (recoveryTimeoutRef.current) {
                clearTimeout(recoveryTimeoutRef.current);
            }
        };
    }, []);

    // リカバリ機構：アニメーションが長時間スタックしている場合、UIの壊れた状態を防ぐためにリセット
    useEffect(() => {
        if (animationState !== "idle") {
            // 既存のリカバリタイムアウトをクリア
            if (recoveryTimeoutRef.current) {
                clearTimeout(recoveryTimeoutRef.current);
            }

            // スタックしたアニメーション状態から復帰するために2秒のタイムアウトを設定
            recoveryTimeoutRef.current = setTimeout(() => {
                console.warn(
                    "[useScheduleEventCardAnimation] Animation recovery triggered - State was stuck in",
                    animationState
                );
                setIsAnimating(false);
                setAnimationState("idle");
                setShowModal(false);
                setRotationDeg((prev) => prev % 360);
            }, 2000);
        }
    }, [animationState]);

    // ステートマシンとバリデーションを使用した堅牢なモーダルオープン
    const handleOpenModal = () => {
        // ガード：複数の同時アニメーションを防止
        if (isAnimating || animationState !== "idle") {
            console.warn(
                "[useScheduleEventCardAnimation] Opening prevented - Animation already in progress:",
                animationState
            );
            return;
        }

        console.log("[useScheduleEventCardAnimation] Opening modal - Starting animation");
        setIsAnimating(true);
        setAnimationState("opening");

        // カードを直ぐに回転
        setRotationDeg((prev) => prev + 180);

        // 200msでモーダルを表示（回転開始後だが完了前）
        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
        }
        animationTimeoutRef.current = setTimeout(() => {
            console.log("[useScheduleEventCardAnimation] Modal showing");
            setShowModal(true);
            onModalStateChange?.(true);
            setAnimationState("open");
        }, 200);

        // 600msでアニメーション完了とリセット
        setTimeout(() => {
            console.log("[useScheduleEventCardAnimation] Opening animation complete");
            setIsAnimating(false);
            // 360で余りを取ってリセットして、非常に大きい回転値を防止
            setRotationDeg((prev) => prev % 360);
            // タイムアウトRefをクリア
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
                animationTimeoutRef.current = null;
            }
        }, 600);
    };

    // ステート検証による堅牢なモーダルクローズアニメーション
    const handleModalClosing = () => {
        // ガード：モーダルが実際に開いている場合のみクローズを許可
        if (isAnimating || animationState !== "open") {
            console.warn(
                "[useScheduleEventCardAnimation] Closing prevented - Invalid animation state:",
                animationState
            );
            return;
        }

        console.log("[useScheduleEventCardAnimation] Closing modal - Starting reverse animation");
        setIsAnimating(true);
        setAnimationState("closing");

        // カードを180度戻す
        setRotationDeg((prev) => prev + 180);

        // 600msでアニメーション完了
        setTimeout(() => {
            console.log("[useScheduleEventCardAnimation] Closing animation complete");
            setIsAnimating(false);
            // 360で余りを取ってリセット
            setRotationDeg((prev) => prev % 360);
            // タイムアウトRefをクリア
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
                animationTimeoutRef.current = null;
            }
        }, 600);
    };

    // アニメーション完了後の最終的なモーダルクローズ
    const handleCloseModal = () => {
        console.log("[useScheduleEventCardAnimation] Modal fully closed");
        setShowModal(false);
        setAnimationState("idle");
        onModalStateChange?.(false);
    };

    return {
        // State
        showModal,
        rotationDeg,
        isAnimating,
        animationState,

        // Handlers
        handleOpenModal,
        handleModalClosing,
        handleCloseModal,
    };
}