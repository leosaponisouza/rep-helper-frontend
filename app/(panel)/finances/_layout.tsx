// app/(panel)/finances/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function FinancesLayout() {
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
        name="expenses/index" 
        options={{ 
          title: 'Despesas',
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="expenses/create" 
        options={{ 
          title: 'Nova Despesa',
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="expenses/edit" 
        options={{ 
          title: 'Editar Despesa',
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="expenses/[id]" 
        options={{ 
          title: 'Detalhes da Despesa',
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="incomes/index" 
        options={{ 
          title: 'Receitas',
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="incomes/create" 
        options={{ 
          title: 'Nova Receita',
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="incomes/edit" 
        options={{ 
          title: 'Editar Receita',
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="incomes/[id]" 
        options={{ 
          title: 'Detalhes da Receita',
          headerShown: false
        }} 
      />
    </Stack>
  );
}