// src/utils/storage.ts
import * as SecureStore from 'expo-secure-store';

/**
 * Stores a value securely using Expo Secure Store.
 * @param key - The key to store the value under.
 * @param value - The value to store.
 * @param options - Additional options for secure storage.
 * @returns A promise that resolves when the value has been stored.
 * @throws Error if there's an issue storing the data.
 */
export const storeData = async (
  key: string,
  value: string,
  options?: SecureStore.SecureStoreOptions
): Promise<void> => {
  try {
    await SecureStore.setItemAsync(key, value, options);
  } catch (error) {
    console.error('Error storing data:', error);
    throw new Error(`Failed to store data for key: ${key}`);
  }
};

/**
 * Retrieves a value securely from Expo Secure Store.
 * @param key - The key of the value to retrieve.
 * @param options - Additional options for secure storage retrieval.
 * @returns A promise that resolves with the stored value, or null if the key is not found.
 * @throws Error if there's an issue retrieving the data.
 */
export const getData = async (
  key: string,
  options?: SecureStore.SecureStoreOptions
): Promise<string | null> => {
  try {
    const value = await SecureStore.getItemAsync(key, options);
    return value;
  } catch (error) {
    console.error('Error getting data:', error);
    throw new Error(`Failed to get data for key: ${key}`);
  }
};

/**
 * Removes a value securely from Expo Secure Store.
 * @param key - The key of the value to remove.
 * @param options - Additional options for secure storage removal.
 * @returns A promise that resolves when the value has been removed.
 * @throws Error if there's an issue removing the data.
 */
export const removeData = async (
  key: string,
  options?: SecureStore.SecureStoreOptions
): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key, options);
  } catch (error) {
    console.error('Error removing data:', error);
    throw new Error(`Failed to remove data for key: ${key}`);
  }
};

// Specific functions for handling tokens (more convenient)

/**
 * Stores a token securely using Expo Secure Store.
 * @param token - The token to store.
 * @param options - Additional options for secure storage.
 * @returns A promise that resolves when the token has been stored.
 * @throws Error if there's an issue storing the token.
 */
export const storeToken = async (
  token: string,
  options?: SecureStore.SecureStoreOptions
): Promise<void> => {
  await storeData('token', token, options);
};

/**
 * Retrieves a token securely from Expo Secure Store.
 * @param options - Additional options for secure storage retrieval.
 * @returns A promise that resolves with the stored token, or null if the token is not found.
 * @throws Error if there's an issue retrieving the token.
 */
export const getToken = async (
  options?: SecureStore.SecureStoreOptions
): Promise<string | null> => {
  return await getData('token', options);
};

/**
 * Removes a token securely from Expo Secure Store.
 * @param options - Additional options for secure storage removal.
 * @returns A promise that resolves when the token has been removed.
 * @throws Error if there's an issue removing the token.
 */
export const removeToken = async (
  options?: SecureStore.SecureStoreOptions
): Promise<void> => {
  await removeData('token', options);
};
