import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { User } from '../models/user.model';
import { 
  getToken, storeToken, removeToken, 
  getRefreshToken, storeRefreshToken, removeRefreshToken,
  storeData, getData, removeData, clearAuthData 
} from '../utils/storage';
import api from '../services/api';
import axios, { AxiosResponse } from 'axios';
import { signOut } from 'firebase/auth';
import { auth } from '../utils/firebaseClientConfig';
import { router } from 'expo-router';
import { ErrorHandler } from '../utils/errorHandling';
import * as authService from '../services/authService';
 
interface AuthContextProps {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => Promise<void>;
  loginWithCredentials: (email: string, password: string, cancelRef?: React.MutableRefObject<boolean>) => Promise<void>;
  loginWithFirebaseToken: (firebaseToken: string, cancelRef?: React.MutableRefObject<boolean>) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  isAuthenticated: boolean;
  error: string | null;
  updateStoredUser: (userData: Partial<User>) => Promise<User | null>;
  clearError: () => void;
  signUp: (email: string, password: string, userData: {
    name: string;
    nickname: string | null;
    phoneNumber: string;
  }, cancelRef?: React.MutableRefObject<boolean>) => Promise<User | null>;
  setLoading: (loading: boolean) => void;
}

interface GetMeResponse {
  user: User;
}

interface LoginResponse {
  token: string;
  data: {
    user: User
  }
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
  login: async () => {},
  loginWithCredentials: async () => {},
  loginWithFirebaseToken: async () => {},
  logout: async () => {},
  refreshToken: async () => false,
  isAuthenticated: false,
  error: null,
  updateStoredUser: async () => null,
  clearError: () => {},
  signUp: async () => null,
  setLoading: () => {}
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await getToken();
        if (!token) {
          setLoading(false);
          return;
        }

        // Primeiro carregamos do cache para UI instantânea
        try {
          const cachedUserData = await getData('user');
          if (cachedUserData) {
            const cachedUser = JSON.parse(cachedUserData);
            console.log('Carregando usuário do cache:', cachedUser);
            setUser(cachedUser);
          }
        } catch (cacheError) {
          console.error("Erro ao carregar usuário do cache:", cacheError);
        }

        // Configurar token para requisições
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Verificar com o servidor
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response: AxiosResponse<GetMeResponse> = await api.get('/api/v1/users/me', {
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.data.user) {
            console.log('Dados do usuário recebidos do servidor:', response.data.user);
            setUser(response.data.user);
            // Atualizar cache
            await storeData('user', JSON.stringify(response.data.user));
            setError(null);
          }
        } catch (error) {
          if (axios.isCancel(error)) {
            console.log('Requisição cancelada por timeout');
          } else if (axios.isAxiosError(error) && error.response?.status === 401) {
            // Tentar refresh token
            const refreshSuccessful = await refreshToken();
            if (!refreshSuccessful) {
              console.error("Token expirado e não foi possível renovar");
              await clearAuthData();
              setUser(null);
              setError("Sessão expirada. Por favor, faça login novamente.");
            }
          } else {
            console.error("Erro ao carregar usuário:", error);
            await removeToken();
            setError("Erro ao carregar dados do usuário");
          }
        }
      } catch (err) {
        console.error("Erro ao recuperar token:", err);
        setError("Erro ao recuperar token de autenticação");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (token: string | any, userData: User): Promise<void> => {
    try {
      // Garantir que o token seja string
      const tokenString = typeof token === 'string' ? token : String(token);
      
      // Armazenar dados de autenticação
      await storeToken(tokenString);
      await storeData('user', JSON.stringify(userData));
      
      // Atualizar estado e cabeçalho de API
      setUser(userData);
      setError(null);
      api.defaults.headers.common['Authorization'] = `Bearer ${tokenString}`;
    } catch (error) {
      console.error('Erro ao salvar dados de login:', error);
      throw error;
    }
  };

  const updateStoredUser = useCallback(async (userData: Partial<User>) => {
    try {
      // Recuperar usuário atual armazenado
      const currentUserString = await getData('user');
      
      if (currentUserString) {
        // Parse do usuário atual
        const currentUser = JSON.parse(currentUserString);
        
        // Tratar o campo nickname como caso especial
        const processedUserData = { ...userData };
        
        // Se nickname for string vazia, converter para null
        if ('nickname' in processedUserData) {
          if (!processedUserData.nickname || processedUserData.nickname.trim() === '') {
            processedUserData.nickname = null;
          } else {
            // Garantir que é uma string limpa
            processedUserData.nickname = processedUserData.nickname.trim();
          }
        }
        
        // Mesclar dados do usuário
        const updatedUser = {
          ...currentUser,
          ...processedUserData
        };
        
        // Armazenar usuário atualizado
        await storeData('user', JSON.stringify(updatedUser));
        
        // Atualizar estado do contexto
        setUser(updatedUser);
        
        console.log('Usuário atualizado no contexto e storage:', updatedUser);
        
        return updatedUser;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao atualizar usuário armazenado:', error);
      return null;
    }
  }, []);

  // Função para ajustar o estado de loading externamente
  const setLoadingState = (loading: boolean) => {
    setLoading(loading);
  };

  const loginWithCredentials = async (
    email: string, 
    password: string,
    cancelRef?: React.MutableRefObject<boolean>
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Configurar timeout para a operação de login
      const loginPromise = authService.loginWithEmailPassword(email, password);
      
      // Timeout de 20 segundos para todo o processo de login
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Tempo limite excedido. Verifique sua conexão e tente novamente.')), 20000);
      });
      
      // Usar Promise.race para aplicar o timeout à requisição de login
      const response = await Promise.race([loginPromise, timeoutPromise]);
      
      // Verificar se a operação foi cancelada
      if (cancelRef?.current) {
        setLoading(false);
        return;
      }
      
      await login(response.token, response.user);
      
      // Verificar novamente se a operação foi cancelada antes de navegar
      if (cancelRef?.current) {
        setLoading(false);
        return;
      }
      
      // Navegar para tela principal
      if (response.user.currentRepublicId) {
        router.replace('/(panel)/home');
      } else {
        router.replace('/(republic)/choice');
      }
    } catch (error) {
      // Verificar se a operação foi cancelada
      if (cancelRef?.current) {
        setLoading(false);
        return;
      }
      
      const parsedError = await ErrorHandler.parseError(error);
      setError(parsedError.message);
      ErrorHandler.logError(parsedError);
    } finally {
      // Se não foi cancelado, definir loading como falso
      if (!cancelRef?.current) {
        setLoading(false);
      }
    }
  };

  const loginWithFirebaseToken = async (
    firebaseToken: string,
    cancelRef?: React.MutableRefObject<boolean>
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Configurar timeout para a operação de login
      const loginPromise = authService.loginWithFirebaseToken(firebaseToken);
      
      // Timeout de 20 segundos para todo o processo de login
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Tempo limite excedido. Verifique sua conexão e tente novamente.')), 20000);
      });
      
      // Usar Promise.race para aplicar o timeout à requisição de login
      const response = await Promise.race([loginPromise, timeoutPromise]);
      
      // Verificar se a operação foi cancelada
      if (cancelRef?.current) {
        setLoading(false);
        return;
      }
      
      await login(response.token, response.user);
      
      // Verificar novamente se a operação foi cancelada antes de navegar
      if (cancelRef?.current) {
        setLoading(false);
        return;
      }
      
      // Navegar para tela principal
      if (response.user.currentRepublicId) {
        router.replace('/(panel)/home');
      } else {
        router.replace('/(republic)/choice');
      }
    } catch (error) {
      // Verificar se a operação foi cancelada
      if (cancelRef?.current) {
        setLoading(false);
        return;
      }
      
      const parsedError = await ErrorHandler.parseError(error);
      setError(parsedError.message);
      ErrorHandler.logError(parsedError);
    } finally {
      // Se não foi cancelado, definir loading como falso
      if (!cancelRef?.current) {
        setLoading(false);
      }
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      
      await authService.logout();
      
      // Limpar estado
      setUser(null);
      delete api.defaults.headers.common['Authorization'];
      
      // Redirecionar para login
      router.replace('/(auth)/sign-in');
    } catch (error) {
      const parsedError = await ErrorHandler.parseError(error);
      setError(parsedError.message);
      ErrorHandler.logError(parsedError);
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const currentToken = await getToken();
      if (!currentToken) return false;
      
      const response = await authService.refreshAuthToken(currentToken);
      
      // Atualizar token e dados do usuário
      setUser(response.user);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
      
      return true;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      return false;
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    userData: {
      name: string;
      nickname: string | null;
      phoneNumber: string;
    },
    cancelRef?: React.MutableRefObject<boolean>
  ): Promise<User | null> => {
    try {
      setLoading(true);
      clearError();

      // Configurar timeout para a operação de cadastro
      const signupPromise = authService.signUp(email, password, userData, cancelRef);
      
      // Timeout de 25 segundos para todo o processo de cadastro (um pouco maior pois envolve 2 requisições)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Tempo limite excedido. Verifique sua conexão e tente novamente.')), 25000);
      });
      
      // Usar Promise.race para aplicar o timeout à requisição de cadastro
      const response = await Promise.race([signupPromise, timeoutPromise]);
      
      // Verificar se a operação foi cancelada
      if (cancelRef?.current) {
        setLoading(false);
        return null;
      }
      
      // Armazenar token
      await storeToken(response.token);
      await storeData('user', JSON.stringify(response.user));
      
      // Verificar novamente se a operação foi cancelada antes de finalizar o login
      if (cancelRef?.current) {
        await clearAuthData();
        setLoading(false);
        return null;
      }
      
      setUser(response.user);
      // Não precisamos chamar setIsAuthenticated explicitamente, pois isAuthenticated é calculado com base em !!user
      setLoading(false);
      
      // Navegar para tela de escolha de república
      router.replace('/(republic)/choice');
      
      return response.user;
    } catch (error: any) {
      // Verificar se a operação foi cancelada
      if (cancelRef?.current) {
        setLoading(false);
        return null;
      }
      
      setLoading(false);
      const parsedError = await ErrorHandler.parseError(error);
      setError(parsedError.message);
      ErrorHandler.logError(parsedError);
      return null;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login,
        loginWithCredentials,
        loginWithFirebaseToken,
        logout, 
        refreshToken,
        isAuthenticated: !!user,
        error,
        updateStoredUser,
        clearError,
        signUp,
        setLoading: setLoadingState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;