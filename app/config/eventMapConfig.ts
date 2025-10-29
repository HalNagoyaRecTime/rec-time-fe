// === イベントごとの地図画像と外部リンク設定 ===

/**
 * イベントの地図設定
 */
export interface EventMapConfig {
    /** 地図画像のURL（/images/以下のパス） */
    imageUrl: string;
    /** 外部リンクURL（オプション） */
    externalUrl?: string;
    /** リンクボタンのラベル（オプション、デフォルト: "詳細を見る"） */
    linkLabel?: string;
}

/**
 * イベントIDごとの地図設定
 *
 * 使い方:
 * - imageUrl: /images/以下の画像ファイル名を指定
 * - externalUrl: 外部リンクがある場合のみ指定（Googleマップ、PDFなど）
 * - linkLabel: リンクボタンのテキストをカスタマイズしたい場合に指定
 */
export const eventMapConfigs: Record<number, EventMapConfig> = {
    // event_id: 4 - 走れ〇人〇脚
    4: {
        imageUrl: "/images/area-marunin-01.jpg",
        // externalUrl: "https://example.com/marunin", // 必要に応じて追加
    },

    // event_id: 5 - ガチンコ綱引き
    5: {
        imageUrl: "/images/area-tunahiki-01.jpg",
        // externalUrl: "https://example.com/tunahiki",
    },

    // event_id: 6 - 四天王ドッチボール
    6: {
        imageUrl: "/images/area-dotchiboru-01.jpg",
        // externalUrl: "https://example.com/dotchiboru",
    },

    // event_id: 10 - 紙飛行機飛ばし
    10: {
        imageUrl: "/images/area-airplane-01.jpg",
        externalUrl: "https://rectime-web.pages.dev/kamihikouki",
    },

    // event_id: 11 - 学科別対抗リレー
    11: {
        imageUrl: "/images/area-relay-01.jpg",
        // externalUrl: "https://example.com/relay",
    },

    // 他のイベントも必要に応じて追加
    // 例:
    // 3: {
    //     imageUrl: "/images/area-opening-01.jpg",
    //     externalUrl: "https://maps.google.com/?q=開会式会場",
    //     linkLabel: "Googleマップで見る",
    // },
};

/**
 * デフォルトの地図画像URL（設定がないイベント用）
 */
export const DEFAULT_MAP_IMAGE_URL = "https://placehold.co/600x400/1e3a8a/fbbf24?text=競技場マップ";

/**
 * イベントIDから地図設定を取得
 */
export function getEventMapConfig(eventId: number): EventMapConfig {
    return (
        eventMapConfigs[eventId] || {
            imageUrl: DEFAULT_MAP_IMAGE_URL,
        }
    );
}
