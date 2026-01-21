import api from '../lib/axios';
import type { Message } from '../types/interfaces';

export const getMessages = async (userId: number): Promise<Message[]> => {
    const response = await api.get(`/api/messages/${userId}`);
    return response.data;
};

export const getThreads = async (): Promise<any[]> => {
    const response = await api.get('/api/messages/threads');
    return response.data;
};

export const sendMessage = async (data: { receiverId: number; text?: string; image?: string; parentId?: string | null }): Promise<Message> => {
    const response = await api.post('/api/messages', data);
    return response.data;
};

export const markAsRead = async (messageId: string): Promise<Message> => {
    const response = await api.patch(`/api/messages/${messageId}/read`);
    return response.data;
};
