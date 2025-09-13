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
        title: "ヨガ教室",
        startTime: 1115, // 11:15
        endTime: 1200,   // 12:00
        date: new Date().toISOString().split('T')[0],
        startSlot: 0,
        duration: 1,
        participants: ["12345"]
    },
    {
        id: 9002,
        title: "卓球トーナメント",
        startTime: 1330, // 13:30
        endTime: 1515,   // 15:15
        date: new Date().toISOString().split('T')[0],
        startSlot: 2,
        duration: 2,
        participants: ["12345", "54321"]
    },
    // 重なりテスト: 14:00-15:00の時間帯に3つの予定
    {
        id: 9003,
        title: "料理教室A",
        startTime: 1400, // 14:00
        endTime: 1500,   // 15:00
        date: new Date().toISOString().split('T')[0],
        startSlot: 3,
        duration: 1,
        participants: ["12345"]
    },
    {
        id: 9004,
        title: "英会話クラス",
        startTime: 1415, // 14:15
        endTime: 1445,   // 14:45
        date: new Date().toISOString().split('T')[0],
        startSlot: 3,
        duration: 1,
        participants: []
    },
    {
        id: 9005,
        title: "音楽教室",
        startTime: 1430, // 14:30
        endTime: 1530,   // 15:30
        date: new Date().toISOString().split('T')[0],
        startSlot: 3,
        duration: 1,
        participants: ["54321"]
    },
    // 重なりテスト: 16:30-17:30の時間帯に2つの予定
    {
        id: 9006,
        title: "テニス教室",
        startTime: 1630, // 16:30
        endTime: 1730,   // 17:30
        date: new Date().toISOString().split('T')[0],
        startSlot: 5,
        duration: 1,
        participants: ["12345"]
    },
    {
        id: 9007,
        title: "水泳教室",
        startTime: 1645, // 16:45
        endTime: 1745,   // 17:45
        date: new Date().toISOString().split('T')[0],
        startSlot: 5,
        duration: 1,
        participants: []
    },
    {
        id: 9008,
        title: "映画鑑賞",
        startTime: 1945, // 19:45
        endTime: 2130,   // 21:30
        date: new Date().toISOString().split('T')[0],
        startSlot: 8,
        duration: 2,
        participants: ["12345"]
    },
    {
        id: 9009,
        title: "読書会",
        startTime: 2100, // 21:00
        endTime: 2130,   // 21:30
        date: new Date().toISOString().split('T')[0],
        startSlot: 10,
        duration: 1,
        participants: []
    }
];

export const getRecreationEvents = async (): Promise<RecreationEvent[]> => {
    const response: RecreationsResponse = await apiGet('/api/v1/recreations');
    const backendEvents = response.recreations.map(mapBackendToFrontend);

    // バックエンドのデータとテスト用データを結合
    return [...backendEvents, ...mockTestData];
};
