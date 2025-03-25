// src/services/api.ts
import axios from 'axios';
import { getToken, getRefreshToken, storeToken, storeRefreshToken } from '../utils/storage';
import Constants from 'expo-constants';
import { ErrorHandler } from '../utils/errorHandling';
import { Platform } from 'react-native';

// Obter a URL base da API do Expo Constants
const extra = Constants.expoConfig?.extra || {};
let API_BASE_URL = extra.apiBaseUrl || process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.100.6:3000/api/v1';

// Garantir que a URL base termina com /api/v1
if (!API_BASE_URL.endsWith('/api/v1')) {
  API_BASE_URL = API_BASE_URL.endsWith('/') 
    ? `${API_BASE_URL}api/v1` 
    : `${API_BASE_URL}/api/v1`;
}

// Log para debug - útil para diagnosticar problemas de conexão
console.log('API Base URL completa:', API_BASE_URL);
console.log('Platform:', Platform.OS, Platform.Version);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // Timeout em ms (30 segundos) - aumentado para evitar timeouts prematuros
});

// Adicionar log para diagnóstico de erros de rede
if (__DEV__) {
  api.interceptors.request.use(request => {
    console.log('Request:', request.method?.toUpperCase(), request.url);
    return request;
  });
}

// Interceptor para adicionar o token JWT a todas as requisições
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return config;
    }
  },
  async (error) => {
    ErrorHandler.logError(await ErrorHandler.parseError(error));
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
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { 
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
    ErrorHandler.logError(await ErrorHandler.parseError(error));
    
    // Continuar com o erro original
    return Promise.reject(error);
  }
);

// Função para checar conectividade
export const checkApiConnection = async (): Promise<boolean> => {
  try {
    await api.get('api/v1/health', { timeout: 5000 });
    return true;
  } catch (error) {
    console.error('Falha na verificação de conexão com API:', error);
    return false;
  }
};

export default api;