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
            </div>
        </div>
    )
}