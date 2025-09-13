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

export const getRecreationEvents = async (): Promise<RecreationEvent[]> => {
    const response: RecreationsResponse = await apiGet('/api/v1/recreations');
    return response.recreations.map(mapBackendToFrontend);
};
