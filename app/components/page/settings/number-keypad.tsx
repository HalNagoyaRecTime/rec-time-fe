import React, { useEffect } from "react";
import { IoBackspaceSharp } from "react-icons/io5";

interface NumberKeypadProps {
    onNumberClick: (num: string) => void;
    onClear: () => void;
    onBackspace?: () => void;
}

export function NumberKeypad({ onNumberClick, onClear, onBackspace }: NumberKeypadProps) {
    // キーボードイベントハンドラー
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ctrl+Delete の組み合わせの場合、ブラウザキャッシュ削除を許可し、Cキーの動作を無効化
            if (event.ctrlKey && event.key === "Delete") {
                // ブラウザのデフォルト動作（キャッシュ削除など）を許可
                return;
            }

            // 数字キー（0-9）
            if (event.key >= "0" && event.key <= "9") {
                event.preventDefault();
                onNumberClick(event.key);
            }
            // Escapeキーでクリア、またはCキー（Ctrl+Deleteでない場合のみ）
            else if (event.key === "Escape" || ((event.key === "c" || event.key === "C") && !event.ctrlKey)) {
                event.preventDefault();
                onClear();
            }
            // BackspaceまたはDeleteキー（Ctrlが押されていない場合のみ）
            else if ((event.key === "Backspace" || event.key === "Delete") && onBackspace && !event.ctrlKey) {
                event.preventDefault();
                onBackspace();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [onNumberClick, onClear, onBackspace]);

    // 共通のボタンスタイル
    const buttonClass =
        "w-16 h-16 border-1 border-gray-400 bg-[#000D91]/80 shadow-2xl text-white rounded transition-colors shadow-sm cursor-pointer hover:opacity-90 hover:border-transparent active:opasety active:border-transparent flex items-center justify-center";
    return (
        <div className="grid max-w-xs grid-cols-3 gap-4 rounded-lg [@media(max-height:680px)]:gap-3">
            {/* 数字ボタン 1-9 */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button key={num} className={buttonClass} onClick={() => onNumberClick(num.toString())}>
                    <span className="text-2xl font-medium">{num}</span>
                </button>
            ))}

            {/* 下段：クリア、0、バックスペース */}
            <button className={buttonClass} onClick={onClear}>
                <span className="text-2xl font-extrabold">C</span>
            </button>

            <button className={buttonClass} onClick={() => onNumberClick("0")}>
                <span className="text-2xl font-medium">0</span>
            </button>

            {onBackspace ? (
                <button className={buttonClass} onClick={onBackspace}>
                    {/*Todo:BackspaceIconがない。*/}
                    {/*⌫*/}
                    {/*<img src="/images/backspace.png" alt="backspace" className="w-4 h-4"/>*/}
                    <IoBackspaceSharp className="h-9 w-9" />
                </button>
            ) : (
                <div className="h-16 w-16"></div>
            )}
        </div>
    );
}

export default NumberKeypad;
