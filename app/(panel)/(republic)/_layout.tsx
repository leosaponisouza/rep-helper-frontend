// app/(panel)/(republic)/_layout.tsx
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

export default function RepublicLayout() {
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
        headerLeft: ({ canGoBack }) => 
          canGoBack ? (
            <Ionicons name="chevron-back" size={24} color="#7B68EE" style={{ marginLeft: 8 }} />
          ) : null,
      }}
    >
      <Stack.Screen 
        name="choice" 
        options={{ 
          title: 'Escolha de República',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="new" 
        options={{ 
          title: 'Nova República',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="join" 
        options={{ 
          title: 'Entrar em República',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: 'Detalhes da República',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="invite" 
        options={{ 
          title: 'Convidar Moradores',
          headerShown: true 
        }} 
      />
    </Stack>
  );
}