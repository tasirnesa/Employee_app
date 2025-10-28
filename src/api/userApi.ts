import api from '../lib/axios';
import type { User } from '../types/interfaces';

export const login = async (username: string, password: string) => {
  const response = await api.post('/api/auth/login', { username, password });
  return response.data;
};

export const getUsers = async (): Promise<User[]> => {
  const response = await api.get('/api/users');
  return response.data;
};