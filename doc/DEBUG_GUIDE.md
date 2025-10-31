# デバッグガイド

ブラウザコンソール（F12）で以下の3つのコマンドを使用してください。

## 3つのコマンド

### 1. 確認 - 現在の設定時刻を表示
```javascript
getTime();
```

### 2. 指定 - 時刻を固定
```javascript
setTime(new Date('2025-01-15 10:30:00'));
```

### 3. リセット - 通常動作に戻す
```javascript
resetTime();
```

## 使用例

```javascript
// 開催中のテスト
setTime(new Date('2025-01-15 10:30:00'));

// 時刻確認
getTime();

// テスト終了
resetTime();
```

**注意**: ページリロード（Ctrl + R）するとリセットされます。

**関連ファイル**: `app/utils/currentTimeManager.ts`