import api from '../lib/axios';
import type { EvaluationSession } from '../types/interfaces';

export const getEvaluationSessions = async (): Promise<EvaluationSession[]> => {
  const response = await api.get('/api/sessions');
  return response.data;
};