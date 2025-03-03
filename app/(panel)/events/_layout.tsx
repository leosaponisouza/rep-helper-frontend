// app/(panel)/events/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function EventsLayout() {
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
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="events-list" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="calendar" 
        options={{ 
          title: 'Calendário',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="create" 
        options={{ 
          title: 'Criar Evento',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="edit" 
        options={{ 
          title: 'Editar Evento',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: 'Detalhes do Evento',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="invite" 
        options={{ 
          title: 'Convidar Membros',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}