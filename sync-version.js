// ビルド前にversion.tsからversion.jsonとsw.jsのバージョンを自動更新するスクリプト
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// version.tsからバージョンを読み取る
const versionTsPath = join(__dirname, '../app/constants/version.ts');
const versionTsContent = readFileSync(versionTsPath, 'utf-8');
const versionMatch = versionTsContent.match(/export const APP_VERSION = ["'](.+?)["']/);

if (!versionMatch) {
    console.error('❌ version.tsからバージョンを取得できませんでした');
    process.exit(1);
}

const version = versionMatch[1];
console.log(`📦 検出されたバージョン: ${version}`);

// 1. public/version.jsonを更新
const versionJsonPath = join(__dirname, '../public/version.json');
const versionJson = JSON.stringify({ version }, null, 2);
writeFileSync(versionJsonPath, versionJson, 'utf-8');
console.log(`✅ public/version.json を更新: ${version}`);

// 2. public/sw.jsのAPP_VERSIONを更新
const swJsPath = join(__dirname, '../public/sw.js');
const swJsContent = readFileSync(swJsPath, 'utf-8');
const updatedSwJs = swJsContent.replace(
    /const APP_VERSION = ["'].+?["'];/,
    `const APP_VERSION = "${version}";`
);
writeFileSync(swJsPath, updatedSwJs, 'utf-8');
console.log(`✅ public/sw.js のバージョンを更新: ${version}`);

console.log('🎉 バージョン同期完了！');
