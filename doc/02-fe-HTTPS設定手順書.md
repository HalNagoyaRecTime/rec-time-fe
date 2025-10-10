# 02-fe-HTTPS設定手順書

## 概要
フロントエンド開発環境でのHTTPS設定について説明します。PWA機能やService Workerを使用する場合、HTTPS環境が必要になります。

## HTTPS化の必要性

### PWAでHTTPSが必要な理由
1. **Service Worker** - HTTPSまたはlocalhostでのみ動作
2. **Web Push API** - HTTPS環境でのみ利用可能
3. **Geolocation API** - 位置情報取得にHTTPS必須
4. **Camera/Microphone API** - メディアアクセスにHTTPS必須

### 開発環境での影響
- オフライン機能のテスト
- プッシュ通知のテスト
- 実機でのPWA動作テスト

## 証明書の準備

### 1. mkcertのインストール (推奨)

#### Windows
```bash
# Chocolatey使用の場合
choco install mkcert

# Scoopの場合
scoop install mkcert

# 手動インストール
# https://github.com/FiloSottile/mkcert/releases からダウンロード
```

#### macOS
```bash
# Homebrew使用
brew install mkcert
```

#### Ubuntu/Debian
```bash
sudo apt install libnss3-tools
wget -O mkcert https://github.com/FiloSottile/mkcert/releases/latest/download/mkcert-v1.4.4-linux-amd64
chmod +x mkcert
sudo mv mkcert /usr/local/bin/
```

### 2. 証明書の生成

```bash
# プロジェクトルートで実行
cd rec-time-fe

# ローカル認証局を作成
mkcert -install

# localhost用の証明書を生成
mkcert localhost 127.0.0.1 ::1

# 【必要であれば】自分のIPアドレスでも証明書を生成
# 他のデバイス（スマホ等）からアクセスする場合のみ
# まずIPアドレスを確認
ipconfig | findstr "IPv4"          # Windows
ifconfig | grep "inet "            # macOS/Linux

# 例: IPが192.168.1.100の場合
mkcert localhost 127.0.0.1 ::1 192.168.1.100

# 生成されるファイル（プロジェクトルートに作成される）
# localhost+1.pem (証明書) または localhost+3.pem
# localhost+1-key.pem (秘密鍵) または localhost+3-key.pem

# ファイル生成場所の確認
ls -la *.pem                       # macOS/Linux
dir *.pem                          # Windows
```

## 環境変数設定

### `.env.dev` での設定
```bash
# HTTPS証明書のパス
HTTPS_KEY_PATH=./localhost+1-key.pem
HTTPS_CERT_PATH=./localhost+1.pem

# サーバー設定
VITE_HOST=0.0.0.0
VITE_DEV_PORT=5173
```

## Vite設定

### `vite.config.ts` でのHTTPS設定
現在のプロジェクトでは自動的にHTTPS設定が読み込まれます：

```typescript
server: {
  host: getHost(),
  port: getPort("VITE_DEV_PORT"),
  https: env.HTTPS_KEY_PATH && env.HTTPS_CERT_PATH ? {
    key: fs.readFileSync(env.HTTPS_KEY_PATH),
    cert: fs.readFileSync(env.HTTPS_CERT_PATH),
  } : undefined,
}
```

## 起動方法

### HTTPS開発サーバー起動
```bash
# 通常の開発サーバー起動
npm run dev

# HTTPS有効な場合、以下のようにアクセス可能
# https://localhost:5173/
# https://127.0.0.1:5173/
# https://[ローカルIP]:5173/ (他デバイスから)
```

### 確認方法
1. ブラウザで `https://localhost:5173/` にアクセス
2. 証明書エラーが出ないことを確認
3. アドレスバーに鍵マークが表示されることを確認

## チーム開発での共有

### 証明書ファイルの扱い
- **Git管理対象外**: `.gitignore` に追加済み
- **各開発者が個別生成**: セキュリティ上の理由
- **手順の共有**: このドキュメントを参照

### `.gitignore` 設定
```
# HTTPS証明書（セキュリティ上Git管理しない）
localhost+*.pem
*.key
*.crt
```

## 他デバイスでのテスト

### モバイルデバイスでのアクセス
1. **ローカルIPアドレスを確認**
   ```bash
   # Windows
   ipconfig | findstr "IPv4"

   # macOS/Linux
   ifconfig | grep "inet "
   ```

2. **環境変数設定**
   ```bash
   VITE_HOST=0.0.0.0  # 外部からのアクセスを許可
   ```

3. **モバイルからアクセス**
   ```
   https://[ローカルIP]:5173/
   例: https://192.168.1.100:5173/
   ```

### 証明書の信頼設定
モバイルデバイスで証明書エラーが出る場合：

#### iOS
1. 設定 > 一般 > 情報 > 証明書信頼設定
2. mkcertの認証局を有効化

#### Android
1. 設定 > セキュリティ > 証明書をインストール
2. mkcertのルート証明書をインストール

## トラブルシューティング

### Q: 「接続が安全ではありません」エラー
A:
1. mkcertのインストールを確認
2. `mkcert -install` でルート認証局をインストール
3. ブラウザを再起動

### Q: 証明書ファイルが見つからない
A:
1. プロジェクトルートで `mkcert localhost 127.0.0.1 ::1` を実行
2. `.env.dev` のパスが正しいか確認

### Q: 他のデバイスから接続できない
A:
1. `VITE_HOST=0.0.0.0` が設定されているか確認
2. ファイアウォールの設定を確認
3. 同じネットワーク上にいるか確認

### Q: ポート5173が使用中
A:
1. `.env.dev` で `VITE_DEV_PORT=5174` など別ポートを指定
2. または `npm run dev -- --port 5174` で起動

## 本番環境での設定

### Cloudflare Pages
- 自動的にHTTPS化される
- カスタムドメインでもHTTPS強制
- 開発者側での設定不要

### その他のホスティングサービス
- Netlify: 自動HTTPS
- Vercel: 自動HTTPS
- GitHub Pages: HTTPS強制オプション

## セキュリティ注意事項

1. **証明書の管理**
   - 秘密鍵ファイルをGitにコミットしない
   - 本番環境では正規の証明書を使用

2. **アクセス制限**
   - 開発サーバーは開発時のみ起動
   - 不要なポートは開放しない

3. **証明書の更新**
   - mkcertの証明書は定期的に再生成
   - 期限切れに注意

## 関連ファイル
- `vite.config.ts`: HTTPS設定の実装
- `.env.dev`: 証明書パスの設定
- `.gitignore`: 証明書ファイルの除外設定