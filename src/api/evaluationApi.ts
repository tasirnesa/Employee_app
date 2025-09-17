import axios from 'axios';
import type { EvaluationSession } from '../types'; // Use type-only import

const API_URL = 'http://localhost:3000/api';

export const getEvaluationSessions = async (): Promise<EvaluationSession[]> => {
  const response = await axios.get(`${API_URL}/sessions`);
  return response.data;
};