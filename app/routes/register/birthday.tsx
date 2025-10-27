import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import RecTimeFlame from "../../components/ui/recTimeFlame";
import { useStudentData } from "~/hooks/useStudentData";
import { getApiBaseUrl } from "~/utils/apiConfig";
import type { Route } from "./+types/birthday";

export const meta: Route.MetaFunction = () => {
    return [
        { title: "生年月日入力 - recTime" },
    ];
};

export default function Birthday() {
    const navigate = useNavigate();
    const { registerStudent } = useStudentData();
    const [year, setYear] = useState("");
    const [month, setMonth] = useState("");
    const [day, setDay] = useState("");
    const [status, setStatus] = useState<
        "idle" | "invalid-date" | "not-found" | "auth-failed" | "network-error" | "no-student-id"
    >("idle");
    const [isLoading, setIsLoading] = useState(false);
    const yearRef = useRef<HTMLInputElement>(null);
    const monthRef = useRef<HTMLInputElement>(null);
    const dayRef = useRef<HTMLInputElement>(null);

    // 学籍番号の確認
    useEffect(() => {
        const studentId = sessionStorage.getItem("temp-student-id");
        if (!studentId) {
            setStatus("no-student-id");
            setTimeout(() => navigate("/register/student-id?error=no-input"), 2000);
        }
    }, [navigate]);

    // 初期表示時にsessionStorageから年月日を復元
    useEffect(() => {
        const savedYear = sessionStorage.getItem("temp-birthday-year");
        const savedMonth = sessionStorage.getItem("temp-birthday-month");
        const savedDay = sessionStorage.getItem("temp-birthday-day");

        if (savedYear) setYear(savedYear);
        if (savedMonth) setMonth(savedMonth);
        if (savedDay) setDay(savedDay);
    }, []);

    // 初期フォーカス
    useEffect(() => {
        yearRef.current?.focus();
    }, []);

    // 入力内容をsessionStorageに自動保存
    useEffect(() => {
        if (year) {
            sessionStorage.setItem("temp-birthday-year", year);
        } else {
            sessionStorage.removeItem("temp-birthday-year");
        }
    }, [year]);

    useEffect(() => {
        if (month) {
            sessionStorage.setItem("temp-birthday-month", month);
        } else {
            sessionStorage.removeItem("temp-birthday-month");
        }
    }, [month]);

    useEffect(() => {
        if (day) {
            sessionStorage.setItem("temp-birthday-day", day);
        } else {
            sessionStorage.removeItem("temp-birthday-day");
        }
    }, [day]);

    const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, "").slice(0, 4);
        setYear(value);
        setStatus("idle");
        if (value.length === 4) {
            monthRef.current?.focus();
        }
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, "").slice(0, 2);
        setMonth(value);
        setStatus("idle");
        if (value.length === 2) {
            dayRef.current?.focus();
        }
    };

    const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, "").slice(0, 2);
        setDay(value);
        setStatus("idle");
    };

    const handleYearKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && year === "") {
            // 年が空の場合は何もしない
        } else if (e.key === "Enter" && year.length === 4) {
            e.preventDefault();
            monthRef.current?.focus();
        }
    };

    const handleMonthKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && month === "") {
            yearRef.current?.focus();
        } else if (e.key === "Enter" && month.length === 2) {
            e.preventDefault();
            dayRef.current?.focus();
        }
    };

    const handleDayKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && day === "") {
            monthRef.current?.focus();
        } else if (e.key === "Enter" && isComplete && !isLoading) {
            e.preventDefault();
            void handleRegister();
        }
    };

    const handleClear = () => {
        setYear("");
        setMonth("");
        setDay("");
        setStatus("idle");
        yearRef.current?.focus();
    };

    const handleBack = () => {
        navigate("/register/student-id");
    };

    const validateDate = (y: string, m: string, d: string): boolean => {
        if (y.length !== 4 || m.length !== 2 || d.length !== 2) {
            return false;
        }

        const yearNum = parseInt(y, 10);
        const monthNum = parseInt(m, 10);
        const dayNum = parseInt(d, 10);

        if (monthNum < 1 || monthNum > 12) return false;
        if (dayNum < 1 || dayNum > 31) return false;

        const date = new Date(yearNum, monthNum - 1, dayNum);
        return date.getFullYear() === yearNum && date.getMonth() === monthNum - 1 && date.getDate() === dayNum;
    };

    const handleRegister = async () => {
        const studentId = sessionStorage.getItem("temp-student-id");
        if (!studentId) {
            setStatus("no-student-id");
            setTimeout(() => navigate("/register/student-id?error=no-input"), 2000);
            return;
        }

        if (!validateDate(year, month, day)) {
            setStatus("invalid-date");
            return;
        }

        // データベース形式に合わせる (YYYYMMDD)
        const birthday = `${year}${month.padStart(2, "0")}${day.padStart(2, "0")}`;

        setIsLoading(true);
        setStatus("idle");

        try {
            // API呼び出し: 学籍番号+誕生日で検証
            const API_BASE = getApiBaseUrl();
            const res = await fetch(`${API_BASE}/students/by-student-num/${studentId}/birthday/${birthday}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) {
                if (res.status === 404) {
                    setStatus("not-found");
                } else {
                    setStatus("auth-failed");
                }
                setIsLoading(false);
                return;
            }

            const data = await res.json();

            // 成功: useStudentDataフックで一括保存
            const studentData = {
                f_student_id: data.f_student_id || "",
                f_student_num: studentId,
                f_class: data.f_class || null,
                f_number: data.f_number || null,
                f_name: data.f_name || null,
            };
            registerStudent(studentId, birthday, studentData);

            // sessionStorageをクリア（学籍番号と生年月日の入力データ）
            sessionStorage.removeItem("temp-student-id");
            sessionStorage.removeItem("temp-birthday-year");
            sessionStorage.removeItem("temp-birthday-month");
            sessionStorage.removeItem("temp-birthday-day");

            // タイムテーブル画面へ遷移（登録完了パラメータ付き）
            navigate("/timetable?registered=true");
        } catch (err) {
            console.error(err);
            setStatus("network-error");
        } finally {
            setIsLoading(false);
        }
    };

    const isComplete = year.length === 4 && month.length === 2 && day.length === 2;

    // Ctrl+Enterで登録ボタンを押す
    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === "Enter") {
                event.preventDefault();
                if (isComplete && !isLoading) {
                    void handleRegister();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [year, month, day, isComplete, isLoading]);

    return (
        <RecTimeFlame>
            <div className="flex h-full max-w-150 flex-col items-center justify-center gap-8 [@media(max-height:680px)]:gap-3">
                <div className="flex flex-col items-center gap-2 [@media(max-height:680px)]:gap-0">
                    <h2 className="text-xl font-semibold text-[#111646]">生年月日を入力</h2>
                    <p className="text-sm font-semibold text-[#111646]">8桁の生年月日を入力してください</p>
                </div>

                {/* 入力エリア */}
                <div className="flex w-full max-w-md flex-col gap-4">
                    <div className="relative flex items-center justify-center gap-3">
                        {/* 年 */}
                        <div className="flex flex-col gap-1">
                            <input
                                ref={yearRef}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={year}
                                onChange={handleYearChange}
                                onKeyDown={handleYearKeyDown}
                                placeholder="YYYY"
                                className="w-24 rounded-lg border-2 border-gray-300 bg-white px-3 py-3 text-center text-2xl font-medium text-[#111646] shadow-sm transition-colors focus:border-[#000D91] focus:outline-none focus:ring-2 focus:ring-[#000D91]/20"
                                maxLength={4}
                            />
                            <span className="text-center text-xs text-gray-600">年</span>
                        </div>

                        <span className="text-2xl text-[#111646]">/</span>

                        {/* 月 */}
                        <div className="flex flex-col gap-1">
                            <input
                                ref={monthRef}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={month}
                                onChange={handleMonthChange}
                                onKeyDown={handleMonthKeyDown}
                                placeholder="MM"
                                className="w-20 rounded-lg border-2 border-gray-300 bg-white px-3 py-3 text-center text-2xl font-medium text-[#111646] shadow-sm transition-colors focus:border-[#000D91] focus:outline-none focus:ring-2 focus:ring-[#000D91]/20"
                                maxLength={2}
                            />
                            <span className="text-center text-xs text-gray-600">月</span>
                        </div>

                        <span className="text-2xl text-[#111646]">/</span>

                        {/* 日 */}
                        <div className="flex flex-col gap-1">
                            <input
                                ref={dayRef}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={day}
                                onChange={handleDayChange}
                                onKeyDown={handleDayKeyDown}
                                placeholder="DD"
                                className="w-20 rounded-lg border-2 border-gray-300 bg-white px-3 py-3 text-center text-2xl font-medium text-[#111646] shadow-sm transition-colors focus:border-[#000D91] focus:outline-none focus:ring-2 focus:ring-[#000D91]/20"
                                maxLength={2}
                            />
                            <span className="text-center text-xs text-gray-600">日</span>
                        </div>
                    </div>

                    {/* エラーメッセージ */}
                    {status !== "idle" && (
                        <div className="flex justify-center">
                            <span className="rounded-md bg-red-600 px-4 py-1 text-sm text-white">
                                {status === "invalid-date" && "正しい日付を入力してください"}
                                {status === "not-found" && "学籍番号または誕生日が違う可能性があります"}
                                {status === "auth-failed" && "認証に失敗しました"}
                                {status === "network-error" && "サーバーに接続できませんでした"}
                                {status === "no-student-id" && "学籍番号が設定されていません"}
                            </span>
                        </div>
                    )}

                    {/* クリアボタン */}
                    {(year || month || day) && (
                        <button
                            onClick={handleClear}
                            className="mx-auto rounded-lg bg-gray-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600"
                        >
                            クリア
                        </button>
                    )}
                </div>

                {/* 登録ボタン */}
                <div className="flex w-57 items-center justify-between">
                    <button
                        onClick={handleBack}
                        disabled={isLoading}
                        className="bottom-[#111646] box-border flex h-10 cursor-pointer items-center rounded-lg border-2 bg-none px-6 font-bold text-[#111646] transition-colors"
                    >
                        戻る
                    </button>
                    <button
                        className="h-10 cursor-pointer rounded-lg bg-[#FFB400] px-6 font-medium shadow-sm transition-colors hover:bg-yellow-400 disabled:cursor-not-allowed disabled:bg-gray-400"
                        onClick={handleRegister}
                        disabled={!isComplete || isLoading}
                    >
                        <span className="text-lg font-semibold text-white">{isLoading ? "取得中" : "登録"}</span>
                    </button>
                </div>
            </div>
        </RecTimeFlame>
    );
}
