import React, { useState } from "react";
import { Link } from "react-router";
import RecTimeFlame from "../components/ui/recTimeFlame";
import settingsYellow from "/icons/app-icon/settings.svg";
import { FaAngleRight } from "react-icons/fa6";
import { useStudentData } from "~/hooks/useStudentData";
import { useNotificationSettings } from "~/hooks/useNotificationSettings";

export default function settings() {
    const { studentData } = useStudentData();
    const { isEnabled: isPushEnabled, toggleNotification } = useNotificationSettings();
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // 通知設定が変更された時の処理
    const handleNotificationToggle = async (enabled: boolean) => {
        if (enabled) {
            const success = await toggleNotification(true);
            if (success) {
                setErrorMessage("");
                setSuccessMessage("通知を有効にしました");
            } else {
                setErrorMessage("通知を有効にするには、ブラウザで通知許可が必要です");
            }
        } else {
            // 通知をオフにする前に確認
            setShowConfirmModal(true);
        }
    };

    // 通知オフを確定
    const confirmTurnOffNotification = async () => {
        await toggleNotification(false);
        setShowConfirmModal(false);
        setSuccessMessage("通知を無効にしました");
    };

    // 通知オフをキャンセル
    const cancelTurnOffNotification = () => {
        setShowConfirmModal(false);
    };

    return (
        <RecTimeFlame>
            <div className="flex w-full flex-col gap-6">
                {/*ユーザーカード*/}
                <div className="shadow- box-border overflow-hidden rounded-lg border-1 border-black/50">
                    <div className="relative flex items-center justify-center bg-[#000D91]/70 p-4 pt-10 pb-5">
                        <h2 className="cursor-pointer text-3xl font-medium text-white">
                            {studentData?.f_student_num || "-----"}
                        </h2>
                        <h3 className="absolute top-3 left-4 font-medium text-white">学籍番号</h3>
                        <Link to="/register/student-id" className="absolute right-2 h-10 w-10 cursor-pointer p-2">
                            <FaAngleRight className="h-full w-full text-white" />
                        </Link>
                        <h4
                            className={`absolute bottom-1.5 rounded-md bg-transparent px-2 py-0.5 text-xs font-normal ${successMessage ? "!bg-green-600" : "!bg-red-600"}`}
                        >
                            {successMessage && successMessage}
                            {!successMessage && errorMessage && errorMessage}
                        </h4>
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
                <div className="px-2">
                    <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8">
                                <img src={settingsYellow} alt="" />
                            </div>
                            <p className="text-white">プッシュ通知</p>
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

                {/* 確認モーダル */}
                {showConfirmModal && (
                    <div className="fixed inset-0 z-50 flex h-screen w-full items-center justify-center bg-black/50">
                        <div className="w-80 rounded-lg border-1 border-black bg-white p-6 shadow-lg">
                            <h3 className="mb-4 text-center text-lg font-semibold text-black">
                                通知をオフにしますか？
                            </h3>
                            <p className="mb-6 text-center text-sm text-black">イベントの通知が届かなくなります</p>
                            <div className="flex gap-4">
                                <button
                                    onClick={cancelTurnOffNotification}
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
            </div>
        </RecTimeFlame>
    );
}
