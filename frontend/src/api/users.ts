import client from './client';
import { User, PaginatedResponse } from '../types';

export const getUsers = async (page: number = 1): Promise<PaginatedResponse<User>> => {
  const response = await client.get('/users', { params: { page } });
  return response.data;
};

export const getUser = async (id: string): Promise<User> => {
  const response = await client.get(`/users/${id}`);
  return response.data;
};

export const updateUser = async (id: string, data: Partial<User>): Promise<User> => {
  const response = await client.put(`/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await client.delete(`/users/${id}`);
};
