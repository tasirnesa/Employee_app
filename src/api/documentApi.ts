import api from '../lib/axios';

export interface DocumentCategory {
  id: number;
  name: string;
  description?: string;
  _count?: {
    documents: number;
  };
}

export interface Document {
  id: number;
  title: string;
  description?: string;
  fileUrl: string;
  fileType?: string;
  categoryId: number;
  status: 'Active' | 'Expired' | 'Archived';
  expiryDate?: string;
  remindDaysBefore: number;
  createdAt: string;
  category?: DocumentCategory;
  user?: {
    id: number;
    fullName: string;
  };
}

export const getCategories = async () => {
  const response = await api.get<DocumentCategory[]>('/api/documents/categories');
  return response.data;
};

export const createCategory = async (data: Partial<DocumentCategory>) => {
  const response = await api.post<DocumentCategory>('/api/documents/categories', data);
  return response.data;
};

export const deleteCategory = async (id: number) => {
  await api.delete(`/api/documents/categories/${id}`);
};

export const getDocuments = async (params?: any) => {
  const response = await api.get<Document[]>('/api/documents', { params });
  return response.data;
};

export const uploadDocument = async (data: FormData) => {
  const response = await api.post<Document>('/api/documents', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateDocument = async (id: number, data: any) => {
  const response = await api.put<Document>(`/api/documents/${id}`, data);
  return response.data;
};

export const deleteDocument = async (id: number) => {
  await api.delete(`/api/documents/${id}`);
};

export const verifyDocument = async (id: number) => {
  const response = await api.patch<Document>(`/api/documents/${id}/verify`);
  return response.data;
};
