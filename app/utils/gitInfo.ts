/**
 * Git情報取得ユーティリティ
 * 最後のコミット、マージした人などの情報を取得
 * Git 정보 획득 유틸리티
 * 마지막 커밋, 머지한 사람 등의 정보를 획득
 */

import { logger } from './logger';

// Git情報の型定義
// Git 정보의 타입 정의
export interface GitInfo {
    commitHash: string;
    commitMessage: string;
    commitAuthor: string;
    commitDate: string;
    branch: string;
    lastMergeCommit?: {
        hash: string;
        message: string;
        author: string;
        date: string;
    };
    buildTime: string;
    buildVersion?: string;
}

// ビルド時情報（Viteの環境変数から取得）
// 빌드 시 정보 (Vite의 환경 변수에서 획득)
const buildInfo = {
    buildTime: new Date().toISOString(),
    buildVersion: import.meta.env.VITE_BUILD_VERSION || 'unknown',
};

// Git情報取得関数
// Git 정보 획득 함수
export async function getGitInfo(): Promise<GitInfo | null> {
    try {
        // 本番環境では事前に注入された情報を使用
        // 프로덕션 환경에서는 사전에 주입된 정보를 사용
        if (import.meta.env.PROD) {
            const injectedGitInfo = (window as any).__GIT_INFO__;
            if (injectedGitInfo) {
                return {
                    ...injectedGitInfo,
                    buildTime: buildInfo.buildTime,
                    buildVersion: buildInfo.buildVersion,
                };
            }
        }
        
        // 開発環境では動的に取得を試行
        // 개발 환경에서는 동적으로 획득을 시도
        if (import.meta.env.DEV) {
            const gitInfo = await fetchGitInfoFromAPI();
            if (gitInfo) {
                return {
                    ...gitInfo,
                    buildTime: buildInfo.buildTime,
                    buildVersion: buildInfo.buildVersion,
                };
            }
        }
        
        // フォールバック情報
        // 폴백 정보
        const fallbackInfo: GitInfo = {
            commitHash: 'unknown',
            commitMessage: 'Git情報を取得できませんでした / Git 정보를 획득할 수 없었습니다',
            commitAuthor: 'unknown',
            commitDate: new Date().toISOString(),
            branch: 'unknown',
            buildTime: buildInfo.buildTime,
            buildVersion: buildInfo.buildVersion,
        };
        
        return fallbackInfo;
        
    } catch (error) {
        logger.error('Git情報取得中にエラーが発生 / Git 정보 획득 중 에러 발생', 'GitInfo', null, error as Error);
        return null;
    }
}

// APIからGit情報を取得
// API에서 Git 정보를 획득
async function fetchGitInfoFromAPI(): Promise<Partial<GitInfo> | null> {
    try {
        const response = await fetch('/api/git-info');
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        // API呼び出し失敗はログに記録しない（頻繁すぎるため）
        // API 호출 실패는 로그에 기록하지 않음 (너무 빈번하므로)
    }
    return null;
}

// Git情報をログに出力 - 重要な情報のみ
// Git 정보를 로그에 출력 - 중요한 정보만
export function logGitInfo(gitInfo: GitInfo): void {
    logger.info('=== Git情報 / Git 정보 ===', 'GitInfo');
    logger.info(`コミットハッシュ / 커밋 해시: ${gitInfo.commitHash}`, 'GitInfo');
    logger.info(`コミット作者 / 커밋 작성자: ${gitInfo.commitAuthor}`, 'GitInfo');
    logger.info(`ブランチ / 브랜치: ${gitInfo.branch}`, 'GitInfo');
    
    if (gitInfo.lastMergeCommit) {
        logger.info('=== 最後のマージ情報 / 마지막 머지 정보 ===', 'GitInfo');
        logger.info(`マージした人 / 머지한 사람: ${gitInfo.lastMergeCommit.author}`, 'GitInfo');
        logger.info(`マージ日時 / 머지 일시: ${gitInfo.lastMergeCommit.date}`, 'GitInfo');
    }
}

// エラー発生時にGit情報を含める
// 에러 발생 시 Git 정보를 포함
export function createErrorContext(gitInfo: GitInfo | null): any {
    return {
        gitInfo: gitInfo ? {
            commitHash: gitInfo.commitHash,
            commitAuthor: gitInfo.commitAuthor,
            branch: gitInfo.branch,
            buildTime: gitInfo.buildTime,
            buildVersion: gitInfo.buildVersion,
        } : null,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        timestamp: new Date().toISOString(),
    };
}
