/**
 * 現在時刻の共通管理
 * 全体で統一した現在時刻を取得・管理
 * デバッグ時に時刻を固定できる
 */

let _currentTime = new Date();
let _autoUpdateInterval: ReturnType<typeof setInterval> | null = null;

/**
 * 現在時刻を取得
 */
export function getCurrentTime(): Date {
    return _currentTime;
}

/**
 * 時刻を指定して固定（自動更新停止）
 */
export function setTime(time: Date) {
    _currentTime = time;
    if (_autoUpdateInterval) {
        clearInterval(_autoUpdateInterval);
        _autoUpdateInterval = null;
    }
    console.log("[currentTimeManager] 時刻を固定:", time);
}

/**
 * リセット（実時刻に戻して自動更新を再開）
 */
export function resetTime() {
    _currentTime = new Date();
    if (!_autoUpdateInterval) {
        _autoUpdateInterval = setInterval(() => {
            _currentTime = new Date();
        }, 60000);
    }
    console.log("[currentTimeManager] リセット:", _currentTime);
}

// アプリ起動時に初期化
_currentTime = new Date();
_autoUpdateInterval = setInterval(() => {
    _currentTime = new Date();
}, 60000);

// 開発環境でブラウザコンソールからアクセス可能にする
if (typeof window !== 'undefined') {
    (window as any).getTime = getCurrentTime;
    (window as any).setTime = setTime;
    (window as any).resetTime = resetTime;
}