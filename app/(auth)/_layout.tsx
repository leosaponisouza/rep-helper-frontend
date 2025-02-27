// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

export default function AuthLayout() {
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
      <Stack.Screen 
        name="sign-in" 
        options={{ 
          title: 'Login',
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="sign-up" 
        options={{ 
          title: 'Cadastro',
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="forgot-password" 
        options={{ 
          title: 'Recuperar Senha',
          headerShown: false
        }} 
      />
    </Stack>
  );
}
