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
   🛰️ 서버 API 에러 리포트 / サーバーAPIエラーレポート
   ========================================================= */
export async function reportServerApiError(studentNum: string, apiUrl: string, error: Error): Promise<void> {
    if (isDev) console.log("📧 [API Error] レポート送信:", apiUrl); // API 에러 리포트 시작 / APIエラーレポート送信開始

    try {
        const response = await fetch(`${API_BASE}/error/report`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                studentNum: studentNum || getStudentId(),
                errorType: "Server API Error", // 에러 유형 / エラータイプ
                errorMessage: `サーバーAPI呼び出しに失敗しました: ${error.message}`, // 서버 API 호출 실패 / サーバーAPI呼び出しに失敗
                url: apiUrl,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
            }),
        });

        if (isDev) console.log("📧 [API Error] 応答:", response.status, response.statusText); // 서버 응답 출력 / サーバー応答ログ

        if (response.ok) {
            if (isDev) console.log("📧 [API Error] 送信完了"); // 전송 완료 / 送信完了
        } else {
            console.error("📧 [API Error] 送信失敗:", response.status); // 전송 실패 / 送信失敗
        }
    } catch (err: unknown) {
        if (err instanceof Error)
            console.error("📧 [API Error] 例外が発生しました:", err.message); // 예외 발생 / 例外発生
        else console.error("📧 [API Error] 不明なエラー:", err); // 알 수 없는 에러 / 不明なエラー
    }
}

/* =========================================================
   🌐 네트워크 에러 리포트 / ネットワークエラーレポート
   ========================================================= */
export async function reportServerNetworkError(studentNum: string, apiUrl: string, error: Error): Promise<void> {
    if (isDev) console.log("📧 [Network Error] レポート送信:", apiUrl); // 네트워크 에러 리포트 시작 / ネットワークエラーレポート送信開始

    try {
        const response = await fetch(`${API_BASE}/error/report`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                studentNum: studentNum || getStudentId(),
                errorType: "Server Network Error", // 에러 유형 / エラータイプ
                errorMessage: `サーバー接続に失敗しました: ${error.message}`, // 서버 연결 실패 / サーバー接続失敗
                url: apiUrl,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
            }),
        });

        if (isDev) console.log("📧 [Network Error] 応答:", response.status, response.statusText); // 서버 응답 출력 / サーバー応答ログ

        if (response.ok) {
            if (isDev) console.log("📧 [Network Error] 送信完了"); // 전송 완료 / 送信完了
        } else {
            console.error("📧 [Network Error] 送信失敗:", response.status); // 전송 실패 / 送信失敗
        }
    } catch (err: unknown) {
        if (err instanceof Error)
            console.error("📧 [Network Error] 例外が発生しました:", err.message); // 예외 발생 / 例外発生
        else console.error("📧 [Network Error] 不明なエラー:", err); // 알 수 없는 에러 / 不明なエラー
    }
}
