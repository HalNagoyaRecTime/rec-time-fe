import React from "react";
import { FaBook } from "react-icons/fa";

interface DataUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DataUpdateModal({ isOpen, onClose }: DataUpdateModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex h-screen w-full items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-[90%] max-w-md rounded-lg border-1 bg-white p-6 shadow-xl">
                {/* タイトル */}
                <div className="mb-6 text-center">
                    <div className="mb-3 flex justify-center text-4xl">
                        <FaBook className="text-[#020F95]" />
                    </div>
                    <h2 className="text-md font-bold text-gray-800">スケジュールが変更されました！</h2>
                </div>

                {/* メッセージ */}
                <div className="mb-2 rounded-lg bg-blue-50 p-4">
                    <p className="text-sm text-blue-900">最新の情報を確認してください。</p>
                </div>

                {/* クローズボタン */}
                <button
                    onClick={onClose}
                    className="w-full cursor-pointer rounded-lg bg-[#020F95] py-3 font-bold text-white transition-colors hover:bg-[#010a5f] active:bg-[#000855]"
                >
                    確認
                </button>
            </div>
        </div>
    );
}
