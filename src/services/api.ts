// src/services/api.ts
import axios from 'axios';
import { getToken, getRefreshToken, storeToken, storeRefreshToken } from '../utils/storage';
import Constants from 'expo-constants';
import { ErrorHandler } from '../utils/errorHandling';

// Obter a URL base da API do Expo Constants
const extra = Constants.expoConfig?.extra || {};
const API_BASE_URL = 'http://192.168.100.6:3000/api/v1';

// Log para debug - remova em produção
console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Timeout em ms (15 segundos)
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
    ErrorHandler.logError(ErrorHandler.parseError(error));
    return Promise.reject(error);
  }
);

// Interceptor para lidar com erros de resposta e renovação de token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Se erro for 401 (Unauthorized) e não tentamos renovar o token ainda
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Verificar se temos um refresh token
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          throw new Error('Refresh token não disponível');
        }
        
        // Tentar renovar o token
        const response = await axios.post(`/api/v1/auth/refresh`, { 
          refreshToken 
        });
        
        if (response.data.token) {
          // Armazenar o novo token
          await storeToken(response.data.token);
          
          // Armazenar novo refresh token, se fornecido
          if (response.data.refreshToken) {
            await storeRefreshToken(response.data.refreshToken);
          }
          
          // Atualizar cabeçalho e repetir requisição original
          api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
          originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
          
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // Falha na renovação do token
        console.error('Falha ao renovar token:', refreshError);
      }
    }
    
    // Log do erro
    ErrorHandler.logError(ErrorHandler.parseError(error));
    
    // Continuar com o erro original
    return Promise.reject(error);
  }
);

// Função para checar conectividade
export const checkApiConnection = async (): Promise<boolean> => {
  try {
    await api.get('/api/v1/health', { timeout: 5000 });
    return true;
  } catch (error) {
    console.error('Falha na verificação de conexão com API:', error);
    return false;
  }
};

export default api;