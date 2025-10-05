import React from "react";

interface StudentInfoBarProps {
    studentId: string | null;
    onUpdate: () => void;
    isLoading: boolean;
}

export default function StudentInfoBar({ studentId, onUpdate, isLoading }: StudentInfoBarProps) {
    return (
        <div className="flex w-full items-center justify-end gap-6 pb-5">
            <p className="text-sm text-white/70">
                学籍番号：<span>{studentId || "未設定"}</span>
            </p>
            <button
                className="h-auto w-9 cursor-pointer px-2 disabled:opacity-50"
                onClick={onUpdate}
                disabled={isLoading}
            >
                <img src="/icons/app-icon/close.png" alt="" />
            </button>
        </div>
    );
}