import axios from '../lib/axios';
import type { AttendanceRecord, AttendanceSummary } from '../types/interfaces';

// Get attendance records for an employee
export const getAttendanceRecords = async (employeeId: number): Promise<AttendanceRecord[]> => {
  try {
    const response = await axios.get(`/attendance/employee/${employeeId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    throw error;
  }
};

// Get attendance records by date range
export const getAttendanceByDateRange = async (
  startDate: string,
  endDate: string
): Promise<AttendanceRecord[]> => {
  try {
    const response = await axios.get(`/attendance?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance records by date range:', error);
    throw error;
  }
};

// Get attendance summary for an employee
export const getAttendanceSummary = async (employeeId: number): Promise<AttendanceSummary> => {
  try {
    const response = await axios.get(`/attendance/summary/${employeeId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    throw error;
  }
};

// Get attendance summary by date range
export const getAttendanceSummaryByDateRange = async (
  startDate: string,
  endDate: string
): Promise<AttendanceSummary[]> => {
  try {
    const response = await axios.get(`/attendance/summary?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance summaries by date range:', error);
    throw error;
  }
};

// Check in
export const checkIn = async (employeeId: number): Promise<AttendanceRecord> => {
  try {
    const response = await axios.post('/attendance/check-in', { employeeId });
    return response.data;
  } catch (error) {
    console.error('Error checking in:', error);
    throw error;
  }
};

// Check out
export const checkOut = async (employeeId: number): Promise<AttendanceRecord> => {
  try {
    const response = await axios.post('/attendance/check-out', { employeeId });
    return response.data;
  } catch (error) {
    console.error('Error checking out:', error);
    throw error;
  }
};

// Add manual attendance record
export const addAttendanceRecord = async (record: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> => {
  try {
    const response = await axios.post('/attendance', record);
    return response.data;
  } catch (error) {
    console.error('Error adding attendance record:', error);
    throw error;
  }
};

// Update attendance record
export const updateAttendanceRecord = async (
  id: number,
  record: Partial<AttendanceRecord>
): Promise<AttendanceRecord> => {
  try {
    const response = await axios.put(`/attendance/${id}`, record);
    return response.data;
  } catch (error) {
    console.error('Error updating attendance record:', error);
    throw error;
  }
};

// Delete attendance record
export const deleteAttendanceRecord = async (id: number): Promise<void> => {
  try {
    await axios.delete(`/attendance/${id}`);
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    throw error;
  }
};