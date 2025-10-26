import React, { useState } from "react";
import { Link } from "react-router-dom";
import RecTimeFlame from "../components/ui/recTimeFlame";
import { FaAngleRight } from "react-icons/fa6";
import { useStudentData } from "~/hooks/useStudentData";
import { useNotificationSettings } from "~/hooks/useNotificationSettings";
import type { Message } from "~/types/timetable";
import type { Route } from "./+types/settings";

export const meta: Route.MetaFunction = () => {
    return [{ title: "設定 - recTime" }];
};

type ModalType = "notification" | null;

export default function Settings() {
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
                                className="absolute right-2 flex h-15 w-15 cursor-pointer items-center justify-center"
                            >
                                <FaAngleRight className="h-6 w-6 text-white" />
                            </Link>
                        </div>
                        <div className="h-5">
                            {message?.type && message.content && (
                                <h4
                                    className={`flex h-full items-center rounded-md px-2 pb-[2px] text-xs font-normal whitespace-nowrap text-white ${
                                        message.type === "success" ? "bg-green-600" : "bg-red-600"
                                    } ${isErrorPulse && message.type === "error" ? "animate-error-pulse" : ""}`}
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
                <div className="flex w-full justify-end">
                    <a
                        href="https://forms.office.com/r/01DKwaYiX2?origin=lprLink"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex w-fit cursor-pointer items-center gap-2 rounded-lg border-1 border-[#000D91]/30 bg-gradient-to-r from-[#000D91]/5 to-[#000D91]/10 px-5 py-3 text-sm font-medium text-[#000D91] shadow-sm transition-all duration-200 hover:border-transparent hover:bg-[#000D91]/70 hover:text-white hover:shadow-md active:scale-95"
                    >
                        <svg
                            className="h-4 w-4 transition-transform group-hover:scale-110"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                        </svg>
                        <span>お問い合わせ</span>
                        <svg
                            className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </a>
                </div>
            </div>
        </RecTimeFlame>
    );
}
