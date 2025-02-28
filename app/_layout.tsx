// app/_layout.tsx
import { Slot } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { StatusBar, View } from 'react-native';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// Manter splash screen visível enquanto inicializamos recursos
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Esconder a splash screen quando recursos estiverem prontos
    const hideSplash = async () => {
      await SplashScreen.hideAsync();
    };
    
    hideSplash();
  }, []);

  return (
    <AuthProvider>
      <View style={{ flex: 1, backgroundColor: '#333' }}>
        <StatusBar
          backgroundColor="#333"
          barStyle="light-content"
        />
        <Slot />
      </View>
    </AuthProvider>
  );
}