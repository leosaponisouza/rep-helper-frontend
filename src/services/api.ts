// src/services/api.ts
import axios from 'axios';
import { getToken } from '../utils/storage';
import Constants from 'expo-constants';

// Obter a URL base da API do Expo Constants
const extra = Constants.expoConfig?.extra || {};
const API_BASE_URL = extra.apiBaseUrl || 'http://192.168.100.6:3000/api/v1';

// Log para debug - remova em produção
console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // timeout em ms
});

// Interceptor para adicionar o token JWT a todas as requisições
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para lidar com erros de resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log do erro para debug - ajuste conforme necessário
    console.error('API Error:', error.message);
    
    // Se o servidor retornou uma resposta com erro
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    
    return Promise.reject(error);
  }
);

export default api;