import axios from 'axios';
import type { User } from '../types'; // Use type-only import

const API_URL = 'http://localhost:3000/api';

export const login = async (username: string, password: string) => {
  const response = await axios.post(`${API_URL}/auth/login`, { username, password });
  return response.data;
};

export const getUsers = async (): Promise<User[]> => {
  const response = await axios.get(`${API_URL}/users`);
  return response.data;
};