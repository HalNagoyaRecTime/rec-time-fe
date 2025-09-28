import React, {useState} from "react";
import RecTimeFlame from "../components/recTimeFlame";
import NumberKeypad from "../components/number-keypad";
import {Link} from "react-router";

export default function IdInput() {
    const [studentId, setStudentId] = useState("");


    const handleNumberClick = (num: string) => {
        // 5桁制限
        if (studentId.length < 5) {
            setStudentId(prev => prev + num);
        }
    };

    const handleClear = () => {
        setStudentId("");
    };

    const handleBackspace = () => {
        setStudentId(prev => prev.slice(0, -1));
    };

    const handleSubmit = () => {
        if (studentId.length === 5) {
            console.log("学籍番号:", studentId);
            // ここでローカルストレージに保存やAPI送信など
            // localStorage.setItem("student:id", studentId);
            // alert(`学籍番号 ${studentId} が登録されました`);
        }
    };

    return (
        <RecTimeFlame>
            <div className="max-w-150 flex flex-col items-center gap-8">

                <div className="flex flex-col items-center gap-2">
                    <h2 className="text-xl text-[#FFB400] font-semibold">学籍番号入力</h2>
                    <p className="text-sm text-white font-light">5桁の学籍番号を入力してください</p>
                </div>


                {/* 入力表示エリア */}
                <div className="relative  rounded-lg border-none over outline-none shadow-none">
                    <div className="w-79 h-33 bg-blue-800 rounded-sm border-1 border-[#FFB400] text-center flex items-center justify-center shadow-lg">
                        <div className="text-5xl font-mono text-white flex items-start justify-end w-47  h-10 flex-col">
                            <p className="tracking-[14px]">
                                {studentId}
                            </p>
                            <div className="flex gap-3">
                                <div className="w-7 h-[3px] rounded-full bg-white"></div>
                                <div className="w-7 h-[3px] rounded-full bg-white"></div>
                                <div className="w-7 h-[3px] rounded-full bg-white"></div>
                                <div className="w-7 h-[3px] rounded-full bg-white"></div>
                                <div className="w-7 h-[3px] rounded-full bg-white"></div>
                            </div>
                        </div>
                    </div>

                    {/* 4つの角に配置される45度回転した正方形 */}
                    {/*Todo:△のデザイン調整する。*/}
                    <div className="absolute -top-[11px] -left-[11px] bg-transparent rotate-45 w-5 h-5 flex justify-center">
                        {/* 左上の三角形 */}
                        <div className="relative">
                            <div className="absolute bottom-[7px] -right-3 w-0 h-0 border-r-6  border-b-6 border-l-transparent border-r-transparent border-b-[#FFB400] rotate-45"></div>
                        </div>
                    </div>
                    <div className="absolute -top-[11px] -right-[11px]  rotate-135 w-5 h-5 flex justify-center">
                        {/* 右上の三角形 */}
                        <div className="relative">
                            <div className="absolute bottom-[7px] -right-3 w-0 h-0 border-r-6  border-b-6 border-l-transparent border-r-transparent border-b-[#FFB400] rotate-45"></div>
                        </div>
                    </div>
                    <div className="absolute -bottom-[11px] -right-[11px]  rotate-225 w-5 h-5 flex justify-center">
                        {/* 右下の三角形 */}
                        <div className="relative">
                            <div className="absolute bottom-[7px] -right-3 w-0 h-0 border-r-6  border-b-6 border-l-transparent border-r-transparent border-b-[#FFB400] rotate-45"></div>
                        </div>
                    </div>
                    <div className="absolute -bottom-[11px] -left-[11px] rotate-315 w-5 h-5 flex justify-center">
                        {/* 右下の三角形 */}
                        <div className="relative">
                            <div className="absolute bottom-[7px] -right-3 w-0 h-0 border-r-6  border-b-6 border-l-transparent border-r-transparent border-b-[#FFB400] rotate-45"></div>
                        </div>
                    </div>
                </div>


                {/* キーパッド */}
                <NumberKeypad onNumberClick={handleNumberClick} onClear={handleClear} onBackspace={handleBackspace}/>

                {/* 登録ボタン */}
                <div className="flex justify-between items-center w-57">
                    <Link to="/settings" className="pr-6 py-2 text-white">キャンセル</Link>
                    <button onClick={handleSubmit} disabled={studentId.length !== 5} className="bg-[#FFB400] px-6 py-2 rounded-lg font-medium shadow-sm hover:bg-yellow-400 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer">
                        <span className="text-white">登録</span>
                    </button>
                </div>

            </div>
        </RecTimeFlame>
    );
}