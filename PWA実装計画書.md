# PWA実装計画書

## プロジェクト概要
- **プロジェクト名**: rec-time-fe PWA対応
- **現在のブランチ**: pwa_hayashi
- **参考実装**: pwa_kimu ブランチ

## 現在のPWA実装状況 (7/10 完了)

### ✅ 完成済み機能 (pwa_kimuより)
1. **Web App Manifest** - 基本PWA設定
2. **Service Worker基盤** - 手動登録・ログ機能
3. **PWAアイコン** - 192px/512pxアイコン
4. **LocalStorage管理** - 学生・イベントデータ永続化
5. **API/Mockフォールバック** - オフライン時の代替取得
6. **JSON構造検証** - 時刻フォーマット(HHmm)バリデーション
7. **手動SW登録** - React useEffect内での制御

### 🔄 未完成/強化必要
8. **App Shellキャッシュ** - HTML/CSS/JS静的リソース
9. **オフライン時刻表表示** - ローカルJSONからの表示機能
10. **キャッシュ戦略** - ServiceWorker内の本格実装

## 担当作業: オフラインHTMLキャッシュ機能

### 5. オフラインHTMLキャッシュの作りこみ

#### 5-1. 単純な時刻表表示
**目標**: ローカルJSONから時刻表を画面表示

**実装内容**:
- LocalStorageから`events:list:<id>`を取得
- 時刻フォーマット("HHmm" → "HH:mm")変換
- シンプルなテーブル形式で表示
- 集合時間・開始時間・場所・概要を含む表示

**技術仕様**:
```typescript
// データ構造（既存）
type EventRow = {
  f_event_id: string;
  f_event_name: string | null;
  f_start_time: string | null; // "0930" 形式
  f_duration: string | null;
  f_place: string | null;
  f_gather_time: string | null; // "0920" 形式
  f_summary: string | null;
};

// 表示用変換
function formatTime(hhmm: string): string {
  return `${hhmm.slice(0,2)}:${hhmm.slice(2,4)}`;
}
```

#### 5-2. ローカルJSONをオフラインで反映
**目標**: ネットワーク切断時でもローカルデータで時刻表表示

**実装内容**:
- Navigator.onLine検知によるオフライン判定
- オフライン時の専用UI表示
- LocalStorageデータの有効期限管理
- データ更新タイミングの最適化

## 実装スケジュール

### Phase 1: 時刻表表示コンポーネント (2-3日)
- [ ] `src/components/TimetableView.tsx` 作成
- [ ] LocalStorageからのデータ取得ロジック
- [ ] 時刻フォーマット変換関数
- [ ] レスポンシブテーブルUI

### Phase 2: オフライン対応強化 (2-3日)
- [ ] Navigator.onLine監視フック
- [ ] オフライン状態のUI表示
- [ ] データ有効期限チェック
- [ ] エラーハンドリング強化

### Phase 3: Service Workerキャッシュ (2-3日)
- [ ] App Shell Cache戦略実装
- [ ] 静的リソース(HTML/CSS/JS)キャッシュ
- [ ] Cache API活用
- [ ] キャッシュ更新ロジック

### Phase 4: 統合テスト (1日)
- [ ] オフライン動作確認
- [ ] キャッシュ動作テスト
- [ ] パフォーマンス検証

## 技術スタック
- **フレームワーク**: React + Vite
- **PWA**: Manual Service Worker + Web App Manifest
- **ストレージ**: LocalStorage + Cache API
- **スタイリング**: TailwindCSS

## 参考リソース
- **既存実装**: `pwa_kimu` ブランチの `my-app/` フォルダ
- **コミット**: `713050f` - PWAサンプル完成
- **ファイル**:
  - `public/sw.js` - Service Worker基盤
  - `app/routes/home.tsx` - データ取得・保存ロジック
  - `public/manifest.webmanifest` - PWA設定

## 完成目標
ネットワーク接続なしでも、保存済みの学生時刻表データを美しく表示できるPWAアプリケーション