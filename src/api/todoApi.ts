import axios from '../lib/axios';
import type { Todo } from '../types/interfaces';

export const getTodos = async (userId: number): Promise<Todo[]> => {
  try {
    const response = await axios.get(`/api/todos/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching todos:', error);
    throw error;
  }
};

export const getTodo = async (id: number): Promise<Todo> => {
  try {
    const response = await axios.get(`/api/todos/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching todo:', error);
    throw error;
  }
};

export const createTodo = async (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Todo> => {
  try {
    const response = await axios.post('/api/todos', todo);
    return response.data;
  } catch (error) {
    console.error('Error creating todo:', error);
    throw error;
  }
};

export const updateTodo = async (id: number, todo: Partial<Todo>): Promise<Todo> => {
  try {
    const response = await axios.put(`/api/todos/${id}`, todo);
    return response.data;
  } catch (error) {
    console.error('Error updating todo:', error);
    throw error;
  }
};

export const deleteTodo = async (id: number): Promise<void> => {
  try {
    await axios.delete(`/api/todos/${id}`);
  } catch (error) {
    console.error('Error deleting todo:', error);
    throw error;
  }
};

export const toggleTodo = async (id: number): Promise<Todo> => {
  try {
    const response = await axios.patch(`/api/todos/${id}/toggle`);
    return response.data;
  } catch (error) {
    console.error('Error toggling todo:', error);
    throw error;
  }
};