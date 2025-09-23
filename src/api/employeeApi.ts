import api from '../lib/axios';
import type { Employee } from '../types/interfaces';

export const listEmployees = async (isActive?: boolean): Promise<Employee[]> => {
  const params = isActive == null ? {} : { isActive: String(isActive) };
  const res = await api.get(`/api/employees`, { params });
  return res.data;
};

export const getEmployee = async (id: number): Promise<Employee> => {
  const res = await api.get(`/api/employees/${id}`);
  return res.data;
};

export const createEmployee = async (payload: Partial<Employee> & { firstName: string; lastName: string; email: string }): Promise<Employee> => {
  const res = await api.post(`/api/employees`, payload);
  return res.data;
};

export const updateEmployee = async (id: number, payload: Partial<Employee>): Promise<Employee> => {
  const res = await api.put(`/api/employees/${id}`, payload);
  return res.data;
};

export const activateEmployee = async (id: number): Promise<Employee> => {
  const res = await api.patch(`/api/employees/${id}/activate`);
  return res.data;
};

export const deactivateEmployee = async (id: number): Promise<Employee> => {
  const res = await api.patch(`/api/employees/${id}/deactivate`);
  return res.data;
};


