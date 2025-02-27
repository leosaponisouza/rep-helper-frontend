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
        <Stack screenOptions={{ headerShown: false }}>
          {/* Authentication Routes */}
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          
          {/* Main Application Routes (protected) */}
          <Stack.Screen name="(panel)" options={{ headerShown: false }} />
          
          {/* Index Route - Entry point handler */}
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
      </View>
    </AuthProvider>
  );
}