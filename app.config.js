// app.config.js
const env = require('./env');

// Determina se estamos em modo de desenvolvimento
const IS_DEV = process.env.EXPO_PUBLIC_ENV === 'development';

module.exports = {
  name: IS_DEV ? "RepHelper (Dev)" : "RepHelper",
  slug: "rep-helper-frontend",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "myapp",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  updates: {
    url: "https://u.expo.dev/883082f7-0fde-4821-b970-bb262f455554"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: IS_DEV ? "com.anonymous.rephelperfrontend.dev" : "com.anonymous.rephelperfrontend",
    runtimeVersion: "1.0.0"
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: IS_DEV ? "com.anonymous.rephelperfrontend.dev" : "com.anonymous.rephelperfrontend",
    runtimeVersion: {
      policy: "appVersion"
    }
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png"
  },
  plugins: [
    "expo-router",
    "expo-secure-store"
  ],
  experiments: {
    typedRoutes: true
  },
  // Aqui definimos as variáveis de ambiente usando os valores do env.js
  extra: {
    // Firebase config
    firebaseApiKey: env.FIREBASE_API_KEY,
    firebaseAuthDomain: env.FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: env.FIREBASE_PROJECT_ID,
    firebaseStorageBucket: env.FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: env.FIREBASE_APP_ID,
    
    // API config
    apiBaseUrl: env.API_BASE_URL,
    
    // Supabase config
    supabaseUrl: env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    
    // EAS config
    eas: {
      projectId: "883082f7-0fde-4821-b970-bb262f455554"
    }
  }
};