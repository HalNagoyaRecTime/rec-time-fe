import React, { useState } from "react";
import { useNavigate } from "react-router";
import RecTimeFlame from "../../components/ui/recTimeFlame";
import NumberKeypad from "../../components/ui/number-keypad";
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

    const handleNumberClick = (num: string) => {
        setStudentId((prev) => (prev.length < 5 ? prev + num : prev));
        setStatus("idle");
    };

    const handleClear = () => {
        setStudentId("");
        setStatus("idle");
    };

    const handleBackspace = () => {
        setStudentId((prev) => prev.slice(0, -1));
        setStatus("idle");
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

    // Ctrl+Enterで次へボタンを押す
    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === "Enter") {
                event.preventDefault();
                handleNext();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [studentId]);

    return (
        <RecTimeFlame>
            <div className="flex h-full max-w-150 flex-col items-center justify-center gap-8 [@media(max-height:680px)]:gap-3">
                <div className="flex flex-col items-center gap-2 [@media(max-height:680px)]:gap-0">
                    <h2 className="text-xl font-semibold text-[#111646]">学籍番号入力</h2>
                    <p className="text-sm font-semibold text-[#111646]">学籍番号を入力してください</p>
                </div>

                {/* 入力表示エリア */}
                <div className="relative flex h-30 w-79 items-center justify-center rounded-md bg-[#000D91]/80 text-center shadow-lg">
                    <div className="flex h-10 w-47 flex-col items-center justify-end font-mono text-5xl text-white">
                        <div className="flex gap-3">
                            {Array.from(studentId).map((digit, i) => (
                                <div key={i} className="flex flex-col items-center">
                                    <p className="h-12 w-7 text-center leading-none">{digit}</p>
                                    <div className="h-[3px] w-7 rounded-full bg-[#F5F5DC]"></div>
                                </div>
                            ))}
                            {studentId.length < 5 && (
                                <div className="jus flex h-full flex-col">
                                    <div className="flex h-12 w-7 items-center text-center leading-none">
                                        <div className="h-8 w-0.5 animate-pulse bg-white"></div>
                                    </div>
                                    <div className="h-[3px] w-7 rounded-full bg-[#F5F5DC]"></div>
                                </div>
                            )}
                        </div>
                    </div>
                    {status === "no-input" && (
                        <div className="absolute bottom-2 h-6">
                            <h4 className="flex h-full items-center rounded-md bg-red-600 px-4 text-sm font-normal text-white">
                                学籍番号を入力してください
                            </h4>
                        </div>
                    )}
                </div>

                {/* キーパッド */}
                <NumberKeypad onNumberClick={handleNumberClick} onClear={handleClear} onBackspace={handleBackspace} />

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
