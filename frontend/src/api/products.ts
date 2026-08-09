import client from './client';
import { Product, StockMovement, PaginatedResponse } from '../types';

export const getProducts = async (params?: { search?: string; category?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Product>> => {
  const response = await client.get('/products', { params });
  return response.data;
};

export const getProduct = async (id: string): Promise<Product> => {
  const response = await client.get(`/products/${id}`);
  return response.data;
};

export const createProduct = async (data: Partial<Product>): Promise<Product> => {
  const response = await client.post('/products', data);
  return response.data;
};

export const updateProduct = async (id: string, data: Partial<Product>): Promise<Product> => {
  const response = await client.put(`/products/${id}`, data);
  return response.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await client.delete(`/products/${id}`);
};

export const addStockMovement = async (id: string, data: { quantityChanged: number; type: 'IN' | 'OUT'; reason: string }): Promise<StockMovement> => {
  const response = await client.post(`/products/${id}/stock-movement`, data);
  return response.data;
};

export const getStockHistory = async (id: string, page: number = 1): Promise<PaginatedResponse<StockMovement>> => {
  const response = await client.get(`/products/${id}/stock-history`, { params: { page } });
  return response.data;
};
