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
        headerLeft: ({ canGoBack }) => 
          canGoBack ? (
            <Ionicons name="chevron-back" size={24} color="#7B68EE" style={{ marginLeft: 8 }} />
          ) : null,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="account" options={{ title: 'Conta' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notificações' }} />
      <Stack.Screen name="theme" options={{ title: 'Tema' }} />
      <Stack.Screen name="about" options={{ title: 'Sobre' }} />
      <Stack.Screen name="republic" options={{ title: 'República' }} />
      <Stack.Screen name="members" options={{ title: 'Membros' }} />
      <Stack.Screen name="help" options={{ title: 'Ajuda' }} />
      <Stack.Screen name="change-password" options={{ title: 'Alterar Senha' }} />
    </Stack>
  );
}