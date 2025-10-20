// download-fonts-simple.js
// Google Fonts APIから正しいURLを取得してダウンロード

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FONTS_DIR = path.join(__dirname, 'public', 'fonts');

// ディレクトリを作成
if (!fs.existsSync(FONTS_DIR)) {
    fs.mkdirSync(FONTS_DIR, { recursive: true });
    console.log('📁 フォントディレクトリを作成しました');
}

// Google Fonts APIから正しいURLを取得
async function getFontUrlFromCSS(cssUrl, userAgent) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': userAgent
            }
        };

        https.get(cssUrl, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                // デバッグ：CSSの内容を表示
                // console.log('CSS:', data);
                
                // CSSからwoff2のURLを抽出（複数のパターンに対応）
                const patterns = [
                    /src:\s*url\((https:\/\/[^)]+\.woff2)\)/,
                    /url\((https:\/\/[^)]+\.woff2)\)\s+format\(['"]woff2['"]\)/,
                    /url\((https:\/\/fonts\.gstatic\.com[^)]+\.woff2)\)/
                ];
                
                for (const pattern of patterns) {
                    const match = data.match(pattern);
                    if (match) {
                        resolve(match[1]);
                        return;
                    }
                }
                
                reject(new Error('woff2 URLが見つかりません'));
            });
        }).on('error', reject);
    });
}

// ファイルをダウンロード
function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                // リダイレクトを追跡
                return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
            }
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
            file.on('error', (err) => {
                fs.unlink(dest, () => {});
                reject(err);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

// フォント定義（Google Fonts APIを使用）
const FONTS = [
    { name: 'NotoSansJP-Regular.woff2', family: 'Noto Sans JP', weight: '400' },
    { name: 'NotoSansJP-Bold.woff2', family: 'Noto Sans JP', weight: '700' },
    { name: 'NotoSansJP-Black.woff2', family: 'Noto Sans JP', weight: '900' },
    { name: 'Inter-Regular.woff2', family: 'Inter', weight: '400' },
    { name: 'Inter-SemiBold.woff2', family: 'Inter', weight: '600' },
    { name: 'Inter-Bold.woff2', family: 'Inter', weight: '700' },
    { name: 'Inter-ExtraBold.woff2', family: 'Inter', weight: '800' },
    { name: 'Inter-Black.woff2', family: 'Inter', weight: '900' },
];

// User-Agent（woff2形式を取得するため）
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function downloadAllFonts() {
    console.log('📥 Google Fonts APIからフォントをダウンロード中...\n');

    // 0KBの破損ファイルを削除
    if (fs.existsSync(FONTS_DIR)) {
        const files = fs.readdirSync(FONTS_DIR);
        files.forEach(file => {
            const filePath = path.join(FONTS_DIR, file);
            const stats = fs.statSync(filePath);
            if (stats.size === 0) {
                fs.unlinkSync(filePath);
                console.log(`🗑️  削除: ${file} (破損ファイル - 0KB)`);
            }
        });
        console.log('');
    }

    let successCount = 0;
    let failCount = 0;

    for (const font of FONTS) {
        const destPath = path.join(FONTS_DIR, font.name);

        // 既に存在し、サイズが0より大きい場合はスキップ
        if (fs.existsSync(destPath)) {
            const stats = fs.statSync(destPath);
            if (stats.size > 0) {
                const sizeKB = (stats.size / 1024).toFixed(2);
                console.log(`⏭️  スキップ: ${font.name} (${sizeKB} KB)`);
                successCount++;
                continue;
            }
        }

        try {
            console.log(`📥 ダウンロード中: ${font.name}...`);
            
            // Google Fonts APIのCSS URLを生成（スペースは+でエンコード）
            const encodedFamily = font.family.replace(/ /g, '+');
            const cssUrl = `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${font.weight}&display=swap`;
            
            // CSSから実際のwoff2 URLを取得
            const fontUrl = await getFontUrlFromCSS(cssUrl, USER_AGENT);
            
            // フォントファイルをダウンロード
            await downloadFile(fontUrl, destPath);
            
            const stats = fs.statSync(destPath);
            const sizeKB = (stats.size / 1024).toFixed(2);
            console.log(`✅ 完了: ${font.name} (${sizeKB} KB)`);
            successCount++;
        } catch (error) {
            console.error(`❌ エラー: ${font.name} - ${error.message}`);
            failCount++;
        }
    }

    console.log('\n========================================');
    console.log(`✅ 成功: ${successCount}/${FONTS.length}`);
    if (failCount > 0) {
        console.log(`❌ 失敗: ${failCount}/${FONTS.length}`);
    }
    console.log('========================================\n');

    // ダウンロード済みファイル一覧
    if (fs.existsSync(FONTS_DIR)) {
        console.log('📂 フォントファイル一覧:\n');
        const files = fs.readdirSync(FONTS_DIR).filter(f => {
            const stats = fs.statSync(path.join(FONTS_DIR, f));
            return stats.size > 0;
        });
        
        files.forEach(file => {
            const filePath = path.join(FONTS_DIR, file);
            const stats = fs.statSync(filePath);
            const sizeKB = (stats.size / 1024).toFixed(2);
            console.log(`  - ${file} (${sizeKB} KB)`);
        });
        console.log(`\n合計: ${files.length} ファイル`);
    }

    if (successCount === FONTS.length) {
        console.log('\n🎉 すべてのフォントファイルのダウンロードが完了しました！');
        console.log('📝 次のステップ: npm run dev でサーバーを起動して確認してください');
    } else if (failCount > 0) {
        console.log('\n⚠️  一部のフォントファイルのダウンロードに失敗しました');
        console.log('📝 再度実行するか、手動でダウンロードしてください');
    }
}

downloadAllFonts().catch(err => {
    console.error('❌ ダウンロード処理でエラーが発生しました:', err);
    process.exit(1);
});
