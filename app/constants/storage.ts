// LocalStorageキーを一元管理
// LocalStorage 키를 일원 관리

export const STORAGE_KEYS = {
    // 学生情報 学生情報
    STUDENT_ID: "student:id",
    STUDENT_DATA: "student:data",
    STUDENT_BIRTHDAY: "student:birthday",
    STUDENT_NAME: "student:name",

    // イベント情報 イベント情報
    EVENTS: (id: string) => `events:list:${id}`,
    LAST_UPDATED: "student:payload:lastUpdated",
    LAST_DATA_UPDATE_COUNT: "student:lastDataUpdateCount",  // 🆕 最後に確認したデータ更新ログの件数

    // 通知設定 通知設定
    NOTIFICATION_ENABLED: "notification:enabled",

    // 通知履歴・変更履歴 通知履歴・変更履歴
    NOTIFICATIONS: (id: string) => `notifs:list:${id}`,
    UPDATES: (id: string) => `updates:list:${id}`,
} as const;