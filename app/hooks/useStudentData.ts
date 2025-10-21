// 学生データ管理フック
// 학생 데이터 관리 훅

import { useState, useEffect } from "react";
import { STORAGE_KEYS } from "~/constants/storage";
import { useFCM } from "~/hooks/useFCM";

export type StudentData = {
    f_student_id: string;
    f_student_num: string;
    f_class?: string | null;
    f_number?: string | null;
    f_name?: string | null;
};

export function useStudentData() {
    const [studentId, setStudentIdState] = useState<string | null>(null);
    const [studentData, setStudentDataState] = useState<StudentData | null>(null);
    const [birthday, setBirthdayState] = useState<string | null>(null);
    
    // FCM 훅 사용 / FCMフック使用
    const fcm = useFCM();

    // 初期化: LocalStorageから読み込み
    useEffect(() => {
        loadStudentData();
    }, []);

    // LocalStorageから全学生データを読み込み
    const loadStudentData = () => {
        try {
            const id = localStorage.getItem(STORAGE_KEYS.STUDENT_ID);
            const bday = localStorage.getItem(STORAGE_KEYS.STUDENT_BIRTHDAY);
            const dataJson = localStorage.getItem(STORAGE_KEYS.STUDENT_DATA);

            setStudentIdState(id);
            setBirthdayState(bday);

            if (dataJson) {
                const data = JSON.parse(dataJson) as StudentData;
                setStudentDataState(data);
            }
        } catch (error) {
            console.error("[useStudentData] データ読み込みエラー:", error);
        }
    };

    // 学籍番号を保存
    const setStudentId = (id: string) => {
        localStorage.setItem(STORAGE_KEYS.STUDENT_ID, id);
        setStudentIdState(id);
    };

    // 誕生日を保存
    const setBirthday = (bday: string) => {
        localStorage.setItem(STORAGE_KEYS.STUDENT_BIRTHDAY, bday);
        setBirthdayState(bday);
    };

    // 学生データ全体を保存
    const saveStudentData = (data: StudentData) => {
        localStorage.setItem(STORAGE_KEYS.STUDENT_DATA, JSON.stringify(data));
        setStudentDataState(data);

        // 学籍番号も同時に保存
        if (data.f_student_num) {
            setStudentId(data.f_student_num);
        }

        // 名前も別途保存（後方互換性のため）
        if (data.f_name) {
            localStorage.setItem(STORAGE_KEYS.STUDENT_NAME, data.f_name);
        }
    };

    // 登録処理: 学籍番号 + 誕生日 + 学生データを一括保存
    const registerStudent = async (id: string, bday: string, data: StudentData) => {
        setStudentId(id);
        setBirthday(bday);
        saveStudentData(data);

        // 登録成功時刻を保存
        const now = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, now);
        
        // FCM 토큰 자동 등록 / FCMトークン自動登録
        if (fcm.status.isSupported && !fcm.status.isRegistered) {
            console.log("🔔 FCM 토큰 자동 등록 시작 / FCMトークン自動登録開始:", id);
            await fcm.registerToken(id);
        }
    };

    // 全学生データをクリア
    const clearStudentData = async () => {
        // FCM 토큰 등록 해제 / FCMトークン登録解除
        if (studentId && fcm.status.isRegistered) {
            console.log("🗑️ FCM 토큰 등록 해제 / FCMトークン登録解除:", studentId);
            await fcm.unregisterToken(studentId);
        }
        
        localStorage.removeItem(STORAGE_KEYS.STUDENT_ID);
        localStorage.removeItem(STORAGE_KEYS.STUDENT_DATA);
        localStorage.removeItem(STORAGE_KEYS.STUDENT_BIRTHDAY);
        localStorage.removeItem(STORAGE_KEYS.STUDENT_NAME);

        setStudentIdState(null);
        setStudentDataState(null);
        setBirthdayState(null);
    };

    return {
        // 状態
        studentId,
        studentData,
        birthday,
        
        // FCM 상태 / FCM状態
        fcmStatus: fcm.status,

        // メソッド
        setStudentId,
        setBirthday,
        saveStudentData,
        registerStudent,
        clearStudentData,
        loadStudentData,
        
        // FCM 메서드 / FCMメソッド
        registerFCMToken: fcm.registerToken,
        unregisterFCMToken: fcm.unregisterToken,
        testFCMPush: fcm.testPush,
        refreshFCMToken: fcm.refreshToken,
        checkFCMStatus: fcm.checkStatus,
        clearFCMError: fcm.clearError,
    };
}