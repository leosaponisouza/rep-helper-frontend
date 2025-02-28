// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthProtection } from '../../src/utils/authProtection';

export default function AuthLayout() {
  const router = useRouter();
  
  return (
    <AuthProtection>
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
              <TouchableOpacity 
                onPress={() => router.back()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-back" size={24} color="#7B68EE" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
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
        {/* Removida a definição explícita da rota index */}
      </Stack>
    </AuthProtection>
  );
}