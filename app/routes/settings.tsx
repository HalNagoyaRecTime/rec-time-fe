import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import RecTimeFlame from "../components/ui/recTimeFlame";
import penYellow from "/icons/app-icon/pen.svg";
import settingsYellow from "/icons/app-icon/settings.svg";
import {
    getNotificationSetting,
    saveNotificationSetting,
    requestNotificationPermission,
    scheduleAllNotifications,
} from "~/utils/notifications";

type StudentData = {
    f_student_id: string;
    f_student_num: string;
    f_class?: string | null;
    f_number?: string | null;
    f_name?: string | null;
};

export default function settings() {
    const [isPushEnabled, setIsPushEnabled] = useState(false);
    const [studentData, setStudentData] = useState<StudentData | null>(null);

    // 初期化: ユーザーデータと通知設定を取得
    useEffect(() => {
        // ユーザーデータの取得
        const savedData = localStorage.getItem("student:data");
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                setStudentData(data);
            } catch (error) {
                console.error("ユーザーデータの読み込みエラー:", error);
            }
        }

        // 通知設定の取得
        const notificationEnabled = getNotificationSetting();
        setIsPushEnabled(notificationEnabled);
    }, []);

    // Todo:通知のオンのロジックを考え直す
    // 通知設定が変更された時の処理
    const handleNotificationToggle = async (enabled: boolean) => {
        if (enabled) {
            // 通知をオンにする場合は権限を要求
            const permission = await requestNotificationPermission();
            if (permission === "granted") {
                saveNotificationSetting(true);
                setIsPushEnabled(true);
                // console.log("[設定] 通知オン - 権限許可済み");

                // 既存のイベントデータがあれば通知を再スケジュール
                const studentId = localStorage.getItem("student:id");
                if (studentId) {
                    const eventsData = localStorage.getItem(`events:list:${studentId}`);
                    if (eventsData) {
                        try {
                            // イベントの再スケジュール
                            const events = JSON.parse(eventsData);
                            scheduleAllNotifications(events);
                        } catch (error) {
                            console.error("イベントデータの読み込みエラー:", error);
                        }
                    }
                }
            } else {
                // Todo:アラートをテキストにする。
                alert("通知を有効にするには、ブラウザで通知許可が必要です");
                setIsPushEnabled(false);
                console.log("[設定] 通知権限が拒否されました");
            }
        } else {
            // 通知をオフにする
            saveNotificationSetting(false);
            setIsPushEnabled(false);
        }
    };

    return (
        <RecTimeFlame>
            <div className="flex w-full flex-col gap-6">
                {/*ユーザーカード*/}
                <div className="box-border overflow-hidden rounded-lg border-1 border-[#FFB400] bg-blue-500 shadow-lg">
                    <div className="relative flex items-center justify-center bg-white p-4 pt-11 pb-4">
                        <p className="cursor-pointer text-3xl font-medium text-blue-950">
                            {studentData?.f_student_num || "-----"}
                        </p>
                        <h3 className="absolute top-3 left-4 font-medium text-blue-950">学籍番号</h3>
                        <Link to="/check-in" className="absolute right-3 bottom-2 h-6 w-6 cursor-pointer">
                            <img src={penYellow} alt="" />
                        </Link>
                    </div>
                    <div className="flex bg-blue-600 px-6 py-4">
                        <div className="pr-5 text-[#FFB400]">
                            <p>クラス</p>
                            <p>出席番号</p>
                            <p>氏名</p>
                        </div>
                        <div className="text-white">
                            <p className="">{studentData?.f_class || "未設定"}</p>
                            <p>{studentData?.f_number || "未設定"}</p>
                            <p>{studentData?.f_name || "未設定"}</p>
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
                            <p>プッシュ通知</p>
                        </div>

                        <label className="relative inline-flex cursor-pointer items-center">
                            <input
                                type="checkbox"
                                className="peer sr-only"
                                checked={isPushEnabled}
                                onChange={(e) => handleNotificationToggle(e.target.checked)}
                            />
                            <div className="peer relative h-6 w-11 rounded-full bg-gray-600 peer-checked:bg-[#FFB400] peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                        </label>
                    </div>
                </div>
            </div>
        </RecTimeFlame>
    );
}
