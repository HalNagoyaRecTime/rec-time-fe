/**
 * ビルド時にGit情報を注入するスクリプト
 * 本番環境でGit情報を取得できるようにする
 * 빌드 시 Git 정보를 주입하는 스크립트
 * 프로덕션 환경에서 Git 정보를 획득할 수 있도록 함
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Git情報を取得する関数
// Git 정보를 획득하는 함수
function getGitInfo() {
    try {
        const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
        const commitMessage = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
        const commitAuthor = execSync('git log -1 --pretty=%an', { encoding: 'utf8' }).trim();
        const commitDate = execSync('git log -1 --pretty=%ai', { encoding: 'utf8' }).trim();
        const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
        
        // 最後のマージコミットを取得
        // 마지막 머지 커밋을 획득
        let lastMergeCommit = null;
        try {
            const mergeCommitHash = execSync('git log --merges -1 --pretty=%H', { encoding: 'utf8' }).trim();
            if (mergeCommitHash) {
                const mergeCommitMessage = execSync(`git log -1 --pretty=%B ${mergeCommitHash}`, { encoding: 'utf8' }).trim();
                const mergeCommitAuthor = execSync(`git log -1 --pretty=%an ${mergeCommitHash}`, { encoding: 'utf8' }).trim();
                const mergeCommitDate = execSync(`git log -1 --pretty=%ai ${mergeCommitHash}`, { encoding: 'utf8' }).trim();
                
                lastMergeCommit = {
                    hash: mergeCommitHash,
                    message: mergeCommitMessage,
                    author: mergeCommitAuthor,
                    date: mergeCommitDate,
                };
            }
        } catch (e) {
            // マージコミットがない場合は無視
            // 머지 커밋이 없는 경우는 무시
        }
        
        return {
            commitHash,
            commitMessage,
            commitAuthor,
            commitDate,
            branch,
            lastMergeCommit,
        };
    } catch (error) {
        console.warn('Git情報の取得に失敗しました:', error.message);
        return {
            commitHash: 'unknown',
            commitMessage: 'Git情報を取得できませんでした',
            commitAuthor: 'unknown',
            commitDate: new Date().toISOString(),
            branch: 'unknown',
        };
    }
}

// HTMLファイルにGit情報を注入
// HTML 파일에 Git 정보를 주입
function injectGitInfoToHtml(buildDir) {
    const htmlPath = path.join(buildDir, 'client', 'index.html');
    
    if (!fs.existsSync(htmlPath)) {
        console.warn('HTMLファイルが見つかりません:', htmlPath);
        return;
    }
    
    const gitInfo = getGitInfo();
    const gitInfoScript = `
    <script>
        window.__GIT_INFO__ = ${JSON.stringify(gitInfo, null, 2)};
    </script>`;
    
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // </head>タグの前にGit情報スクリプトを挿入
    // </head> 태그 앞에 Git 정보 스크립트를 삽입
    htmlContent = htmlContent.replace('</head>', `${gitInfoScript}\n</head>`);
    
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');
    console.log('Git情報をHTMLに注入しました:', gitInfo.commitHash);
}

// メイン実行
// 메인 실행
function main() {
    const buildDir = process.argv[2] || './build';
    
    console.log('Git情報の注入を開始します...');
    injectGitInfoToHtml(buildDir);
    console.log('Git情報の注入が完了しました');
}

if (require.main === module) {
    main();
}

module.exports = { getGitInfo, injectGitInfoToHtml };
