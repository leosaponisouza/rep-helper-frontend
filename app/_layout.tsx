// app/_layout.tsx
import 'react-native-url-polyfill/auto';
import { Slot } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { NotificationProvider } from '../src/context/NotificationContext';
import { StatusBar, View } from 'react-native';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { configureNotifications, registerForPushNotificationsAsync } from '../src/services/notifications';

// Manter splash screen visível enquanto inicializamos recursos
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Configurar notificações
    configureNotifications();
    
    // Registrar para notificações push
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log('Token de notificação:', token);
        // Aqui você pode enviar o token para seu backend
      }
    });

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