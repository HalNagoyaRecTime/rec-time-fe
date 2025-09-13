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

export const getRecreationEvents = async (): Promise<RecreationEvent[]> => {
    const response = await apiGet('/api/v1/recreations');
    return response;
};
