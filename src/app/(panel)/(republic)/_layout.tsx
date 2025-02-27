// src/app/(panel)/(republic)/_layout.tsx - Republic management layout
import { Stack } from 'expo-router';

export default function RepublicLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="choice" options={{ title: 'Escolha de República' }} />
      <Stack.Screen name="new" options={{ title: 'Nova República' }} />
      <Stack.Screen name="join" options={{ title: 'Entrar em República' }} />
      <Stack.Screen name="[id]" options={{ title: 'Detalhes da República' }} />
      <Stack.Screen name="invite" options={{ title: 'Convidar Moradores' }} />
    </Stack>
  );
}