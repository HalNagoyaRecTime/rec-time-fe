# rec-time 処理フロー・実装整理ドキュメント

## 目的
現在のhome.tsxの複雑な実装を各ページに適切に分割するための処理フロー分析とコンポーネント化方針の整理

## 現在のhome.tsx 詳細フロー

### 1. 初期化フロー（useEffect）

#### 1.1 通知権限要求
```typescript
useEffect(() => {
    requestNotificationPermission();
}, []);
```
**処理詳細:**
- ページ読み込み時に1回実行
- `Notification.permission === "default"` の場合のみ権限要求
- ユーザーの許可/拒否は即座に反映されない（後で確認）

#### 1.2 最終更新時間の復元
```typescript
useEffect(() => {
    const iso = localStorage.getItem(LS_KEY_LAST_UPDATED);
    if (iso) {
        const t = Date.parse(iso);
        if (!Number.isNaN(t)) setLastRun(t);
    }
}, []);
```
**処理詳細:**
- LocalStorageから最終更新時間を取得
- ISO文字列をDateに変換
- 表示用のlastRun stateに設定

#### 1.3 学籍番号存在確認
```typescript
useEffect(() => {
    setStatus(studentId ? "idle" : "no-id");
}, [studentId]);
```
**処理詳細:**
- studentId（computed value）が変わるたびに実行
- 学籍番号ありなら "idle"
- 学籍番号なしなら "no-id" → 入力フィールド表示

### 2. 学籍番号入力フロー

#### 2.1 入力処理
```typescript
const [inputId, setInputId] = useState("");
```
**処理詳細:**
- テキスト入力フィールドでの入力値管理
- リアルタイム入力反映

#### 2.2 保存処理（handleSaveId）
```typescript
function handleSaveId() {
    const id = inputId.trim();
    if (!/^\d+$/.test(id)) {
        alert("学籍番号（数字）を入力してください");
        return;
    }
    setStudentId(id);  // LocalStorageに保存
    setStatus("idle"); // UI状態更新
}
```
**処理詳細:**
1. 入力値のトリム
2. 数字のみバリデーション（正規表現）
3. エラー時はアラート表示で処理停止
4. 成功時はLocalStorageに保存
5. ステータスを"idle"に変更（入力UI非表示）

### 3. データ取得フロー（handleDownload）

#### 3.1 事前チェック
```typescript
const id = getStudentId();
if (!id) {
    setStatus("no-id");
    return false;
}
```
**処理詳細:**
- LocalStorageから学籍番号取得
- 未設定なら "no-id" ステータスに戻す
- 処理中断

#### 3.2 ローディング開始
```typescript
setStatus("loading");
```
**処理詳細:**
- UI表示を「ダウンロード中…」に変更
- ボタン無効化

#### 3.3 API呼び出し
```typescript
const result = await fetchByGakuseki(id);
const payload = result.payload;
const isFromCache = result.isFromCache;
```
**処理詳細:**
- サーバーまたはキャッシュからデータ取得
- キャッシュ判定フラグを受け取る

#### 3.4 データ保存
```typescript
localStorage.setItem(LS_KEY_EVENTS(id), JSON.stringify(payload.t_events));

// オンライン取得時のみ最終更新時間を更新
if (!isFromCache) {
    const now = new Date();
    const iso = now.toISOString();
    localStorage.setItem(LS_KEY_LAST_UPDATED, iso);
    setLastRun(now.getTime());
}
```
**処理詳細:**
1. イベントデータをJSON文字列で保存
2. キャッシュ取得でない場合のみ最終更新時間を更新
3. UI表示用のlastRun stateも更新

#### 3.5 通知スケジューリング
```typescript
setEvents(payload.t_events);
scheduleAll(payload.t_events);
```
**処理詳細:**
1. 現在の画面表示用にevents stateを更新
2. 各イベントに対して通知予約実行

#### 3.6 ステータス更新
```typescript
setStatus(isFromCache ? "error" : "ok");
```
**処理詳細:**
- キャッシュ取得なら "error" 扱い（接続失敗扱い）
- オンライン取得なら "ok"

### 4. 通知システム詳細フロー

#### 4.1 全イベントスケジューリング（scheduleAll）
```typescript
function scheduleAll(events: EventRow[]) {
    events.forEach(scheduleNotification);
}
```

#### 4.2 個別イベント処理（scheduleNotification）
```typescript
function scheduleNotification(event: EventRow) {
    if (!event.f_gather_time) return;
    const time = parseHHMM(event.f_gather_time);
    if (!time) return;

    const now = Date.now();
    const diff = time.getTime() - now;

    if (diff > 0) {
        setTimeout(() => showEventNotification(event), diff);
        console.log(`[予約] ${event.f_event_name} → ${event.f_gather_time} に通知予定`);
    }
}
```
**処理詳細:**
1. 集合時間が設定されているかチェック
2. "0930" 形式の文字列をDateオブジェクトに変換
3. 現在時刻との差分計算
4. 未来の時刻なら setTimeout で通知予約
5. 過去の時刻なら何もしない

#### 4.3 時刻パース（parseHHMM）
```typescript
function parseHHMM(hhmm: string): Date | null {
    const match = hhmm.match(/^(\d{2})(\d{2})$/);
    if (!match) return null;
    const now = new Date();
    return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        parseInt(match[1], 10),
        parseInt(match[2], 10),
        0
    );
}
```
**処理詳細:**
1. 正規表現で4桁数字をHH:MM形式に分解
2. 今日の日付に時・分を設定
3. 秒は0に固定

#### 4.4 通知表示（showEventNotification）
```typescript
function showEventNotification(event: EventRow) {
    if (Notification.permission !== "granted") return;
    const title = `イベント通知: ${event.f_event_name ?? "イベント"}`;
    const body = `${event.f_place ?? "場所未定"}で間もなく始まります`;
    new Notification(title, { body });
}
```
**処理詳細:**
1. 通知権限チェック
2. タイトル・本文生成
3. ブラウザ通知API呼び出し

### 5. Pull-to-Refresh フロー

#### 5.1 フック初期化
```typescript
const { pullDistance, isRefreshing } = usePullToRefresh({
    threshold: 60,
    onRefresh: async () => {
        await handleDownload();
    },
});
```
**処理詳細:**
- 60px引っ張ったら更新処理実行
- handleDownloadと同じ処理を呼び出し

#### 5.2 UI表示制御
```typescript
<div aria-hidden style={{ height: pullDistance }} />
{(pullDistance > 0 || isRefreshing) && (
    <div className="-mt-2 text-center text-xs opacity-80">
        {isRefreshing ? "読み込み中..." : pullDistance >= 60 ? "離すと更新" : "下にスワイプで更新"}
    </div>
)}
```
**処理詳細:**
1. pullDistanceに応じて空白スペース作成
2. 引っ張り中・更新中のインジケーター表示
3. 状態に応じてメッセージ切り替え

## 新ページ設計における処理分割方針

### check-in.tsx への移行
**移行する処理:**
- 学籍番号入力・バリデーション（handleSaveId）
- 初回データ取得（handleDownload）
- 通知スケジューリング（scheduleAll）

**変更点:**
- テキスト入力 → テンキー入力
- 保存後に設定画面遷移
- エラーハンドリング強化

### timetable.tsx への移行
**移行する処理:**
- データ表示
- データ更新（handleDownload）
- Pull-to-refresh

**変更点:**
- 学籍番号入力UI削除
- イベント詳細表示追加

### settings.tsx への移行
**移行する処理:**
- 通知設定管理
- 学生情報表示

**新規追加:**
- 通知on/off設定
- 権限管理UI

### 共通コンポーネント化
**対象となる処理:**
- fetchByGakuseki（API呼び出し）
- 通知システム全体
- LocalStorage操作
- Pull-to-refresh

## 複雑性の原因分析

### 1. 状態管理の複雑性
```typescript
type Status = "idle" | "no-id" | "loading" | "ok" | "error";
const [status, setStatus] = useState<Status>("idle");
const [inputId, setInputId] = useState("");
const [events, setEvents] = useState<EventRow[]>([]);
const [autoRefresh, setAutoRefresh] = useState(false);
const [lastRun, setLastRun] = useState<number | null>(null);
const [backoff, setBackoff] = useState(0);
```
**問題点:**
- 複数の状態が相互依存
- 状態遷移が複雑
- デバッグが困難

### 2. 副作用の複雑性
- 複数のuseEffectが相互作用
- 初期化順序の依存関係
- 非同期処理の競合状態

### 3. 責任の混在
- UI制御 + データ管理 + 通知処理が1つのコンポーネントに集約
- 単一責任原則の違反

## 解決方針

### 1. 責任分離
- 各ページが明確な役割を持つ
- コンポーネントの単一責任化

### 2. 状態管理の簡素化
- ページごとに必要最小限の状態のみ管理
- グローバル状態はLocalStorageで管理

### 3. 処理フローの明確化
- 線形的な処理フロー
- エラーハンドリングの標準化