// app/(public)/_layout.tsx
import { Stack } from 'expo-router';

export default function PublicLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="choice" options={{ title: 'Escolha o que deseja' }} />
      <Stack.Screen name="new" options={{ title: 'Nova república' }} />
      <Stack.Screen name="join" options={{ title: 'Entrar em uma repúblcia' }} />
    </Stack>
  );
}
