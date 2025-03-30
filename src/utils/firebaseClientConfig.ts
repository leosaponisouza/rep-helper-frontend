// src/utils/firebaseClientConfig.ts
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth, getIdToken, User, Auth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Acessar variáveis de ambiente através do Expo Constants
const extra = Constants.expoConfig?.extra || {};

// Verificar se as configurações essenciais estão presentes
const missingConfigs = ['firebaseApiKey', 'firebaseAuthDomain', 'firebaseProjectId', 'firebaseAppId']
  .filter(key => !extra[key])
  .map(key => key.replace('firebase', ''));

if (missingConfigs.length > 0) {
  console.warn(`⚠️ Firebase: Configurações ausentes: ${missingConfigs.join(', ')}`);
}

// Configuração do Firebase sem valores hardcoded
const firebaseConfig = {
  apiKey: extra.firebaseApiKey,
  authDomain: extra.firebaseAuthDomain,
  projectId: extra.firebaseProjectId,
  storageBucket: extra.firebaseStorageBucket,
  messagingSenderId: extra.firebaseMessagingSenderId,
  appId: extra.firebaseAppId
};

// Inicializar Firebase apenas se tivermos as configurações mínimas
let app: FirebaseApp | undefined;
let auth: Auth | { currentUser: null } = { currentUser: null };

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    // Inicializar Firebase
    app = initializeApp(firebaseConfig);
    
    // Inicializar Auth com persistência no AsyncStorage
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
    
    console.log("Firebase inicializado com sucesso");
  } else {
    throw new Error("Configurações do Firebase incompletas");
  }
} catch (error) {
  console.error("Erro ao inicializar Firebase:", error);
  // Fornecer implementações vazias para evitar falhas nos componentes que dependem desse módulo
  auth = {
    currentUser: null,
    // Outras propriedades vazias conforme necessário
  };
}

/**
 * Obtém um token de ID Firebase fresco e válido.
 * @param forceRefresh Se verdadeiro, força uma renovação do token, ignorando cache.
 * @returns Promise que resolve para o token como string.
 * @throws Error se usuário não estiver autenticado.
 */
export const getFreshFirebaseToken = async (forceRefresh: boolean = false): Promise<string> => {
  if (!auth || !('currentUser' in auth) || !auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }
  
  try {
    return await getIdToken(auth.currentUser, forceRefresh);
  } catch (error) {
    // Removendo log de erro para produção
    throw error;
  }
};

/**
 * Verifica se o usuário atual do Firebase está autenticado.
 * @returns O usuário Firebase atual ou null se não autenticado.
 */
export const getCurrentFirebaseUser = (): User | null => {
  return auth && 'currentUser' in auth ? auth.currentUser : null;
};

export { auth };