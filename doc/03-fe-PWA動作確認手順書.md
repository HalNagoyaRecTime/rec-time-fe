# 03-fe-PWA動作確認手順書

## 概要
実装したPWA機能の動作確認方法について説明します。オフライン動作、Service Worker、PWAインストール機能などを検証するための手順を記載します。

## 前提条件
- 環境変数設定が完了していること（[01-fe-環境変数設定手順書.md](./01-fe-環境変数設定手順書.md) 参照） 
~~- HTTPS設定が完了していること（[02-fe-HTTPS設定手順書.md](./02-fe-HTTPS設定手順書.md) 参照）~~
- ※モックデータで動作している2025/09/26/現在https化しなくても動作確認できます。

## 1. 本番ビルドの作成

### 1-1. ビルドコマンド実行
```bash
# プロジェクトルートで実行
cd rec-time-fe

# 本番用ビルドを作成
npm run build

# ビルド成功の確認
# ✓ built in xxms
# PWA v1.0.3 が表示されることを確認
```

### 1-2. ビルド結果確認
```bash
# 生成されたファイルを確認
ls -la build/client/          # macOS/Linux
dir build\client\             # Windows

# 重要なファイルの存在確認
# ✓ index.html
# ✓ manifest.webmanifest
# ✓ sw.js (Service Worker)
# ✓ pwa-sw.js (VitePWA生成)
```

## 2. Python Serverでの配信

### 2-1. 基本的な起動方法
```bash
# buildフォルダに移動
cd build/client

# Python HTTP Server起動
python -m http.server 8080

# アクセスURL
# http://localhost:8080
```

### 2-2. 代替起動方法

#### npx serve使用
```bash
# プロジェクトルートから
npx serve build/client -p 8080

# または
npm install -g serve
serve build/client -p 8080
```

#### Node.js http-server使用
```bash
npm install -g http-server
cd build/client
http-server -p 8080
```

### 2-3. 起動確認
```
ブラウザで http://localhost:8080 にアクセス
✓ RecTime PWAが表示される
✓ コンソールエラーがない
✓ ネットワークタブでリソース読み込み成功
```

## 3. PWAインストール機能確認

### 3-1. インストールプロンプト確認
```
1. Chrome/Edge等のPWA対応ブラウザでアクセス
2. アドレスバー右側に「インストール」ボタンが表示されることを確認
3. または設定メニューに「アプリをインストール」項目があることを確認
```

### 3-2. 実際のインストールテスト
```
1. 「インストール」ボタンをクリック
2. インストール確認ダイアログが表示される
3. 「インストール」を選択
4. デスクトップ/スタートメニューにRecTimeアイコンが追加される
5. インストールしたアプリから起動して動作確認
```

### 3-3. PWA情報確認（開発者ツール）
```
1. F12で開発者ツールを開く
2. Application タブを選択
3. 左メニューの「Manifest」を確認
   ✓ Name: "RecTime PWA"
   ✓ Short name: "RecTime"
   ✓ Start URL: "/"
   ✓ Display: "standalone"
   ✓ Icons: 192x192, 512x512

4. 左メニューの「Service Workers」を確認
   ✓ sw.js が登録されている
   ✓ Status: "activated and running"
```

## 4. Service Worker動作確認

### 4-1. Service Worker登録確認
```
1. 開発者ツール > Application > Service Workers
2. 以下の情報を確認：
   ✓ Source: sw.js
   ✓ Status: activated and running
   ✓ Clients: 1 (現在のページ)

3. コンソールログ確認：
   ✓ "[SW] install 2025-09-12-01"
   ✓ "[SW] activate 2025-09-12-01"
   ✓ "[SW] キャッシュを開く"
```

### 4-2. キャッシュ動作確認
```
1. 開発者ツール > Application > Storage > Cache Storage
2. 以下のキャッシュが作成されていることを確認：
   ✓ rec-time-cache-2025-09-12-01
   ✓ rec-time-data-cache-2025-09-12-01

3. キャッシュ内容確認：
   ✓ HTML/CSS/JSファイル
   ✓ mock.json データ
```

## 5. オフライン動作確認

### 5-1. 初回データ取得（キャッシュ作成）
```
1. 学籍番号を入力（例：1）
2. 「イベントデータ取得 & 通知予約」ボタンをクリック
3. 「保存OK・通知予約完了」が表示される
4. 最終更新時間が表示される
5. イベントデータが表示される
```

### 5-2. オフライン設定
```
1. 開発者ツール > Network タブを開く
2. 「Offline」チェックボックスにチェック
3. ページを再読み込み (Ctrl+R / Cmd+R)
4. ページが正常に表示されることを確認
```

### 5-3. オフライン時の動作確認
```
1. 「イベントデータ取得 & 通知予約」ボタンをクリック
2. 以下の動作を確認：
   ✓ イベントデータが表示される（キャッシュから）
   ✓ ステータス：「取得に失敗しました。」
   ✓ 最終更新時間は更新されない
   ✓ コンソールログ：
     "[SW] ネットワークエラー、キャッシュから取得: /mock.json"
     "[SW] オフライン状態: キャッシュされたJSONデータを表示中"
     "[App] キャッシュからデータを取得しました"
```

### 5-4. オンライン復帰確認
```
1. 「Offline」チェックを外す
2. 「イベントデータ取得 & 通知予約」ボタンをクリック
3. 以下の動作を確認：
   ✓ ステータス：「保存OK・通知予約完了」
   ✓ 最終更新時間が更新される
   ✓ 新しいデータが取得される
```

## 6. モバイルデバイスでのテスト

### 6-1. ローカルIPでの配信
```bash
# IPアドレス確認
ipconfig | findstr "IPv4"          # Windows
ifconfig | grep "inet "            # macOS/Linux

# 例: 192.168.1.100の場合
# モバイルから https://192.168.1.100:8080 でアクセス
```

### 6-2. モバイルでのPWAテスト
```
1. モバイルブラウザで上記URLにアクセス
2. 「ホーム画面に追加」オプションがあることを確認
3. 追加後、ホーム画面のアイコンから起動
4. ネイティブアプリのような表示を確認
5. オフライン動作をモバイルの機内モードでテスト
```


## 7. トラブルシューティング

### Q: Service Workerが登録されない
A:
1. HTTPSで動作しているか確認
2. sw.jsファイルが正しく配信されているか確認
3. ブラウザのキャッシュをクリア
4. 開発者ツールでエラーログを確認

### Q: PWAインストールプロンプトが表示されない
A:
1. HTTPSで動作しているか確認
2. manifest.webmanifestが正しく読み込まれているか確認
3. Service Workerが正しく動作しているか確認
4. PWA要件を満たしているかLighthouse監査で確認

### Q: オフライン時にデータが表示されない
A:
1. 最初にオンライン状態でデータを取得してキャッシュを作成
2. Service Workerのキャッシュストレージを確認
3. fetchイベントハンドラーが正しく動作しているか確認

### Q: モバイルからアクセスできない
A:
1. 同じWi-Fiネットワークに接続しているか確認
2. ファイアウォール設定を確認
3. `VITE_HOST=0.0.0.0` が設定されているか確認


## 関連ファイル
- `build/client/sw.js`: Service Worker実装
- `build/client/manifest.webmanifest`: PWAマニフェスト
- `build/client/pwa-sw.js`: VitePWA自動生成Service Worker