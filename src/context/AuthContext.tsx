import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User } from '../models/user.model'; // Ajuste o caminho se necessário
import { getToken, storeToken, removeToken } from '../utils/storage';
import api from '../services/api';
import axios, { AxiosResponse } from 'axios';

interface AuthContextProps {
    user: User | null;
    loading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    error: string | null; // Add error state
}

const AuthContext = createContext<AuthContextProps>({
    user: null,
    loading: true,
    login: () => { },
    logout: () => { },
    isAuthenticated: false,
    error: null, // Initialize error as null
});

interface GetMeResponse {
    data: {
        user: User
    }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); // Initialize error state

    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = await getToken();
                if (token) {
                    // Cria um token de cancelamento
                    const source = axios.CancelToken.source();

                    try {
                        const response: AxiosResponse<GetMeResponse> = await api.get('/users/me', {
                            cancelToken: source.token, // Passa o token de cancelamento
                        });
                        //setUser(response.data.data.user);
                        login(token, response.data.data.user)
                    } catch (error) {
                        if (axios.isCancel(error)) {
                            console.log('Request canceled', error.message); // Requisição cancelada
                        } else {
                            console.error("Erro ao carregar usuário:", error);
                            await removeToken();
                            setError("Erro ao carregar dados do usuário"); // Set error state
                        }
                    }
                }
            } catch (err) {
                console.error("Erro ao recuperar token:", err);
                setError("Erro ao recuperar token de autenticação"); // Set error state
            } finally {
                setLoading(false);
            }
        };

        loadUser();

    }, []);

    const login = (token: string, userData: User) => {
        storeToken(token); // Armazena o token no AsyncStorage
        setUser(userData);  // Define o usuário no estado
        setError(null) // Clear any previous error after a successful login
    };

    const logout = async () => {
        await removeToken(); // Remove o token do AsyncStorage
        setUser(null);     // Limpa o usuário do estado
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user, error }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
