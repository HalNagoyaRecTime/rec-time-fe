import React, {useState, useEffect} from "react";
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
            <div className="w-full flex flex-col gap-6">
                 {/*ユーザーカード*/}
                <div className=" bg-blue-500 rounded-lg overflow-hidden border-1 border-[#FFB400] box-border shadow-lg">
                    <div className="bg-white relative flex items-center justify-center pt-11 pb-4 p-4">
                        <p className="text-blue-950 text-3xl cursor-pointer font-medium">40517</p>
                        <h3 className="text-blue-950  absolute left-4 top-3 font-medium">学籍番号</h3>
                        <button className="absolute right-3 bottom-2 w-6 h-6 cursor-pointer">
                            <img src={penYellow} alt=""/>
                        </button>
                    </div>
                    <div className="bg-blue-600 px-6 py-4 flex">
                        <div className="text-[#FFB400] pr-5">
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
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8">
                                <img src={settingsYellow} alt=""/>
                            </div>
                            <p>プッシュ通知</p>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={isPushEnabled} onChange={(e) => setIsPushEnabled(e.target.checked)}/>
                            <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFB400]"></div>
                        </label>
                    </div>
                </div>
            </div>

        </RecTimeFlame>

    )
}