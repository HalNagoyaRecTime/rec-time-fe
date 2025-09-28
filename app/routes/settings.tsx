import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import RecTimeFlame from "../components/recTimeFlame";
import penYellow from "/icons/app-icon/pen-yellow.png";
import settingsYellow from "/icons/app-icon/settings-yellow.png";

export default function settings() {
    const [isPushEnabled, setIsPushEnabled] = useState(false);

    useEffect(() => {
        if (isPushEnabled) {
            console.log("通知オン");
        } else {
            console.log("通知オフ");
        }
    }, [isPushEnabled]);

    return (
        <RecTimeFlame>
            <div className="flex w-full flex-col gap-6">
                {/*ユーザーカード*/}
                <div className="box-border overflow-hidden rounded-lg border-1 border-[#FFB400] bg-blue-500 shadow-lg">
                    <div className="relative flex items-center justify-center bg-white p-4 pt-11 pb-4">
                        <p className="cursor-pointer text-3xl font-medium text-blue-950">40517</p>
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
                            <p className="">IH12A203</p>
                            <p>20</p>
                            <p>太郎</p>
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
                                onChange={(e) => setIsPushEnabled(e.target.checked)}
                            />
                            <div className="peer relative h-6 w-11 rounded-full bg-gray-600 peer-checked:bg-[#FFB400] peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                        </label>
                    </div>
                </div>
            </div>
        </RecTimeFlame>
    );
}
