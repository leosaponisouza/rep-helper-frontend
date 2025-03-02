// app/(panel)/tasks/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';

export default function TasksLayout() {
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
        name="create" 
        options={{ 
          title: 'Criar Tarefa',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="edit" 
        options={{ 
          title: 'Editar Tarefa',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: 'Detalhes da Tarefa',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}