// app/(panel)/settings/_layout.tsx - Settings sub-navigation (corrigido)
import { Stack } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerStyle: {
          backgroundColor: '#222',
        },
        headerTintColor: '#7B68EE',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShadowVisible: false,
        headerBackVisible: true,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="account" options={{ 
        headerTitle: '',
        headerBackVisible: true,
      }} />
      <Stack.Screen name="about" options={{ title: 'Sobre' }} />
      <Stack.Screen name="terms-of-use" options={{ title: 'Termos de Uso' }} />
      <Stack.Screen name="privacy-policy" options={{ title: 'Política de Privacidade' }} />
      <Stack.Screen name="software-licenses" options={{ title: 'Licenças de Software' }} />
      <Stack.Screen name="republic" options={{ title: 'República' }} />
      <Stack.Screen name="members" options={{ title: 'Membros' }} />
      <Stack.Screen name="help" options={{ title: 'Ajuda' }} />
      <Stack.Screen name="change-password" options={{ title: 'Alterar Senha' }} />
    </Stack>
  );
}