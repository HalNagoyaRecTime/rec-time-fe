import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import RecTimeFlame from "../components/ui/recTimeFlame";
import { FaAngleRight } from "react-icons/fa6";
import { useStudentData } from "~/hooks/useStudentData";
import { useNotificationSettings } from "~/hooks/useNotificationSettings";
import { clearAllCache } from "~/utils/clearCache";
import type { Message } from "~/types/timetable";
import type { Route } from "./+types/settings";

export const meta: Route.MetaFunction = () => {
    return [
        { title: "設定 - recTime" },
    ];
};

type ModalType = "notification" | "clearCache" | null;

export default function Settings() {
    const navigate = useNavigate();
    const { studentData } = useStudentData();
    const { isEnabled: isPushEnabled, toggleNotification } = useNotificationSettings();
    const [modalType, setModalType] = useState<ModalType>(null);
    const [message, setMessage] = useState<Message>({ type: null, content: "" });
    const [isErrorPulse, setIsErrorPulse] = useState(false);

    // 通知設定が変更された時の処理
    const handleNotificationToggle = async (enabled: boolean) => {
        if (enabled) {
            setMessage({ type: null, content: "" });
            const success = await toggleNotification(true);
            if (success) {
                setMessage({ type: "success", content: "通知をオンにしました" });
                setIsErrorPulse(false);
            } else {
                setMessage({ type: "error", content: "端末の設定から通知を許可してください" });
                // パルスアニメーションをトリガー
                setIsErrorPulse(true);
                setTimeout(() => setIsErrorPulse(false), 500);
            }
        } else {
            // 通知をオフにする前に確認
            setModalType("notification");
        }
    };

    // 通知オフを確定
    const confirmTurnOffNotification = async () => {
        await toggleNotification(false);
        setModalType(null);
        setMessage({ type: "success", content: "通知をオフにしました" });
    };

    // キャッシュ削除ボタンクリック
    const handleClearCache = () => {
        setModalType("clearCache");
    };

    // キャッシュ削除を確定
    const confirmClearCache = async () => {
        try {
            await clearAllCache();
            setModalType(null);
            // 登録ページにリダイレクト
            navigate("/register/student-id");
        } catch (error) {
            console.error("[Settings] キャッシュ削除エラー:", error);
            setMessage({ type: "error", content: "キャッシュの削除に失敗しました" });
            setModalType(null);
        }
    };

    // モーダルをキャンセル
    const cancelModal = () => {
        setModalType(null);
    };

    return (
        <RecTimeFlame>
            <div className="flex w-full flex-col gap-6">
                {/*ユーザーカード*/}
                <div className="box-border overflow-hidden rounded-lg border-1 border-black/50 shadow-2xl">
                    <div className="flex flex-col items-center justify-center bg-[#000D91]/70 pt-4 pb-1">
                        <div className="flex w-full justify-start pl-5">
                            <h3 className="font-medium text-white">学籍番号</h3>
                        </div>

                        <div className="relative mb-1 flex w-full items-center justify-center">
                            <h2
                                className="cursor-pointer text-3xl font-medium text-white select-none"
                                onPointerDown={(e) => {
                                    if (!studentData?.f_student_num) return;
                                    const timeoutId = setTimeout(() => {
                                        const text = studentData.f_student_num.toString();
                                        // コピー処理
                                        const doCopy = () => {
                                            setMessage({ type: "success", content: "学籍番号をコピーしました" });
                                            setTimeout(() => setMessage({ type: null, content: "" }), 2000);
                                            if (window && window.navigator && window.navigator.vibrate) {
                                                window.navigator.vibrate(80);
                                            }
                                        };
                                        if (navigator.clipboard && navigator.clipboard.writeText) {
                                            navigator.clipboard.writeText(text)
                                                .then(doCopy)
                                                .catch(() => {
                                                    // フォールバック
                                                    const textarea = document.createElement('textarea');
                                                    textarea.value = text;
                                                    textarea.setAttribute('readonly', '');
                                                    textarea.style.position = 'absolute';
                                                    textarea.style.left = '-9999px';
                                                    document.body.appendChild(textarea);
                                                    textarea.select();
                                                    document.execCommand('copy');
                                                    document.body.removeChild(textarea);
                                                    doCopy();
                                                });
                                        } else {
                                            // フォールバック
                                            const textarea = document.createElement('textarea');
                                            textarea.value = text;
                                            textarea.setAttribute('readonly', '');
                                            textarea.style.position = 'absolute';
                                            textarea.style.left = '-9999px';
                                            document.body.appendChild(textarea);
                                            textarea.select();
                                            document.execCommand('copy');
                                            document.body.removeChild(textarea);
                                            doCopy();
                                        }
                                    }, 300); // 300ms長押しでコピー
                                    const clear = () => {
                                        clearTimeout(timeoutId);
                                        window.removeEventListener('pointerup', clear);
                                        window.removeEventListener('pointercancel', clear);
                                    };
                                    window.addEventListener('pointerup', clear);
                                    window.addEventListener('pointercancel', clear);
                                }}
                            >
                                {studentData?.f_student_num || "-----"}
                            </h2>
                            <Link
                                to="/register/student-id"
                                className="absolute right-2 flex h-10 w-10 cursor-pointer p-2"
                            >
                                <FaAngleRight className="h-full w-full text-white" />
                            </Link>
                        </div>
                        <div className="h-5">
                            {message?.type && message.content && (
                                <h4
                                    className={`flex h-full items-center rounded-md px-2 pb-[2px] text-xs font-normal text-white whitespace-nowrap ${
                                        message.type === "success" ? "bg-green-600" : "bg-red-600"
                                    } ${
                                        isErrorPulse && message.type === "error"
                                            ? "animate-error-pulse"
                                            : ""
                                    }`}
                                >
                                    {message.content}
                                </h4>
                            )}
                        </div>
                    </div>
                    <div className="flex w-full px-6 py-4 text-white">
                        <div className="w-fit shrink-0 flex-col pr-5 text-black">
                            <p>クラス</p>
                            <p>出席番号</p>
                            <p>氏名</p>
                        </div>
                        <div className="flex w-full min-w-0 flex-1 flex-col text-[#000D91]">
                            <p className="overflow-hidden text-ellipsis whitespace-nowrap">
                                {studentData?.f_class || "---"}
                            </p>
                            <p className="overflow-hidden text-ellipsis whitespace-nowrap">
                                {studentData?.f_number || "---"}
                            </p>
                            <p className="overflow-hidden text-ellipsis whitespace-nowrap">
                                {studentData?.f_name || "---"}
                            </p>
                        </div>
                    </div>
                </div>

                {/*設定*/}
                <div className="flex flex-col gap-4 px-2">
                    <div className="flex w-full items-center justify-end gap-3">
                        <div className="flex items-center gap-3">
                            <p className="text-sm font-bold text-[#000D91]">通知を許可</p>
                        </div>

                        <label className="relative inline-flex cursor-pointer items-center">
                            <input
                                type="checkbox"
                                className="peer sr-only"
                                checked={isPushEnabled}
                                onChange={(e) => handleNotificationToggle(e.target.checked)}
                            />
                            <div className="peer relative h-6 w-11 rounded-full bg-gray-600 transition-colors duration-200 ease-in-out peer-checked:bg-[#000D91] peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:duration-200 after:content-[''] peer-checked:after:translate-x-full"></div>
                        </label>
                    </div>

                    <div className="flex w-full justify-end">
                        <button
                            onClick={handleClearCache}
                            className="cursor-pointer rounded-lg border-1 border-red-600 bg-transparent px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
                        >
                            キャッシュを削除
                        </button>
                    </div>
                </div>

                {/* 確認モーダル - 通知オフ */}
                {modalType === "notification" && (
                    <div className="fixed inset-0 z-100 flex h-screen w-full items-center justify-center bg-black/50">
                        <div className="w-80 rounded-lg border-1 border-black bg-white p-6 shadow-lg">
                            <h3 className="mb-4 text-center text-lg font-semibold text-black">
                                通知をオフにしますか？
                            </h3>
                            <p className="mb-6 text-center text-sm text-black">イベントの通知が届かなくなります</p>
                            <div className="flex gap-4">
                                <button
                                    onClick={cancelModal}
                                    className="flex-1 cursor-pointer rounded-lg border-1 border-black bg-transparent px-4 py-2 text-black transition-colors hover:bg-black/10"
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={confirmTurnOffNotification}
                                    className="flex-1 cursor-pointer rounded-lg bg-[#000D91] px-4 py-2 text-white transition-colors hover:bg-[#000D91]/80"
                                >
                                    オフにする
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 確認モーダル - キャッシュ削除 */}
                {modalType === "clearCache" && (
                    <div className="fixed inset-0 z-100 flex h-screen w-full items-center justify-center bg-black/50">
                        <div className="w-80 rounded-lg border-1 border-black bg-white p-6 shadow-lg">
                            <h3 className="mb-4 text-center text-lg font-semibold text-black">
                                キャッシュを削除しますか？
                            </h3>
                            <p className="mb-6 text-center text-sm text-black">
                                すべてのユーザーデータが削除され、登録画面に戻ります
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={cancelModal}
                                    className="flex-1 cursor-pointer rounded-lg border-1 border-black bg-transparent px-4 py-2 text-black transition-colors hover:bg-black/10"
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={confirmClearCache}
                                    className="flex-1 cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
                                >
                                    削除する
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </RecTimeFlame>
    );
}
