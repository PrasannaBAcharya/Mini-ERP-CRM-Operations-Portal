import client from './client';
import { AuthUser } from '../types';

export const login = async (email: string, password: string): Promise<{ token: string; user: AuthUser }> => {
  const response = await client.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (data: any) => {
  const response = await client.post('/auth/register', data);
  return response.data;
};
