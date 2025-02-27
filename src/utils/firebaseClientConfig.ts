// src/utils/firebaseClientConfig.ts
import { initializeApp } from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
// Importe getReactNativePersistence do local correto: // <--- CORREÇÃO
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';

// ... resto do código ...
const firebaseConfig = {
    apiKey: "AIzaSyBC6tdEgcM5t3U_ct0aAYSr3kJ4DGZkNX0",
    authDomain: "rephelper.firebaseapp.com",
    projectId: "rephelper",
    storageBucket: "rephelper.firebasestorage.app",
    messagingSenderId: "717278801852",
    appId: "1:717278801852:web:c24a9cd864ea92329745b9"
  }; //Sua configuração

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage) // Agora funciona
});


export { auth };