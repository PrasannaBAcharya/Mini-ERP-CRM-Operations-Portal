import client from './client';
import { Challan, PaginatedResponse } from '../types';

export const getChallans = async (params?: { status?: string; customerId?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Challan>> => {
  const response = await client.get('/challans', { params });
  return response.data;
};

export const getChallan = async (id: string): Promise<Challan> => {
  const response = await client.get(`/challans/${id}`);
  return response.data;
};

export const createChallan = async (data: any): Promise<Challan> => {
  const response = await client.post('/challans', data);
  return response.data;
};

export const updateChallan = async (id: string, data: any): Promise<Challan> => {
  const response = await client.patch(`/challans/${id}`, data);
  return response.data;
};

export const confirmChallan = async (id: string): Promise<Challan> => {
  const response = await client.post(`/challans/${id}/confirm`);
  return response.data;
};

export const cancelChallan = async (id: string): Promise<Challan> => {
  const response = await client.post(`/challans/${id}/cancel`);
  return response.data;
};
