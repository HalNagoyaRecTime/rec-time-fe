import React, { useState } from "react";
import RecTimeFlame from "../components/recTimeFlame";
import NumberKeypad from "../components/number-keypad";
import { Link } from "react-router";

// === 저장 키 ===
const LS_KEY_ID = "student:id";
const LS_KEY_EVENTS = (id: string) => `events:list:${id}`;
const LS_KEY_LAST_UPDATED = "student:payload:lastUpdated";

function getStudentId(): string | null {
    return localStorage.getItem(LS_KEY_ID);
}

function saveStudentId(id: string) {
    localStorage.setItem(LS_KEY_ID, id);
}

export default function CheckIn() {
    const [studentId, setStudentId] = useState("");

    const handleNumberClick = (num: string) => {
        // 5桁制限
        if (studentId.length < 5) {
            setStudentId((prev) => prev + num);
        }
    };

    const handleClear = () => {
        setStudentId("");
    };

    const handleBackspace = () => {
        setStudentId((prev) => prev.slice(0, -1));
    };

    // === 학번 저장 ===
    const handleSubmit = () => {
        const id = studentId.trim();

        // 空欄チェック
        if (!id) {
            alert("学籍番号を入力してください");
            return;
        }

        // 5桁チェック
        if (id.length !== 5) {
            alert("5桁の学籍番号を入力してください");
            return;
        }

        // 数字チェック
        if (!/^\d+$/.test(id)) {
            alert("学籍番号は数字のみで入力してください");
            return;
        }

        console.log("学籍番号登録:", id);
        saveStudentId(id);
        alert(`学籍番号 ${id} を登録しました`);
    };

    return (
        <RecTimeFlame>
            <div className="flex max-w-150 flex-col items-center gap-8">
                <div className="flex flex-col items-center gap-2">
                    <h2 className="text-xl font-semibold text-[#FFB400]">学籍番号入力</h2>
                    <p className="text-sm font-light text-white">5桁の学籍番号を入力してください</p>
                </div>

                {/* 入力表示エリア */}
                <div className="over relative rounded-lg border-none shadow-none outline-none">
                    <div className="flex h-33 w-79 items-center justify-center rounded-sm border-1 border-[#FFB400] bg-blue-800 text-center shadow-lg">
                        <div className="flex h-10 w-47 flex-col items-start justify-end font-mono text-5xl text-white">
                            <p className="tracking-[14px]">{studentId}</p>
                            <div className="flex gap-3">
                                <div className="h-[3px] w-7 rounded-full bg-white"></div>
                                <div className="h-[3px] w-7 rounded-full bg-white"></div>
                                <div className="h-[3px] w-7 rounded-full bg-white"></div>
                                <div className="h-[3px] w-7 rounded-full bg-white"></div>
                                <div className="h-[3px] w-7 rounded-full bg-white"></div>
                            </div>
                        </div>
                    </div>

                    {/* 4つの角に配置される45度回転した正方形 */}
                    {/*Todo:△のデザイン調整する。*/}
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
                <div className="flex w-57 items-center justify-between">
                    <Link to="/settings" className="py-2 pr-6 text-white">
                        キャンセル
                    </Link>
                    <button
                        onClick={handleSubmit}
                        disabled={studentId.length !== 5}
                        className="cursor-pointer rounded-lg bg-[#FFB400] px-6 py-2 font-medium shadow-sm transition-colors hover:bg-yellow-400 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                        <span className="text-white">登録</span>
                    </button>
                </div>
            </div>
        </RecTimeFlame>
    );
}
