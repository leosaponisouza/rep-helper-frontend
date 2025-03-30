// src/services/api.ts
import axios from 'axios';
import { getToken, getRefreshToken, storeToken, storeRefreshToken } from '../utils/storage';
import Constants from 'expo-constants';
import { ErrorHandler } from '../utils/errorHandling';
import { Platform } from 'react-native';

// Obter a URL base da API do Expo Constants
const extra = Constants.expoConfig?.extra || {};
let API_BASE_URL = extra.apiBaseUrl || process.env.EXPO_PUBLIC_API_BASE_URL ;

// Garantir que a URL base NÃO termina com /api/v1
if (API_BASE_URL.endsWith('/api/v1')) {
  API_BASE_URL = API_BASE_URL.substring(0, API_BASE_URL.length - 7);
} else if (API_BASE_URL.endsWith('/api/v1/')) {
  API_BASE_URL = API_BASE_URL.substring(0, API_BASE_URL.length - 8);
}

// Log para debug - será removido depois
console.log('API_BASE_URL configurada como:', API_BASE_URL);

// Removendo logs de depuração para produção

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // Timeout em ms (30 segundos) - aumentado para evitar timeouts prematuros
});

// Adicionar log para diagnóstico de erros de rede apenas em desenvolvimento
if (__DEV__) {
  api.interceptors.request.use(request => {
    console.log('Request:', request.method?.toUpperCase(), request.url);
    // Log do token para debug
    if (request.headers.Authorization) {
      const authHeader = String(request.headers.Authorization);
      console.log('Token sendo enviado:', authHeader.substring(0, 25) + '...');
    } else {
      console.log('AVISO: Nenhum token de autorização presente nesta requisição');
    }
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
        if (__DEV__) {
          console.log('Interceptor: Token adicionado ao header', token.substring(0, 15) + '...');
        }
      } else if (__DEV__) {
        console.log('Interceptor: Nenhum token encontrado no armazenamento');
      }
      return config;
    } catch (error) {
      // Removendo log de erro para produção
      if (__DEV__) {
        console.error('Erro ao obter token do armazenamento:', error);
      }
      return config;
    }
  },
  async (error) => {
    // Em produção, apenas registramos o erro através do ErrorHandler
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
        // Verificar se temos um token
        const token = await getToken();
        if (!token) {
          throw new Error('Token não disponível');
        }
        
        // Tentar renovar o token
        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, { 
          token 
        });
        
        if (response.data.token) {
          // Armazenar o novo token
          await storeToken(response.data.token);
          
          // Atualizar cabeçalho e repetir requisição original
          api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
          originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
          
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // Falha na renovação do token - removendo log para produção
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
    await api.get('/api/v1/health', { timeout: 5000 });
    return true;
  } catch (error) {
    // Removendo log de erro para produção
    return false;
  }
};

export default api;