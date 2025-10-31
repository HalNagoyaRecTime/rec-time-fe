import React from "react";
import type { StudentData } from "~/hooks/useStudentData"

interface StudentConfirmModalProps{
    studentData: StudentData;
    onConfirm: () => void;
}

export function StudentConfirmModal({ studentData, onConfirm }: StudentConfirmModalProps) {
    return (
        <div className="fixed inset-0 z-100 flex h-screen w-full items-center justify-center bg-black/50">
            <div className="w-80 rounded-lg border-1 borderblack bg-white p-6 shadow-lg">
                <h3 className="mb-4 text-center text-lg font-semibold text-black">
                    登録内容の確認
                </h3>

                <div className="flex w-full flex-col rounded-md border border-gray-300 px-4 py-3 text-black">
                    <div className="flex">
                        <div className="w-fit shrink-0 flex-col pr-4 text-sm text-gray-600">
                            <p>学籍番号</p>
                            <p>氏名</p>
                            <p>クラス</p>
                        </div>
                        <div className="flex w-full min-w-0 flex-1 flex-col text-sm font-medium text-[#000D91]">
                            <p className="overflow-hidden text-ellipsis whitespace-nowrap">
                                {studentData.f_student_num || "---"}
                            </p>
                            <p className="overflow-hidden text-ellipsis whitespace-nowrap">
                                {studentData.f_name || "---"}
                            </p>
                            <p className="overflow-hidden text-ellipsis whitespace-nowrap">
                                {studentData.f_class || "---"}
                            </p>
                        </div>
                    </div>
                </div>

                <p className="mb-6 mt-4 text-center text-sm text-black">
                    この内容で登録しました。
                </p>
        
                {/* 確認ボタン */}
                <div className="flex">
                    <button
                        onClick={onConfirm}
                        className="flex-1 cursor-pointer rounded-lg bg-[#000D91] px-4 py-2 text-white transition-colors hover:bg-[#000D91]/80"
                    >
                    OK
                    </button>
                </div>
            </div>
        </div>
    )
}