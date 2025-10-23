import axios from '../lib/axios';
import type { AttendanceRecord, AttendanceSummary } from '../types/interfaces';

export const getAttendanceRecords = async (employeeId: number): Promise<AttendanceRecord[]> => {
  try {
    const response = await axios.get(`/api/attendance/employee/${employeeId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    throw error;
  }
};

export const getAttendanceByDateRange = async (
  startDate: string,
  endDate: string
): Promise<AttendanceRecord[]> => {
  try {
    const response = await axios.get(`/api/attendance?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance records by date range:', error);
    throw error;
  }
};

export const getAttendanceSummary = async (employeeId: number): Promise<AttendanceSummary> => {
  try {
    const response = await axios.get(`/api/attendance/summary/${employeeId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    throw error;
  }
};

export const getAttendanceSummaryByDateRange = async (
  startDate: string,
  endDate: string
): Promise<AttendanceSummary[]> => {
  try {
    const response = await axios.get(`/api/attendance/summary?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance summaries by date range:', error);
    throw error;
  }
};

export const checkIn = async (employeeId: number): Promise<AttendanceRecord> => {
  try {
    const response = await axios.post('/api/attendance/check-in', { employeeId });
    return response.data;
  } catch (error) {
    console.error('Error checking in:', error);
    throw error;
  }
};

export const checkOut = async (employeeId: number): Promise<AttendanceRecord> => {
  try {
    const response = await axios.post('/api/attendance/check-out', { employeeId });
    return response.data;
  } catch (error) {
    console.error('Error checking out:', error);
    throw error;
  }
};
export const addAttendanceRecord = async (record: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> => {
  try {
    const response = await axios.post('/api/attendance', record);
    return response.data;
  } catch (error) {
    console.error('Error adding attendance record:', error);
    throw error;
  }
};

export const updateAttendanceRecord = async (
  id: number,
  record: Partial<AttendanceRecord>
): Promise<AttendanceRecord> => {
  try {
    const response = await axios.put(`/api/attendance/${id}`, record);
    return response.data;
  } catch (error) {
    console.error('Error updating attendance record:', error);
    throw error;
  }
};

export const deleteAttendanceRecord = async (id: number): Promise<void> => {
  try {
    await axios.delete(`/api/attendance/${id}`);
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    throw error;
  }
};