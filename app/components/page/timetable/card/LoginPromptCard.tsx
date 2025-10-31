import React from "react";
import { useNavigate } from "react-router";

interface LoginPromptCardProps {}

/**
 * ログイン促進カード
 * ユーザーがログインしていない場合に表示
 */
export default function LoginPromptCard({}: LoginPromptCardProps) {
    const navigate = useNavigate();

    const handleNavigateToRegister = () => {
        navigate("/register/student-id");
    };

    return (
        <div
            className="relative mt-4 mb-9 flex cursor-pointer flex-col items-center gap-3 rounded-md bg-[#000D91]/80 px-3 py-14 text-black shadow-2xl"
            onClick={handleNavigateToRegister}
        >
            <h3 className="font-title text-lg font-black text-white">ログインしてください。</h3>
        </div>
    );
}