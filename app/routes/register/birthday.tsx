import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import NumberKeypad from "../../components/ui/number-keypad";
import RecTimeFlame from "../../components/ui/recTimeFlame";
import { useStudentData } from "~/hooks/useStudentData";

export function meta() {
    return [{ title: "誕生日入力 - RecTime" }];
}

function DateInputField({
    value,
    defaultValue,
    length,
    isCurrentField,
}: {
    value: string;
    defaultValue: string;
    length: number;
    isCurrentField: boolean;
}) {
    return (
        <div className="flex gap-1">
            {Array.from({ length }).map((_, i) => (
                <React.Fragment key={i}>
                    <div className="flex flex-col items-center gap-1">
                        {value[i] ? (
                            <p className="w-5 text-center leading-none">{value[i]}</p>
                        ) : i === value.length && isCurrentField ? (
                            <div className="flex h-9 w-5 items-center justify-start">
                                <div className="h-6 w-0.5 animate-pulse bg-white"></div>
                            </div>
                        ) : (
                            <p className="w-5 text-center leading-none text-gray-400">{defaultValue[i]}</p>
                        )}
                        <div className="h-[3px] w-5 rounded-full bg-[#F5F5DC]">
                            {isCurrentField && i === value.length && (
                                <div className="h-full w-full rounded-full bg-[#FFB400]"></div>
                            )}
                        </div>
                    </div>
                </React.Fragment>
            ))}
        </div>
    );
}

export default function Birthday() {
    const navigate = useNavigate();
    const { registerStudent } = useStudentData();
    const [year, setYear] = useState("");
    const [month, setMonth] = useState("");
    const [day, setDay] = useState("");
    const [currentField, setCurrentField] = useState<"year" | "month" | "day">("year");
    const [status, setStatus] = useState<
        "idle" | "invalid-date" | "not-found" | "auth-failed" | "network-error" | "no-student-id"
    >("idle");
    const [isLoading, setIsLoading] = useState(false);

    // 学籍番号の確認
    useEffect(() => {
        const studentId = sessionStorage.getItem("temp-student-id");
        if (!studentId) {
            setStatus("no-student-id");
            setTimeout(() => navigate("/register/student-id"), 2000);
        }
    }, [navigate]);

    const handleNumberClick = (num: string) => {
        setStatus("idle");
        if (currentField === "year" && year.length < 4) {
            setYear((prev) => prev + num);
            if (year.length === 3) setCurrentField("month");
        } else if (currentField === "month" && month.length < 2) {
            setMonth((prev) => prev + num);
            if (month.length === 1) setCurrentField("day");
        } else if (currentField === "day" && day.length < 2) {
            setDay((prev) => prev + num);
        }
    };

    const handleClear = () => {
        setYear("");
        setMonth("");
        setDay("");
        setCurrentField("year");
        setStatus("idle");
    };

    const handleBackspace = () => {
        if (currentField === "day" && day.length > 0) {
            setDay((prev) => prev.slice(0, -1));
        } else if (currentField === "day" && day.length === 0 && month.length > 0) {
            setCurrentField("month");
            setMonth((prev) => prev.slice(0, -1));
        } else if (currentField === "month" && month.length > 0) {
            setMonth((prev) => prev.slice(0, -1));
        } else if (currentField === "month" && month.length === 0 && year.length > 0) {
            setCurrentField("year");
            setYear((prev) => prev.slice(0, -1));
        } else if (currentField === "year" && year.length > 0) {
            setYear((prev) => prev.slice(0, -1));
        }
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
            setTimeout(() => navigate("/register/student-id"), 2000);
            return;
        }

        if (!validateDate(year, month, day)) {
            setStatus("invalid-date");
            return;
        }

        // データベース形式に合わせる (YYYYMMDD)
        const birthday = `${year}${month.padStart(2, "0")}${day.padStart(2, "0")}`;
        // 表示用 (YYYY-MM-DD)
        const birthdayDisplay = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

        setIsLoading(true);
        setStatus("idle");

        try {
            // API呼び出し: 学籍番号+誕生日で検証
            const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
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

            // sessionStorageをクリア
            sessionStorage.removeItem("temp-student-id");

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
                    handleRegister();
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
            <div className="flex h-full max-w-150 flex-col items-center justify-center gap-8">
                <div className="flex flex-col items-center gap-2">
                    <h2 className="text-xl font-semibold text-[#FFB400]">生年月日を入力</h2>
                    <p className="text-sm font-light text-white">生年月日を入力してください</p>
                </div>

                {/* 入力表示エリア */}
                <div className="over relative rounded-lg border-none shadow-none outline-none">
                    <div className="relative flex h-30 w-79 items-center justify-center rounded-sm border-1 border-[#FFB400] bg-blue-800 text-center shadow-lg">
                        <div className="flex h-10 w-47 flex-col items-center justify-end font-mono text-4xl text-white">
                            <div className="flex items-center gap-2">
                                {/* Year */}
                                <div className="flex flex-col items-start">
                                    <DateInputField
                                        value={year}
                                        defaultValue="2001"
                                        length={4}
                                        isCurrentField={currentField === "year"}
                                    />
                                </div>

                                <span>-</span>

                                {/* Month */}
                                <div className="flex flex-col items-center">
                                    <DateInputField
                                        value={month}
                                        defaultValue="01"
                                        length={2}
                                        isCurrentField={currentField === "month"}
                                    />
                                </div>

                                <span>-</span>

                                {/* Day */}
                                <div className="flex flex-col items-center">
                                    <DateInputField
                                        value={day}
                                        defaultValue="01"
                                        length={2}
                                        isCurrentField={currentField === "day"}
                                    />
                                </div>
                            </div>
                        </div>

                        <h4 className="absolute bottom-3 text-sm font-normal text-red-600">
                            {status === "invalid-date" && "正しい日付を入力してください"}
                            {status === "not-found" && "学籍番号または誕生日が違う可能性があります"}
                            {status === "auth-failed" && "認証に失敗しました"}
                            {status === "network-error" && "サーバーに接続できませんでした"}
                            {status === "no-student-id" && "学籍番号が設定されていません"}
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
                {/*Todo:登録した後の遷移方法を改善。*/}
                <div className="flex w-57 items-center justify-between">
                    <button
                        onClick={handleBack}
                        disabled={isLoading}
                        className="box-border h-10 cursor-pointer rounded-lg border-1 bg-none px-6 py-2 font-medium text-white transition-colors"
                    >
                        戻る
                    </button>
                    <button
                        className="cursor-pointer rounded-lg bg-[#FFB400] px-6 py-2 font-medium shadow-sm transition-colors hover:bg-yellow-400 disabled:cursor-not-allowed disabled:bg-gray-400"
                        onClick={handleRegister}
                        disabled={!isComplete || isLoading}
                    >
                        <span className="text-white">{isLoading ? "取得中" : "登録"}</span>
                    </button>
                </div>
            </div>
        </RecTimeFlame>
    );
}
