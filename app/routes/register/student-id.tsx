import React, { useState, useRef } from "react";
import { useNavigate } from "react-router";
import RecTimeFlame from "../../components/ui/recTimeFlame";
import type { Route } from "./+types/student-id";

export const meta: Route.MetaFunction = () => {
    return [
        { title: "学籍番号入力 - recTime" },
    ];
};

export default function StudentId() {
    const navigate = useNavigate();
    const [studentId, setStudentId] = useState("");
    const [status, setStatus] = useState<"idle" | "no-input">("idle");
    const inputRef = useRef<HTMLInputElement>(null);

    // 初期表示時にsessionStorageから学籍番号を復元
    React.useEffect(() => {
        const savedId = sessionStorage.getItem("temp-student-id");
        if (savedId) {
            setStudentId(savedId);
        }
    }, []);

    // URLパラメータからエラー情報を読み取る
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("error") === "no-input") {
            setStatus("no-input");
        }
    }, []);

    // 自動フォーカス
    React.useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, ""); // 数字のみ許可
        setStudentId(value);
        setStatus("idle");
    };

    const handleClear = () => {
        setStudentId("");
        setStatus("idle");
        inputRef.current?.focus();
    };

    const handleNext = () => {
        const id = studentId.trim();
        if (!/^\d+$/.test(id) || id.length === 0) {
            setStatus("no-input");
            return;
        }

        // sessionStorageに一時保存
        sessionStorage.setItem("temp-student-id", id);

        // 誕生日入力ページへ遷移
        navigate("/register/birthday");
    };

    const handleCancel = () => {
        // sessionStorageから一時保存データを削除
        sessionStorage.removeItem("temp-student-id");
        sessionStorage.removeItem("temp-birthday-year");
        sessionStorage.removeItem("temp-birthday-month");
        sessionStorage.removeItem("temp-birthday-day");

        // 設定画面へ遷移
        navigate("/settings");
    };

    // 入力チェック：数字のみで1文字以上
    const isValidInput = studentId.length > 0 && /^\d+$/.test(studentId);

    // Enterキーで次へボタンを押す
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && isValidInput) {
            e.preventDefault();
            handleNext();
        }
    };

    return (
        <RecTimeFlame>
            <div className="flex h-full max-w-150 flex-col items-center justify-center gap-8 [@media(max-height:680px)]:gap-3">
                <div className="flex flex-col items-center gap-2 [@media(max-height:680px)]:gap-0">
                    <h2 className="text-xl font-semibold text-[#111646]">学籍番号入力</h2>
                    <p className="text-sm font-semibold text-[#111646]">学籍番号を入力してください</p>
                </div>

                {/* 入力エリア */}
                <div className="flex w-full max-w-md flex-col gap-4">
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={studentId}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="学籍番号"
                            className="w-full rounded-lg border-2 border-gray-300 bg-white px-6 py-4 text-center text-3xl font-medium tracking-wider text-[#111646] shadow-sm transition-colors focus:border-[#000D91] focus:outline-none focus:ring-2 focus:ring-[#000D91]/20"
                            maxLength={10}
                        />
                        {status === "no-input" && (
                            <div className="absolute -bottom-8 left-0 right-0 flex justify-center">
                                <span className="rounded-md bg-red-600 px-4 py-1 text-sm text-white">
                                    学籍番号を入力してください
                                </span>
                            </div>
                        )}
                    </div>

                    {/* クリアボタン */}
                    {studentId.length > 0 && (
                        <button
                            onClick={handleClear}
                            className="mx-auto rounded-lg bg-gray-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600"
                        >
                            クリア
                        </button>
                    )}
                </div>

                {/* 登録ボタン */}
                {/*Todo:登録した後の遷移方法を修正。*/}
                <div className="flex w-57 items-center justify-between">
                    <button onClick={handleCancel} className="h-10 cursor-pointer px-3 font-bold text-[#111646]">
                        キャンセル
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={!isValidInput}
                        className="h-10 cursor-pointer rounded-lg bg-[#FFB400] px-6 font-medium shadow-sm transition-colors hover:bg-yellow-400 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                        <span className="text-lg font-semibold text-white">次へ</span>
                    </button>
                </div>
            </div>
        </RecTimeFlame>
    );
}
