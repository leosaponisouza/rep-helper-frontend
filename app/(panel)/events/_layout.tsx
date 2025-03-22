// app/(panel)/events/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { EventsProvider } from '../../../src/context/EventsContext';

// Adicionando o EventsProvider em volta de todo o layout de eventos
export default function EventsLayout() {
  return (
    <EventsProvider>
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
          headerShown: false // Oculta todos os headers por padrão
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="events-list" />
        <Stack.Screen name="calendar" />
        <Stack.Screen name="create" />
        <Stack.Screen name="edit/[id]" />
        <Stack.Screen name="[id]" />
        <Stack.Screen name="invitations/[id]" />
      </Stack>
    </EventsProvider>
  );
}