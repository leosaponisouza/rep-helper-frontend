// app/_layout.tsx
import 'react-native-url-polyfill/auto';
import { Slot } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { NotificationProvider } from '../src/context/NotificationContext';
import { StatusBar, View } from 'react-native';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <View style={{ flex: 1, backgroundColor: '#333' }}>
            <StatusBar
              backgroundColor="#333"
              barStyle="light-content"
            />
            <Slot />
          </View>
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}