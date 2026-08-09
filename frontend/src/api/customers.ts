import client from './client';
import { Customer, PaginatedResponse } from '../types';

export const getCustomers = async (params?: { search?: string; status?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Customer>> => {
  const response = await client.get('/customers', { params });
  return response.data;
};

export const getCustomer = async (id: string): Promise<Customer> => {
  const response = await client.get(`/customers/${id}`);
  return response.data;
};

export const createCustomer = async (data: Partial<Customer>): Promise<Customer> => {
  const response = await client.post('/customers', data);
  return response.data;
};

export const updateCustomer = async (id: string, data: Partial<Customer>): Promise<Customer> => {
  const response = await client.put(`/customers/${id}`, data);
  return response.data;
};

export const deleteCustomer = async (id: string): Promise<void> => {
  await client.delete(`/customers/${id}`);
};

export const addNote = async (customerId: string, note: string) => {
  const response = await client.post(`/customers/${customerId}/notes`, { note });
  return response.data;
};
