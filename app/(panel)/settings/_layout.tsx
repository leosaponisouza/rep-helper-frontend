// src/app/(panel)/settings/_layout.tsx - Settings sub-navigation
import { Stack } from 'expo-router';
import React from 'react';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Configurações' }} />
      <Stack.Screen name="account" options={{ title: 'Conta' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notificações' }} />
      <Stack.Screen name="theme" options={{ title: 'Tema' }} />
      <Stack.Screen name="about" options={{ title: 'Sobre' }} />
    </Stack>
  );
}