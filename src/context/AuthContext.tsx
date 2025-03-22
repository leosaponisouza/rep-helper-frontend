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

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User, refreshToken?: string) => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  isAuthenticated: boolean;
  error: string | null;
  updateStoredUser: (userData: Partial<User>) => Promise<User | null>;
  clearError: () => void;
}

interface GetMeResponse {
  user: User;
}

interface LoginResponse {
  token: string;
  refreshToken?: string;
  data: {
    user: User
  }
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
  login: async () => {},
  loginWithCredentials: async () => {},
  logout: async () => {},
  refreshToken: async () => false,
  isAuthenticated: false,
  error: null,
  updateStoredUser: async () => null,
  clearError: () => {}
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

          const response: AxiosResponse<GetMeResponse> = await api.get('api/v1/users/me', {
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.data.user) {
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

  const login = async (token: string | any, userData: User, refreshToken?: string | any): Promise<void> => {
    try {
      // Garantir que os tokens sejam strings
      const tokenString = typeof token === 'string' ? token : String(token);
      const refreshTokenString = refreshToken && typeof refreshToken === 'string' 
        ? refreshToken 
        : refreshToken ? String(refreshToken) : undefined;
      
      // Armazenar dados de autenticação
      await storeToken(tokenString);
      if (refreshTokenString) {
        await storeRefreshToken(refreshTokenString);
      }
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
// Dentro do componente AuthProvider
// Trecho completo para substituir a função updateStoredUser no AuthContext.tsx

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

  const loginWithCredentials = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Implementação do login com credenciais
      // (Esta é apenas uma estrutura, você precisará usar sua API real)
      const response = await api.post<LoginResponse>('/auth/login', {
        email,
        password
      });
      
      const { token, refreshToken, data } = response.data;
      
      await login(token, data.user, refreshToken);
      
      // Navegar para tela principal
      if (data.user.currentRepublicId) {
        router.replace('/(panel)/home');
      } else {
        router.replace('/(republic)/choice');
      }
    } catch (error) {
      const parsedError = await ErrorHandler.parseError(error);
      setError(parsedError.message);
      ErrorHandler.logError(parsedError);
    } finally {
      setLoading(false);
    }
  };

 
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Logout do Firebase
      try {
        await signOut(auth);
      } catch (firebaseError) {
        console.error('Erro de logout do Firebase:', firebaseError);
        // Continuar com logout local mesmo que o Firebase falhe
      }

      // Notificar backend (opcional)
      try {
        const token = await getToken();
        if (token) {
          await api.post('/auth/logout', {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      } catch (apiError) {
        console.error('Erro ao notificar backend sobre logout:', apiError);
        // Continuar com logout local mesmo que a API falhe
      }

      // Limpar dados locais
      await clearAuthData();
      
      // Limpar estado
      setUser(null);
      setError(null);
      delete api.defaults.headers.common['Authorization'];
      
      // Redirecionar para login
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Erro durante logout:', error);
      setError('Erro ao fazer logout');
    } finally {
      setLoading(false);
    }
  };
  const refreshToken = async (): Promise<boolean> => {
    try {
      const currentRefreshToken = await getRefreshToken();
      if (!currentRefreshToken) return false;
  
      const response = await api.post('/api/v1/auth/refresh', {
        refreshToken: currentRefreshToken
      });
      
      if (response.data?.token) {
        await storeToken(response.data.token);
        if (response.data.refreshToken) {
          await storeRefreshToken(response.data.refreshToken);
        }
        
        // Atualizar cabeçalho para futuras requisições
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      return false;
    }
  };
  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      loginWithCredentials,
      logout, 
      refreshToken,
      isAuthenticated: !!user, 
      error,
      updateStoredUser,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;