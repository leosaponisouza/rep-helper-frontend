// src/utils/storage.ts
import * as SecureStore from 'expo-secure-store';

// Constantes para as chaves de armazenamento
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

/**
 * Armazena um valor de forma segura usando Expo Secure Store.
 * @param key - A chave para armazenar o valor.
 * @param value - O valor a ser armazenado.
 * @param options - Opções adicionais para armazenamento seguro.
 * @returns Uma promise que é resolvida quando o valor foi armazenado.
 * @throws Error se houver um problema ao armazenar os dados.
 */
export const storeData = async (
  key: string,
  value: any,
  options?: SecureStore.SecureStoreOptions
): Promise<void> => {
  try {
    // Garantir que o valor seja sempre uma string
    const stringValue = typeof value === 'string' 
      ? value 
      : JSON.stringify(value);
      
    await SecureStore.setItemAsync(key, stringValue, options);
  } catch (error) {
    console.error('Erro ao armazenar dados:', error);
    throw new Error(`Falha ao armazenar dados para chave: ${key}`);
  }
};

/**
 * Recupera um valor de forma segura do Expo Secure Store.
 * @param key - A chave do valor a ser recuperado.
 * @param options - Opções adicionais para recuperação de armazenamento seguro.
 * @returns Uma promise que é resolvida com o valor armazenado, ou null se a chave não for encontrada.
 * @throws Error se houver um problema ao recuperar os dados.
 */
export const getData = async (
  key: string,
  options?: SecureStore.SecureStoreOptions
): Promise<string | null> => {
  try {
    const value = await SecureStore.getItemAsync(key, options);
    return value;
  } catch (error) {
    console.error('Erro ao obter dados:', error);
    throw new Error(`Falha ao obter dados para chave: ${key}`);
  }
};

/**
 * Remove um valor de forma segura do Expo Secure Store.
 * @param key - A chave do valor a ser removido.
 * @param options - Opções adicionais para remoção de armazenamento seguro.
 * @returns Uma promise que é resolvida quando o valor foi removido.
 * @throws Error se houver um problema ao remover os dados.
 */
export const removeData = async (
  key: string,
  options?: SecureStore.SecureStoreOptions
): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key, options);
  } catch (error) {
    console.error('Erro ao remover dados:', error);
    throw new Error(`Falha ao remover dados para chave: ${key}`);
  }
};

// Funções específicas para lidar com tokens (mais convenientes)

/**
 * Armazena um token de autenticação de forma segura.
 */
export const storeToken = async (
  token: string | any,
  options?: SecureStore.SecureStoreOptions
): Promise<void> => {
  // Garantir que o token seja uma string
  const tokenString = typeof token === 'string' ? token : String(token);
  await storeData(TOKEN_KEY, tokenString, options);
};

/**
 * Recupera o token de autenticação armazenado.
 */
export const getToken = async (
  options?: SecureStore.SecureStoreOptions
): Promise<string | null> => {
  return await getData(TOKEN_KEY, options);
};

/**
 * Remove o token de autenticação armazenado.
 */
export const removeToken = async (
  options?: SecureStore.SecureStoreOptions
): Promise<void> => {
  await removeData(TOKEN_KEY, options);
};

export const storeRefreshToken = async (
  token: string,
  options?: SecureStore.SecureStoreOptions
): Promise<void> => {
  await storeData('refreshToken', token, options);
};

export const getRefreshToken = async (
  options?: SecureStore.SecureStoreOptions
): Promise<string | null> => {
  return await getData('refreshToken', options);
};

export const removeRefreshToken = async (
  options?: SecureStore.SecureStoreOptions
): Promise<void> => {
  await removeData('refreshToken', options);
};

export const clearAuthData = async (): Promise<void> => {
  await removeToken();
  await removeRefreshToken();
  await removeData('user');
};