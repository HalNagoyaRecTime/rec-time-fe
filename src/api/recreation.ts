import { apiGet } from "./client";

export interface RecreationEvent {
    id: number;
    title: string;
    startTime: number;
    endTime: number;
    date: string;
    startSlot: number;
    duration: number;
    participants: string[];
}

interface BackendRecreation {
    recreationId: number;
    title: string;
    description?: string;
    location: string;
    startTime: number;
    endTime: number;
    maxParticipants: number;
    status: string;
    participations?: Array<{
        studentId: number;
        status: string;
    }>;
}

interface RecreationsResponse {
    recreations: BackendRecreation[];
    total: number;
    limit: number;
    offset: number;
}


const calculateTimeSlot = (startTime: number): number => {
    const hours = Math.floor(startTime / 100);
    return Math.max(0, hours - 11);
};

const calculateDuration = (startTime: number, endTime: number): number => {
    const startHours = Math.floor(startTime / 100);
    const startMinutes = startTime % 100;
    const endHours = Math.floor(endTime / 100);
    const endMinutes = endTime % 100;
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    return Math.round((endTotalMinutes - startTotalMinutes) / 60);
};

const mapBackendToFrontend = (backendRecreation: BackendRecreation): RecreationEvent => {
    const startTime = backendRecreation.startTime;
    const endTime = backendRecreation.endTime;
    const startSlot = calculateTimeSlot(startTime);
    const duration = calculateDuration(startTime, endTime);

    const participants = backendRecreation.participations
        ? backendRecreation.participations
            .filter(p => p.status === 'registered')
            .map(p => p.studentId.toString())
        : [];

    return {
        id: backendRecreation.recreationId,
        title: backendRecreation.title,
        startTime,
        endTime,
        date: new Date().toISOString().split('T')[0], // 現在の日付を使用
        startSlot,
        duration,
        participants
    };
};

// テスト用のモックデータ（重なりテスト含む）
const mockTestData: RecreationEvent[] = [
    {
        id: 9001,
        title: "開会式",
        startTime: 900, // 09:00
        endTime: 930,   // 09:30
        date: new Date().toISOString().split('T')[0],
        startSlot: 0,
        duration: 1,
        participants: ["12345"]
    },
    {
        id: 9002,
        title: "走れ〇人〇脚！",
        startTime: 1000, // 10:00
        endTime: 1100,   // 11:00
        date: new Date().toISOString().split('T')[0],
        startSlot: 2,
        duration: 2,
        participants: ["12345", "54321"]
    },
    // 重なりテスト: 14:00-15:00の時間帯に3つの予定
    {
        id: 9003,
        title: "8人x50mチャレンジ",
        startTime: 1000, // 10:00
        endTime: 1100,   // 11:00
        date: new Date().toISOString().split('T')[0],
        startSlot: 3,
        duration: 1,
        participants: ["12345"]
    },
    {
        id: 9004,
        title: "真のストライカーは...",
        startTime: 1130, // 11:30
        endTime: 1230,   // 12:30
        date: new Date().toISOString().split('T')[0],
        startSlot: 3,
        duration: 1,
        participants: []
    },
    {
        id: 9005,
        title: "四天王ドッチボール",
        startTime: 1130, // 11:30
        endTime: 1230,   // 12:30
        date: new Date().toISOString().split('T')[0],
        startSlot: 3,
        duration: 1,
        participants: ["54321"]
    },
    // 重なりテスト: 16:30-17:30の時間帯に2つの予定
    {
        id: 9006,
        title: "HALダービー・レクリエーション杯",
        startTime: 1330, // 13:30
        endTime: 1530,   // 15:30
        date: new Date().toISOString().split('T')[0],
        startSlot: 5,
        duration: 1,
        participants: ["12345"]
    }
];

export const getRecreationEvents = async (): Promise<RecreationEvent[]> => {
    // const response: RecreationsResponse = await apiGet('/api/v1/recreations');
    // const backendEvents = response.recreations.map(mapBackendToFrontend);

    // バックエンドのデータとテスト用データを結合
    return [...mockTestData];
    // return [...backendEvents, ...mockTestData];
};
