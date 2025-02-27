import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User } from '../models/user.model';
import { getToken, storeToken, removeToken, removeData } from '../utils/storage';
import api from '../services/api';
import axios, { AxiosResponse } from 'axios';
import { signOut } from 'firebase/auth';
import { auth } from '../utils/firebaseClientConfig';
import { router } from 'expo-router';

interface AuthContextProps {
    user: User | null;
    loading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextProps>({
    user: null,
    loading: true,
    login: () => { },
    logout: async () => { },
    isAuthenticated: false,
    error: null,
});

interface GetMeResponse {
    data: {
        user: User
    }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = await getToken();
                if (token) {
                    const source = axios.CancelToken.source();

                    try {
                        const response: AxiosResponse<GetMeResponse> = await api.get('/users/me', {
                            cancelToken: source.token,
                        });
                        login(token, response.data.data.user)
                    } catch (error) {
                        if (axios.isCancel(error)) {
                            console.log('Request canceled', error.message);
                        } else {
                            console.error("Erro ao carregar usuário:", error);
                            await removeToken();
                            setError("Erro ao carregar dados do usuário");
                        }
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

    const login = (token: string, userData: User) => {
        storeToken(token);
        setUser(userData);
        setError(null);
    };

    const logout = async () => {
        try {
            // Logout do Firebase
            await signOut(auth);

            // Remover token e dados do usuário
            await removeToken();
            await removeData('user');

            // Limpar estado do usuário
            setUser(null);
            setError(null);

            // Redirecionar para tela de login
            router.replace('/(auth)/sign-in');
        } catch (error) {
            console.error('Erro durante o logout:', error);
            setError('Erro ao fazer logout');
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            loading, 
            login, 
            logout, 
            isAuthenticated: !!user, 
            error 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;