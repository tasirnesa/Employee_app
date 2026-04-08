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
  const response = await api.get<DocumentCategory[]>('/documents/categories');
  return response.data;
};

export const createCategory = async (data: Partial<DocumentCategory>) => {
  const response = await api.post<DocumentCategory>('/documents/categories', data);
  return response.data;
};

export const deleteCategory = async (id: number) => {
  await api.delete(`/documents/categories/${id}`);
};

export const getDocuments = async (params?: any) => {
  const response = await api.get<Document[]>('/documents', { params });
  return response.data;
};

export const uploadDocument = async (data: any) => {
  // Assuming a standard simple object for now, 
  // if actual file upload is needed, this would use FormData
  const response = await api.post<Document>('/documents', data);
  return response.data;
};

export const updateDocument = async (id: number, data: any) => {
  const response = await api.put<Document>(`/documents/${id}`, data);
  return response.data;
};

export const deleteDocument = async (id: number) => {
  await api.delete(`/documents/${id}`);
};

export const verifyDocument = async (id: number) => {
  const response = await api.patch<Document>(`/documents/${id}/verify`);
  return response.data;
};
