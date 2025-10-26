import React from "react";
import { FaEject } from "react-icons/fa6";
import type { Message } from "~/types/timetable";

interface StudentInfoBarProps {
    studentId: string | null;
    onUpdate: () => void;
    isLoading: boolean;
    message?: Message;
}

export default function StudentInfoBar({ studentId, onUpdate, isLoading, message }: StudentInfoBarProps) {
    return (
        <div className="flex h-12 w-full items-center justify-between gap-6 pb-5">
            {/* 左側：メッセージ表示 */}
            <div className="flex h-full flex-1 pl-2">
                {message?.type && message.content && (
                    <p
                        className={`flex h-full w-fit items-center rounded-md px-5 text-center text-sm whitespace-nowrap text-white ${
                            message.type === "success" ? "bg-green-400" : "bg-red-600"
                        }`}
                    >
                        {message.content}
                    </p>
                )}
            </div>

            {/* 右側：学籍番号と更新ボタン */}
            <div className="flex items-center gap-6">
                <p className="text-sm whitespace-nowrap text-[#111646]">
                    学籍番号：<span>{studentId || "未設定"}</span>
                </p>
                <button
                    className="h-auto w-9 cursor-pointer px-2 disabled:opacity-50"
                    onClick={onUpdate}
                    disabled={isLoading}
                >
                    <FaEject className="mb-[2px] h-4 w-4 text-[#111646]" />
                </button>
            </div>
        </div>
    );
}
