// src/utils/errorReporter.ts
const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";
const isDev = import.meta.env.DEV;

// 학번 가져오기
function getStudentId(): string | null {
    return localStorage.getItem("student:id");
}

// 공통 에러 리포트 함수
export async function reportServerError(error: {
    studentNum?: string;
    errorType: string;
    errorMessage: string;
    stackTrace?: string;
    userAgent?: string;
    url?: string;
}): Promise<boolean> {
    if (isDev) console.log("📧 [ErrorReport] 전송 시작:", error);

    try {
        const response = await fetch(`${API_BASE}/error/report`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                studentNum: error.studentNum || getStudentId(),
                ...error,
                userAgent: error.userAgent || navigator.userAgent,
                url: error.url || window.location.href,
                timestamp: new Date().toISOString(),
            }),
        });

        if (isDev) console.log("📧 [ErrorReport] 응답:", response.status, response.statusText);

        if (response.ok) {
            if (isDev) console.log("📧 [ErrorReport] 전송 완료");
            return true;
        } else {
            console.error("📧 [ErrorReport] 전송 실패:", response.status);
            return false;
        }
    } catch (reportError: unknown) {
        if (reportError instanceof Error) console.error("📧 [ErrorReport] 예외 발생:", reportError.message);
        else console.error("📧 [ErrorReport] 알 수 없는 오류:", reportError);
        return false;
    }
}

// 세부 에러 리포터들
export async function reportServerApiError(studentNum: string, apiUrl: string, error: Error): Promise<void> {
    if (isDev) console.log("📧 [API Error] 리포트:", apiUrl);
    await reportServerError({
        studentNum,
        errorType: "Server API Error",
        errorMessage: `서버 API 호출 실패: ${error.message}`,
        url: apiUrl,
    });
}

export async function reportServerNetworkError(studentNum: string, apiUrl: string, error: Error): Promise<void> {
    if (isDev) console.log("📧 [Network Error] 리포트:", apiUrl);
    await reportServerError({
        studentNum,
        errorType: "Server Network Error",
        errorMessage: `서버 연결 실패: ${error.message}`,
        url: apiUrl,
    });
}
