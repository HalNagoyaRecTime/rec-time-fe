# RecTime PWA - Frontend

イベント管理アプリケーション「RecTime」のフロントエンドです。
React Router v7 + Vite + PWA で構築されており、リアルタイムタイムテーブル表示とプッシュ通知機能を提供します。

## 主な機能

- ✅ リアルタイムタイムテーブル表示（現在時刻バー付き）
- ✅ イベント通知機能（集合時刻に自動通知）
- ✅ PWA対応（オフライン動作・ホーム画面追加）
- ✅ モバイル最適化（Pull-to-Refresh対応）
- ✅ 学籍番号による認証・ユーザー登録

---

## 1. 起動方法

### 前提条件

- Node.js 20.x以上
- npm 10.x以上

### クイックスタート

```bash
# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env.dev
# 必要に応じて .env.dev を編集（API URLなど）

# 開発サーバー起動
npm run dev

# ブラウザでアクセス
# http://localhost:5173
```

### その他のコマンド

```bash
# 本番ビルド
npm run build

# プレビューサーバー起動（ビルド後の確認用）
npm run start

# コードフォーマット
npm run format

# 型チェック
npm run typecheck
```

---

## 2. 環境変数

### ⚠️ 重要: 開発/本番環境 DB分離

**한국어**: 백엔드가 개발/본환경 DB로 분리되었으므로, 환경별로 적절한 백엔드 URL을 설정해야 합니다.

**日本語**: バックエンドが開発環境と本番環境でデータベースが分離されているため、環境ごとに適切なバックエンドURLを設定する必要があります。

### 必須設定

`.env.development` ファイルで以下の環境変수를 설정합니다.

| 変数名 | デフォルト値 | 説明 |
|--------|------------|------|
| `VITE_API_BASE_URL` | `https://rec-time-be.ellan122316.workers.dev/` | バックエンドAPIのベースURL |
| `VITE_DEV_PORT` | `5173` | 開発サーバーのポート番号 |
| `VITE_HOST` | `0.0.0.0` | サーバーのホスト（外部アクセス許可） |

### 設定例

```bash
# .env.development (開発環境)
# 開発용 백엔드 DB에 연결 / 開発用バックエンドDBに接続
VITE_API_BASE_URL=http://localhost:8787
VITE_DEV_PORT=5173
VITE_HOST=0.0.0.0
```

### 本番環境設定

**한국어**: 본환경은 **Cloudflare Pages**의 환경 변수에서 설정합니다:
- Settings → Environment Variables → Production
- `VITE_API_BASE_URL=https://rec-time-be.your-domain.workers.dev`

**日本語**: 本番環境は **Cloudflare Pages** の環境変数で設定します:
- Settings → Environment Variables → Production
- `VITE_API_BASE_URL=https://rec-time-be.your-domain.workers.dev`

📖 **詳細ガイド**: [環境変数設定手順書](./doc/01-fe-環境変数設定手順書.md)

---

## 3. HTTPS化（オプション）

本番環境や実機でのPWAテストにはHTTPS環境が推奨されます。
開発環境（localhost）ではHTTPでも動作しますが、通知機能などの一部機能はHTTPSが必要です。

### 簡易セットアップ

```bash
# mkcertインストール
choco install mkcert  # Windows
brew install mkcert   # macOS

# 証明書生成
mkcert -install
mkcert localhost 127.0.0.1 ::1
```

`.env.dev` に証明書パスを追加：
```bash
HTTPS_KEY_PATH=./localhost+1-key.pem
HTTPS_CERT_PATH=./localhost+1.pem
```

📖 **詳細ガイド**: [HTTPS設定手順書](./doc/02-fe-HTTPS設定手順書.md)

---

## 4. PWA動作確認

### ビルドと配信

```bash
# 1. 本番ビルド
npm run build

# 2. ビルド結果を配信
cd build/client
python -m http.server 8080

# 3. ブラウザで確認
# http://localhost:8080
```

### 確認項目

#### PWAインストール
- ✅ アドレスバーに「インストール」ボタン表示
- ✅ デスクトップ/ホーム画面にアイコン追加可能

#### Service Worker
- ✅ 開発者ツール > Application > Service Workers で登録確認
- ✅ Status: "activated and running"

#### オフライン動作
- ✅ ネットワークタブで「Offline」にしても動作
- ✅ キャッシュからデータ読み込み

#### 通知機能
- ✅ 設定画面で通知ON/OFF切り替え
- ✅ 集合時刻に通知が表示される

📖 **詳細ガイド**: [PWA動作確認手順書](./doc/03-fe-PWA動作確認手順書.md)

---

## プロジェクト構成

```
rec-time-fe/
├── app/                      # アプリケーションコード
│   ├── routes/               # ページコンポーネント
│   │   ├── _index.tsx        # ホーム画面
│   │   ├── timetable.tsx     # タイムテーブル
│   │   ├── settings.tsx      # 設定画面
│   │   └── register/         # ユーザー登録
│   ├── components/           # 再利用可能コンポーネント
│   │   ├── timetable/        # タイムテーブル関連
│   │   └── ui/               # UI部品
│   ├── utils/                # ユーティリティ関数
│   │   ├── notifications.ts  # 通知機能
│   │   └── timetable/        # タイムテーブルロジック
│   ├── hooks/                # カスタムフック
│   │   ├── useStudentData.ts # 学生データ管理
│   │   └── useNotificationSettings.ts # 通知設定
│   └── api/                  # API呼び出し
├── public/                   # 静的ファイル
│   ├── sw.js                 # Service Worker
│   ├── manifest.webmanifest  # PWAマニフェスト
│   └── icons/                # アイコン画像
├── doc/                      # 詳細ドキュメント
│   ├── 01-fe-環境変数設定手順書.md
│   ├── 02-fe-HTTPS設定手順書.md
│   └── 03-fe-PWA動作確認手順書.md
├── .env.example              # 環境変数テンプレート
├── vite.config.ts            # Vite設定
├── package.json              # 依存関係
└── README.md                 # このファイル
```

---

## 技術スタック

| 技術 | バージョン | 用途 |
|------|-----------|------|
| React | 19.x | UIフレームワーク |
| React Router | 7.x | ルーティング・SSR |
| Vite | 6.x | ビルドツール |
| TailwindCSS | 4.x | スタイリング |
| TypeScript | 5.x | 型安全性 |
| vite-plugin-pwa | 1.x | PWA対応 |

---

## 開発ガイド

### コーディング規約

- **フォーマッタ**: Prettier
- **命名規則**:
  - コンポーネント: PascalCase (`EventCard.tsx`)
  - 関数/変数: camelCase (`handleClick`)
  - 型: PascalCase (`EventRow`)
  - 定数: UPPER_SNAKE_CASE (`STORAGE_KEYS`)

### コードフォーマット

```bash
# 自動フォーマット
npm run format

# フォーマットチェックのみ
npm run format:check
```

### ディレクトリ構成ルール

- `routes/`: ルーティングと紐付くページコンポーネント
- `components/`: 再利用可能なコンポーネント
- `utils/`: ビジネスロジック・ユーティリティ関数
- `hooks/`: カスタムフック
- `types/`: 型定義
- `constants/`: 定数定義

---

## トラブルシューティング

### Q: 開発サーバーが起動しない

**A**: 以下を確認してください：
1. Node.jsのバージョンが20.x以上か
2. `npm install` で依存関係をインストール済みか
3. `.env.dev` が存在するか
4. ポート5173が他のプロセスで使用されていないか

### Q: 環境変数が読み込まれない

**A**:
- ファイル名が `.env.dev` になっているか確認
- `VITE_` 接頭辞が付いているか確認（クライアント側で使う変数）
- サーバーを再起動

### Q: Service Workerが登録されない

**A**:
- HTTPSで動作しているか確認（または `localhost`）
- ブラウザのキャッシュをクリア
- 開発者ツール > Application > Service Workers でエラー確認

### Q: 通知が表示されない

**A**:
1. 設定画面で通知を有効化
2. ブラウザで通知許可を確認
3. コンソールで `[通知]` ログを確認
4. イベントデータに `f_gather_time` が設定されているか確認

---

## ライセンス

本プロジェクトは教育目的で作成されています。

---

## 関連リンク

- [React Router ドキュメント](https://reactrouter.com/)
- [Vite ドキュメント](https://vitejs.dev/)
- [PWA ガイド](https://web.dev/progressive-web-apps/)