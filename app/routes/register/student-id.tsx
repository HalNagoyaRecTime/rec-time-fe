import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import RecTimeFlame from "../../components/ui/recTimeFlame";
import NumberKeypad from "../../components/ui/number-keypad";

export function meta() {
    return [{ title: "学籍番号入力 - RecTime" }];
}

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
            <div className="flex h-full max-w-150 flex-col items-center justify-center gap-8">
                <div className="flex flex-col items-center gap-2">
                    <h2 className="text-xl font-semibold text-[#FFB400]">学籍番号入力</h2>
                    <p className="text-sm font-light text-white">学籍番号を入力してください</p>
                </div>

                {/* 入力表示エリア */}
                <div className="over relative rounded-lg border-none shadow-none outline-none">
                    <div className="relative flex h-30 w-79 items-center justify-center rounded-sm border-1 border-[#FFB400] bg-blue-800 text-center shadow-lg">
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
                                        <div className="h-[3px] w-7 rounded-full bg-[#FFB400]"></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <h4 className="absolute bottom-3 text-sm font-normal text-red-600">
                            {status === "no-input" && "学籍番号を入力してください"}
                        </h4>
                    </div>

                    {/* 4つの角に配置される45度回転した正方形 */}
                    <div className="absolute -top-[11px] -left-[11px] flex h-5 w-5 rotate-45 justify-center bg-transparent">
                        {/* 左上の三角形 */}
                        <div className="relative">
                            <div className="absolute -right-3 bottom-[7px] h-0 w-0 rotate-45 border-r-6 border-b-6 border-r-transparent border-b-[#FFB400] border-l-transparent"></div>
                        </div>
                    </div>
                    <div className="absolute -top-[11px] -right-[11px] flex h-5 w-5 rotate-135 justify-center">
                        {/* 右上の三角形 */}
                        <div className="relative">
                            <div className="absolute -right-3 bottom-[7px] h-0 w-0 rotate-45 border-r-6 border-b-6 border-r-transparent border-b-[#FFB400] border-l-transparent"></div>
                        </div>
                    </div>
                    <div className="absolute -right-[11px] -bottom-[11px] flex h-5 w-5 rotate-225 justify-center">
                        {/* 右下の三角形 */}
                        <div className="relative">
                            <div className="absolute -right-3 bottom-[7px] h-0 w-0 rotate-45 border-r-6 border-b-6 border-r-transparent border-b-[#FFB400] border-l-transparent"></div>
                        </div>
                    </div>
                    <div className="absolute -bottom-[11px] -left-[11px] flex h-5 w-5 rotate-315 justify-center">
                        {/* 右下の三角形 */}
                        <div className="relative">
                            <div className="absolute -right-3 bottom-[7px] h-0 w-0 rotate-45 border-r-6 border-b-6 border-r-transparent border-b-[#FFB400] border-l-transparent"></div>
                        </div>
                    </div>
                </div>

                {/* キーパッド */}
                <NumberKeypad onNumberClick={handleNumberClick} onClear={handleClear} onBackspace={handleBackspace} />

                {/* 登録ボタン */}
                {/*Todo:登録した後の遷移方法を修正。*/}
                <div className="flex w-57 items-center justify-between">
                    <Link to="/settings" className="py-2 pr-6 text-white">
                        キャンセル
                    </Link>
                    <button
                        onClick={handleNext}
                        disabled={!isValidInput}
                        className="cursor-pointer rounded-lg bg-[#FFB400] px-6 py-2 font-medium shadow-sm transition-colors hover:bg-yellow-400 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                        <span className="text-white">次へ</span>
                    </button>
                </div>
            </div>
        </RecTimeFlame>
    );
}
