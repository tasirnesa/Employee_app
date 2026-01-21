import api from '../lib/axios';

export interface Notification {
    id: number;
    userId: number;
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
    isRead: boolean;
    link?: string;
    createdAt: string;
}

export const fetchNotifications = async (): Promise<Notification[]> => {
    const response = await api.get('/api/notifications');
    return response.data;
};

export const markAsRead = async (id: number): Promise<Notification> => {
    const response = await api.put(`/api/notifications/${id}/read`);
    return response.data;
};

export const markAllAsRead = async (): Promise<{ message: string }> => {
    const response = await api.put('/api/notifications/read-all');
    return response.data;
};

export const deleteNotification = async (id: number): Promise<void> => {
    await api.delete(`/api/notifications/${id}`);
};
