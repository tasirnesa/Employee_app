import api from '../lib/axios';
import type { EvaluationSession } from '../types/interfaces';

export const getEvaluationSessions = async (): Promise<EvaluationSession[]> => {
  const response = await api.get('/api/sessions');
  return response.data;
};

export const getEvaluations = async () => {
  const response = await api.get('/api/evaluations');
  return response.data;
};

export const getEvaluationDetails = async (id: number | string) => {
  const response = await api.get(`/api/evaluations/${id}/details`);
  return response.data;
};

export const getMySummary = async () => {
  const response = await api.get('/api/evaluations/my-summary');
  return response.data;
};

export const createEvaluation = async (payload: any) => {
  const response = await api.post('/api/evaluations', payload);
  return response.data;
};
