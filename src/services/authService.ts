import api from './api';
import { auth, getFreshFirebaseToken } from '../utils/firebaseClientConfig';
import { User } from '../models/user.model';
import { 
  storeToken, 
  storeData, 
  clearAuthData,
  storeRefreshToken 
} from '../utils/storage';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  PhoneAuthProvider,
  signInWithPhoneNumber
} from 'firebase/auth';
import { Platform } from 'react-native';

/**
 * @fileoverview Serviço de autenticação para integração com API RepHelper
 * 
 * Este serviço implementa a autenticação em duas etapas conforme descrito na documentação:
 * 1. Autenticação inicial via Firebase
 * 2. Uso de tokens JWT para acesso contínuo à API
 * 
 * O fluxo de autenticação recomendado:
 * 1. Login inicial:
 *    - Autenticar usuário com Firebase (Email/Senha, Google, Facebook, etc.)
 *    - Obter token ID do Firebase
 *    - Enviar token para `/auth/login` e armazenar o token JWT retornado
 * 
 * 2. Requisições autenticadas:
 *    - Incluir token JWT no header de todas as requisições
 *    - Monitorar status 401 (Unauthorized) que indica expiração do token
 * 
 * 3. Renovação do token:
 *    - Implementar renovação automática quando o token estiver próximo da expiração
 *    - Usar o endpoint `/auth/refresh` para obter um novo token
 *    - Atualizar o token armazenado
 */

// Tipos para respostas da API
interface AuthResponse {
  token: string;
  user: User;
}

// Tipo para requisição de cadastro
interface SignupRequest {
  name: string;
  nickname?: string | null;
  email?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  firebaseUid: string;
  provider: 'EMAIL' | 'GOOGLE' | 'FACEBOOK' | 'PHONE' | 'GITHUB' | 'CUSTOM';
}

/**
 * Efetua login utilizando token ID do Firebase
 * @param firebaseToken Token ID gerado pelo Firebase Authentication
 * @returns Promise com dados do usuário e token JWT
 * 
 * @example
 * ```typescript
 * // Obter token ID do Firebase após login bem-sucedido
 * const firebaseToken = await userCredential.user.getIdToken();
 * 
 * // Enviar para API e obter token JWT
 * const { token, user } = await loginWithFirebaseToken(firebaseToken);
 * 
 * // Agora você pode usar o token para requisições autenticadas
 * ```
 */
export const loginWithFirebaseToken = async (firebaseToken: string): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>(
      '/api/v1/auth/login',
      { firebaseToken },
      {
        headers: {
          Authorization: `Bearer ${firebaseToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 segundos de timeout
      }
    );
    
    // Armazenar token JWT e dados do usuário
    await storeToken(response.data.token);
    await storeData('user', JSON.stringify(response.data.user));
    
    return response.data;
  } catch (error: any) {
    // Log detalhado em desenvolvimento
    if (__DEV__) {
      console.log('URL completa:', api.defaults.baseURL + '/api/v1/auth/login');
      console.log('Status do erro:', error.response?.status);
      console.log('Dados do erro:', error.response?.data);
    }
    
    // Tratar erros específicos da API
    if (error.code === 'ECONNABORTED') {
      throw new Error('O servidor demorou a responder. Tente novamente mais tarde.');
    }
    
    if (error.response?.status === 404) {
      throw new Error('Usuário não encontrado no sistema. Entre em contato com o suporte.');
    } else if (error.response?.status === 401) {
      throw new Error('Token inválido ou expirado. Faça login novamente.');
    } else if (error.response?.status >= 500) {
      throw new Error('Erro no servidor. Tente novamente mais tarde.');
    }
    
    console.error('Erro ao fazer login com token Firebase:', error);
    throw error;
  }
};

/**
 * Efetua login com email e senha
 * @param email Email do usuário
 * @param password Senha do usuário
 * @returns Promise com dados do usuário e token JWT
 * 
 * @example
 * ```typescript
 * try {
 *   const { token, user } = await loginWithEmailPassword("usuario@exemplo.com", "senha123");
 *   console.log("Login bem-sucedido:", user.name);
 * } catch (error) {
 *   console.error("Erro ao fazer login:", error);
 * }
 * ```
 */
export const loginWithEmailPassword = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    // Primeiro autenticar com Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
      .catch((firebaseError) => {
        // Tratar erros específicos do Firebase
        if (firebaseError.code === 'auth/wrong-password' || 
            firebaseError.code === 'auth/user-not-found' || 
            firebaseError.code === 'auth/invalid-email' ||
            firebaseError.code === 'auth/invalid-credential') {
          throw new Error('Email ou senha incorretos.');
        } else if (firebaseError.code === 'auth/too-many-requests') {
          throw new Error('Muitas tentativas. Tente novamente mais tarde ou recupere sua senha.');
        } else if (firebaseError.code === 'auth/network-request-failed') {
          throw new Error('Falha na conexão. Verifique sua internet e tente novamente.');
        } else if (firebaseError.code === 'auth/user-disabled') {
          throw new Error('Esta conta foi desativada. Entre em contato com o suporte.');
        }
        
        // Repassar outros erros
        throw firebaseError;
      });
    
    const firebaseToken = await getFreshFirebaseToken(true);
    
    // Usar o token para autenticar na API
    try {
      const response = await api.post<AuthResponse>(
        '/api/v1/auth/login',
        { firebaseToken },
        {
          // Configurar timeout
          timeout: 15000
        }
      );
      
      // Armazenar token JWT e dados do usuário
      await storeToken(response.data.token);
      await storeData('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (apiError: any) {
      // Tratar erros específicos da API
      if (apiError.code === 'ECONNABORTED') {
        throw new Error('O servidor demorou a responder. Tente novamente mais tarde.');
      }
      
      // Se ocorrer erro na API após autenticação Firebase bem-sucedida
      if (apiError.response?.status === 404) {
        throw new Error('Usuário não encontrado no sistema. Entre em contato com o suporte.');
      } else if (apiError.response?.status === 401) {
        throw new Error('Não foi possível autenticar. Verifique suas credenciais.');
      } else if (apiError.response?.status >= 500) {
        throw new Error('Erro no servidor. Tente novamente mais tarde.');
      }
      
      throw apiError;
    }
  } catch (error) {
    console.error('Erro ao fazer login com email e senha:', error);
    throw error;
  }
};

/**
 * Efetua login com Google
 * @param idToken Token de ID do Google (obtido via Expo AuthSession ou similar)
 * @returns Promise com dados do usuário e token JWT
 */
export const loginWithGoogle = async (idToken: string): Promise<AuthResponse> => {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    const firebaseToken = await getFreshFirebaseToken();
    
    return await loginWithFirebaseToken(firebaseToken);
  } catch (error) {
    console.error('Erro ao fazer login com Google:', error);
    throw error;
  }
};

/**
 * Efetua login com Facebook
 * @param accessToken Token de acesso do Facebook (obtido via Facebook SDK)
 * @returns Promise com dados do usuário e token JWT
 */
export const loginWithFacebook = async (accessToken: string): Promise<AuthResponse> => {
  try {
    const credential = FacebookAuthProvider.credential(accessToken);
    const userCredential = await signInWithCredential(auth, credential);
    const firebaseToken = await getFreshFirebaseToken();
    
    return await loginWithFirebaseToken(firebaseToken);
  } catch (error) {
    console.error('Erro ao fazer login com Facebook:', error);
    throw error;
  }
};

/**
 * Efetua login com GitHub
 * @param accessToken Token de acesso do GitHub (obtido via Expo AuthSession ou similar)
 * @returns Promise com dados do usuário e token JWT
 */
export const loginWithGithub = async (accessToken: string): Promise<AuthResponse> => {
  try {
    const credential = GithubAuthProvider.credential(accessToken);
    const userCredential = await signInWithCredential(auth, credential);
    const firebaseToken = await getFreshFirebaseToken();
    
    return await loginWithFirebaseToken(firebaseToken);
  } catch (error) {
    console.error('Erro ao fazer login com GitHub:', error);
    throw error;
  }
};

/**
 * Renova um token JWT existente
 * @param currentToken Token JWT atual
 * @returns Promise com novo token JWT e dados do usuário
 * 
 * @example
 * ```typescript
 * // Implementação de renovação automática antes de uma requisição importante
 * async function fazerRequisicaoImportante() {
 *   // Verificar se o token está próximo da expiração
 *   const tokenExpirado = verificarExpiracaoToken();
 *   
 *   if (tokenExpirado) {
 *     try {
 *       const currentToken = await getToken();
 *       if (currentToken) {
 *         const { token, user } = await refreshAuthToken(currentToken);
 *         console.log("Token renovado com sucesso");
 *       }
 *     } catch (error) {
 *       console.error("Erro ao renovar token:", error);
 *       // Redirecionar para login
 *     }
 *   }
 *   
 *   // Continuar com a requisição
 * }
 * ```
 */
export const refreshAuthToken = async (currentToken: string): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>(
      '/api/v1/auth/refresh',
      { token: currentToken }
    );
    
    // Armazenar novo token JWT
    await storeToken(response.data.token);
    await storeData('user', JSON.stringify(response.data.user));
    
    return response.data;
  } catch (error) {
    console.error('Erro ao renovar token JWT:', error);
    throw error;
  }
};

/**
 * Cadastra um novo usuário
 * @param email Email do usuário
 * @param password Senha do usuário
 * @param userData Dados do usuário para cadastro
 * @param cancelRef Referência para controlar o cancelamento da operação
 * @returns Promise com dados do usuário e token JWT
 * 
 * @example
 * ```typescript
 * try {
 *   const { token, user } = await signUp(
 *     "novo.usuario@exemplo.com", 
 *     "senha123", 
 *     {
 *       name: "Novo Usuário",
 *       nickname: "novo",
 *       phoneNumber: "+5511999998888"
 *     }
 *   );
 *   console.log("Cadastro bem-sucedido:", user);
 * } catch (error) {
 *   console.error("Erro no cadastro:", error);
 * }
 * ```
 */
export const signUp = async (
  email: string, 
  password: string, 
  userData: {
    name: string;
    nickname?: string | null;
    phoneNumber?: string;
    profilePictureUrl?: string;
  },
  cancelRef?: React.MutableRefObject<boolean>
): Promise<AuthResponse> => {
  let firebaseUser = null;
  
  try {
    // Verificar se a operação foi cancelada
    if (cancelRef?.current) {
      throw new Error('Operação cancelada pelo usuário');
    }
    
    // Criar usuário no Firebase
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      .catch((firebaseError) => {
        // Tratar erros específicos do Firebase
        if (firebaseError.code === 'auth/email-already-in-use') {
          throw new Error('Este email já está sendo usado por outra conta.');
        } else if (firebaseError.code === 'auth/invalid-email') {
          throw new Error('Email inválido. Verifique o formato do email.');
        } else if (firebaseError.code === 'auth/weak-password') {
          throw new Error('Senha muito fraca. Use uma senha mais forte.');
        } else if (firebaseError.code === 'auth/network-request-failed') {
          throw new Error('Falha na conexão. Verifique sua internet e tente novamente.');
        }
        
        // Repassar outros erros
        throw firebaseError;
      });
    
    // Verificar novamente se a operação foi cancelada
    if (cancelRef?.current) {
      // Se cancelado após criar usuário no Firebase, tenta excluir para evitar inconsistências
      if (userCredential?.user) {
        try {
          await userCredential.user.delete();
        } catch (deleteError) {
          console.error('Erro ao excluir usuário Firebase após cancelamento:', deleteError);
        }
      }
      throw new Error('Operação cancelada pelo usuário');
    }
    
    firebaseUser = userCredential.user;
    const firebaseToken = await getFreshFirebaseToken(true);
    const firebaseUid = firebaseUser.uid;
    
    // Verificar novamente se a operação foi cancelada
    if (cancelRef?.current) {
      // Se cancelado após obter token, tenta excluir usuário para evitar inconsistências
      if (firebaseUser) {
        try {
          await firebaseUser.delete();
        } catch (deleteError) {
          console.error('Erro ao excluir usuário Firebase após cancelamento:', deleteError);
        }
      }
      throw new Error('Operação cancelada pelo usuário');
    }
    
    // Cadastrar usuário na API
    const signupData: SignupRequest = {
      ...userData,
      email,
      firebaseUid,
      provider: 'EMAIL'
    };
    
    try {
      // Log detalhado em desenvolvimento
      if (__DEV__) {
        console.log('Enviando para URL:', api.defaults.baseURL + '/api/v1/auth/signup');
        console.log('Dados de cadastro:', JSON.stringify(signupData, null, 2));
      }
      
      // Verificar novamente se a operação foi cancelada
      if (cancelRef?.current) {
        // Se cancelado antes de enviar para API, tenta excluir usuário para evitar inconsistências
        if (firebaseUser) {
          try {
            await firebaseUser.delete();
          } catch (deleteError) {
            console.error('Erro ao excluir usuário Firebase após cancelamento:', deleteError);
          }
        }
        throw new Error('Operação cancelada pelo usuário');
      }
      console.log(signupData);
      const response = await api.post<AuthResponse>(
        '/api/v1/auth/signup',
        signupData,
        {
          headers: {
            Authorization: `Bearer ${firebaseToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000 // 15 segundos de timeout
        }
      );
      
      // Verificar se a operação foi cancelada
      if (cancelRef?.current) {
        throw new Error('Operação cancelada pelo usuário');
      }
      
      // Armazenar token JWT e dados do usuário
      await storeToken(response.data.token);
      await storeData('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (apiError: any) {
      // Verificar se foi um erro de cancelamento
      if (apiError.message === 'Operação cancelada pelo usuário') {
        throw apiError;
      }
      
      // Log detalhado em desenvolvimento
      if (__DEV__) {
        console.log('Status do erro:', apiError.response?.status);
        console.log('Dados do erro:', apiError.response?.data);
      }
      
      // Se o usuário foi criado no Firebase, mas falhou no backend
      // Tentar excluir o usuário do Firebase para evitar inconsistências
      if (firebaseUser) {
        try {
          await firebaseUser.delete();
        } catch (deleteError) {
          console.error('Erro ao excluir usuário Firebase após falha no backend:', deleteError);
        }
      }
      
      // Tratar erros específicos da API
      if (apiError.code === 'ECONNABORTED') {
        throw new Error('O servidor demorou a responder. Tente novamente mais tarde.');
      }
      
      if (apiError.response?.status === 409) {
        throw new Error('Usuário já cadastrado com este email.');
      } else if (apiError.response?.status === 400) {
        throw new Error('Dados inválidos. Verifique as informações e tente novamente.');
      } else if (apiError.response?.status >= 500) {
        throw new Error('Erro no servidor. Tente novamente mais tarde.');
      }
      
      throw apiError;
    }
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    throw error;
  }
};

/**
 * Efetua logout, limpando dados de autenticação
 * 
 * @example
 * ```typescript
 * try {
 *   await logout();
 *   console.log("Logout realizado com sucesso");
 *   // Redirecionar para tela de login
 * } catch (error) {
 *   console.error("Erro ao fazer logout:", error);
 * }
 * ```
 */
export const logout = async (): Promise<void> => {
  try {
    // Notificar backend (opcional)
    try {
      await api.post('/api/v1/auth/logout');
    } catch (apiError) {
      console.error('Erro ao notificar backend sobre logout:', apiError);
    }
    
    // Logout do Firebase
    await auth.signOut();
    
    // Limpar dados locais
    await clearAuthData();
  } catch (error) {
    console.error('Erro ao efetuar logout:', error);
    throw error;
  }
}; 