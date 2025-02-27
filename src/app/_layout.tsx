// app/_layout.tsx
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { StatusBar, View } from 'react-native';

export default function RootLayout() {
  return (
    <AuthProvider>
      <View style={{ flex: 1, backgroundColor: '#333' }}>
        <StatusBar
          backgroundColor="#333"
          barStyle="light-content"
        />
        <Stack screenOptions={{
          
        }}>
        {/* Authentication Stack Group */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />

        {/* Panel Stack Group */}
        <Stack.Screen name="(panel)" options={{ headerShown: false }} />

         {/* Index (Catch-all) Route */}
        <Stack.Screen name="index" options={{ headerShown: false, presentation: 'modal' }} />

        {/* Any other screens that are outside of (public) or (auth) or (panel) go here */}
        </Stack>
      </View>
      
    </AuthProvider>
  );
}
