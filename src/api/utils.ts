export const formatTime = (time: number): string => {
    const hours = Math.floor(time / 100);
    const minutes = time % 100;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const parseTime = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 100 + minutes;
};
