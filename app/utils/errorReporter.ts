// src/utils/errorReporter.ts

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";
const isDev = import.meta.env.DEV;

/* =========================================================
   🎓 학번 가져오기 함수 / 学籍番号を取得する関数
   ========================================================= */
function getStudentId(): string | null {
    return localStorage.getItem("student:id");
}

/* =========================================================
   📧 공통 에러 리포트 함수 / 共通エラーレポート送信関数
   ========================================================= */
export async function reportServerError(error: {
    studentNum?: string; // 학번 / 学籍番号
    errorType: string; // 에러 타입 / エラータイプ
    errorMessage: string; // 에러 메시지 / エラーメッセージ
    stackTrace?: string; // 스택 트레이스 / スタックトレース
    userAgent?: string; // 사용자 브라우저 정보 / ユーザーエージェント
    url?: string; // 발생한 페이지 URL / 発生ページのURL
}): Promise<boolean> {
    if (isDev) console.log("📧 [ErrorReport] 送信開始:", error); // 에러 리포트 전송 시작 / エラーレポート送信開始

    try {
        const response = await fetch(`${API_BASE}/error/report`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                studentNum: error.studentNum || getStudentId(),
                ...error,
                userAgent: error.userAgent || navigator.userAgent,
                url: error.url || window.location.href,
                timestamp: new Date().toISOString(), // 전송 시각 / 送信時刻
            }),
        });

        if (isDev) console.log("📧 [ErrorReport] 応答:", response.status, response.statusText); // 서버 응답 출력 / サーバー応答ログ

        if (response.ok) {
            if (isDev) console.log("📧 [ErrorReport] 送信完了"); // 전송 완료 / 送信完了
            return true;
        } else {
            console.error("📧 [ErrorReport] 送信失敗:", response.status); // 전송 실패 / 送信失敗
            return false;
        }
    } catch (reportError: unknown) {
        // 예외 처리 / 例外処理
        if (reportError instanceof Error)
            console.error("📧 [ErrorReport] 例外が発生しました:", reportError.message); // 예외 발생 / 例外発生
        else console.error("📧 [ErrorReport] 不明なエラー:", reportError); // 알 수 없는 에러 / 不明なエラー
        return false;
    }
}

/* =========================================================
   🛰️ 서버 API 에러 리포트 / サーバーAPIエラーレポート
   ========================================================= */
export async function reportServerApiError(studentNum: string, apiUrl: string, error: Error): Promise<void> {
    if (isDev) console.log("📧 [API Error] レポート送信:", apiUrl); // API 에러 리포트 시작 / APIエラーレポート送信開始
    await reportServerError({
        studentNum,
        errorType: "Server API Error",
        errorMessage: `サーバーAPI呼び出しに失敗しました: ${error.message}`, // 서버 API 호출 실패 / サーバーAPI呼び出しに失敗
        url: apiUrl,
    });
}

/* =========================================================
   🌐 네트워크 에러 리포트 / ネットワークエラーレポート
   ========================================================= */
export async function reportServerNetworkError(studentNum: string, apiUrl: string, error: Error): Promise<void> {
    if (isDev) console.log("📧 [Network Error] レポート送信:", apiUrl); // 네트워크 에러 리포트 시작 / ネットワークエラーレポート送信開始
    await reportServerError({
        studentNum,
        errorType: "Server Network Error",
        errorMessage: `サーバー接続に失敗しました: ${error.message}`, // 서버 연결 실패 / サーバー接続失敗
        url: apiUrl,
    });
}
