import Constants from 'expo-constants';

// Determine the current environment
const ENV = Constants.manifest?.extra?.environment?.[
  process.env.APP_ENV || 'development'
] || {};

export const CONFIG = {
  API_BASE_URL: ENV.API_BASE_URL ,
  FIREBASE_API_KEY: ENV.FIREBASE_API_KEY || '',
  IS_DEV: process.env.APP_ENV !== 'production',
  APP_ENV: process.env.APP_ENV || 'development',
};