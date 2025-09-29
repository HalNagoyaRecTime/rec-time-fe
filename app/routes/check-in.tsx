import React, { useState } from "react";
import RecTimeFlame from "../components/ui/recTimeFlame";
import NumberKeypad from "../components/ui/number-keypad";
import { Link, useNavigate } from "react-router";
import { fetchByGakuseki } from "../api/student.js";
import { showEventNotification } from "../utils/notifications";

type Status = "no-id" | "loading" | "success" | "error";

// === 저장 키 ===
// === LocalStorage キー ===
const LS_KEY_ID = "student:id";
const LS_KEY_EVENTS = (id: string) => `events:list:${id}`;
const LS_KEY_LAST_UPDATED = "student:payload:lastUpdated";

function saveStudentId(id: string) {
    localStorage.setItem(LS_KEY_ID, id);
}

export default function CheckIn() {
    const navigate = useNavigate();
    const [studentId, setStudentId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<Status | "">("");

    const handleNumberClick = (num: string) => {
        // 最大5桁制限
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

    // === 学番保存とAPI呼び出し ===
    const handleSubmit = async () => {
        const id = studentId.trim();

        // バリデーション
        if (!id) {
            alert("学籍番号を入力してください");
            return;
        }
        if (!/^\d+$/.test(id)) {
            alert("学籍番号は数字のみで入力してください");
            return;
        }

        setIsLoading(true);
        setStatus("loading");

        try {
            // API呼び出し
            const result = await fetchByGakuseki(id);
            const payload = result.payload;
            const isFromCache = result.isFromCache;

            // 学籍番号チェック
            if (payload.m_students.f_student_id !== id) {
                setStatus("no-id");
                return;
            }

            // LocalStorageに保存
            saveStudentId(id);
            localStorage.setItem("student:data", JSON.stringify(payload.m_students));
            localStorage.setItem(LS_KEY_EVENTS(id), JSON.stringify(payload.t_events));

            // オンライン取得時のみ最終更新時間を更新
            if (!isFromCache) {
                localStorage.setItem(LS_KEY_LAST_UPDATED, new Date().toISOString());
            }

            // 通知スケジュール
            // scheduleAllNotifications(payload.t_events);
            // ✅ 테스트용: 5초 후 첫 알림 확인
            if (payload.t_events.length > 0) {
                setTimeout(() => {
                    showEventNotification(payload.t_events[0]);
                }, 5000);
            }

            // キャッシュ取得時は異なるステータスを設定
            setStatus(isFromCache ? "error" : "success");
            navigate("/settings", { replace: true });
        } catch (error) {
            console.error("API エラー:", error);
            setStatus("error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <RecTimeFlame>
            <div className="flex max-w-150 flex-col items-center gap-8">
                <div className="flex flex-col items-center gap-2">
                    <h2 className="text-xl font-semibold text-[#FFB400]">学籍番号入力</h2>
                    <p className="text-sm font-light text-white">学籍番号を入力してください</p>
                </div>

                {/* 入力表示エリア */}
                <div className="over relative rounded-lg border-none shadow-none outline-none">
                    <div className="relative flex h-33 w-79 items-center justify-center rounded-sm border-1 border-[#FFB400] bg-blue-800 text-center shadow-lg">
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
                        <h4 className="absolute bottom-3.5 text-xs font-normal text-red-600">
                            {status === "no-id" && "学籍番号が見つかりません"}
                            {status === "error" && "サーバーに接続出来ません"}
                        </h4>
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
                {/*Todo:登録した後の遷移方法を修正。*/}
                <div className="flex w-57 items-center justify-between">
                    <Link to="/settings" className="py-2 pr-6 text-white">
                        キャンセル
                    </Link>
                    <button
                        onClick={handleSubmit}
                        disabled={!studentId.trim() || isLoading}
                        className="cursor-pointer rounded-lg bg-[#FFB400] px-6 py-2 font-medium shadow-sm transition-colors hover:bg-yellow-400 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                        <span className="text-white">{isLoading ? "取得中" : "登録"}</span>
                    </button>
                </div>
            </div>
        </RecTimeFlame>
    );
}
