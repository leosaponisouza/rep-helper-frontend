// src/services/api.ts
import axios from 'axios';
import { getToken } from '../utils/storage'; // Importe getToken

const api = axios.create({
  baseURL: 'http://192.168.100.6:3000/api/v1', // SUA URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token JWT a todas as requisições
api.interceptors.request.use(
  async (config) => {
    const token = await getToken(); // Obtém o token do AsyncStorage *DENTRO* do interceptor
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;