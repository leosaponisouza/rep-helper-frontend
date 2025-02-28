// src/utils/firebaseClientConfig.ts
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth, getIdToken, User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Acessar variáveis de ambiente através do Expo Constants
const extra = Constants.expoConfig?.extra || {};

const firebaseConfig = {
  apiKey: extra.firebaseApiKey,
  authDomain: extra.firebaseAuthDomain,
  projectId: extra.firebaseProjectId,
  storageBucket: extra.firebaseStorageBucket,
  messagingSenderId: extra.firebaseMessagingSenderId,
  appId: extra.firebaseAppId
};

// Log para debug - remova em produção
console.log('Firebase Config:', JSON.stringify(firebaseConfig));

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Auth com persistência no AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

/**
 * Obtém um token de ID Firebase fresco e válido.
 * @param forceRefresh Se verdadeiro, força uma renovação do token, ignorando cache.
 * @returns Promise que resolve para o token como string.
 * @throws Error se usuário não estiver autenticado.
 */
export const getFreshFirebaseToken = async (forceRefresh: boolean = false): Promise<string> => {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }
  
  try {
    return await getIdToken(auth.currentUser, forceRefresh);
  } catch (error) {
    console.error('Erro ao obter token Firebase:', error);
    throw error;
  }
};

/**
 * Verifica se o usuário atual do Firebase está autenticado.
 * @returns O usuário Firebase atual ou null se não autenticado.
 */
export const getCurrentFirebaseUser = (): User | null => {
  return auth.currentUser;
};

export { auth };