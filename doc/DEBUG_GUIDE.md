# デバッグガイド

ブラウザコンソール（F12）で以下のコマンドを実行してください。

## 時刻デバッグコマンド

```javascript
// 自動更新を停止（時刻を固定する前に必ず実行）
stopAutoUpdate();

// 時刻を指定して固定
setCurrentTime(new Date('2025-01-15 10:00:00'));

// 現在設定されている時刻を確認
getCurrentTime();

// 自動更新を再開（通常動作に戻す）
startAutoUpdate();

// 実時刻にリセット
resetCurrentTime();
```

## よくあるテストケース

```javascript
// ケース1：開催中のテスト（開始時刻 10:30）
stopAutoUpdate();
setCurrentTime(new Date('2025-01-15 10:30:00'));

// ケース2：呼び出し中のテスト（集合 10:20、開始 10:30）
stopAutoUpdate();
setCurrentTime(new Date('2025-01-15 10:25:00'));

// ケース3：通常動作に戻す
resetCurrentTime();
startAutoUpdate();
```

**関連ファイル**: `app/utils/currentTimeManager.ts`