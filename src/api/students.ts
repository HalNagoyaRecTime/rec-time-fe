import { apiGet } from "./client";

export interface StudentInfo {
    studentId: string;
    class: string;
    attendanceNumber: string;
    name: string;
}

export const getStudentInfo = async (studentId: string): Promise<StudentInfo> => {
    const response = await apiGet(`/api/v1/students/${studentId}`);
    return response;
};
