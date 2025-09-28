import React from "react";

interface NumberKeypadProps {
    onNumberClick: (num: string) => void;
    onClear: () => void;
    onBackspace?: () => void;
}

export function NumberKeypad({onNumberClick, onClear, onBackspace}: NumberKeypadProps) {
    // 共通のボタンスタイル
    const buttonClass = "w-16 h-16 border-1 border-gray-400 bg-transparent text-white rounded transition-colors shadow-sm cursor-pointer hover:bg-[#FFB400] hover:border-transparent active:bg-[#FFB400] active:border-transparent";
    return (
        <div className="grid grid-cols-3 gap-4 rounded-lg max-w-xs">
            {/* 数字ボタン 1-9 */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button key={num} className={buttonClass} onClick={() => onNumberClick(num.toString())}>
                    <span className="text-2xl font-medium">
                        {num}
                    </span>
                </button>
            ))}

            {/* 下段：クリア、0、バックスペース */}
            <button className={buttonClass} onClick={onClear}>
                <span className="text-2xl font-extrabold">
                    C
                </span>
            </button>

            <button className={buttonClass} onClick={() => onNumberClick("0")}>
                <span className="text-2xl font-medium">
                    0
                </span>
            </button>

            {onBackspace ? (
                <button className={buttonClass} onClick={onBackspace}>
                    {/*Todo:BackspaceIconがない。*/}
                    ⌫
                    {/*<img src="/images/backspace.png" alt="backspace" className="w-4 h-4"/>*/}
                </button>
            ) : (
                <div className="w-16 h-16"></div>
            )}
        </div>
    );
}

export default NumberKeypad;