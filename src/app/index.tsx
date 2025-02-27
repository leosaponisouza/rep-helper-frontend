import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator, Text } from 'react-native';

export default function Index() {
  const { user, isAuthenticated, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (error) {
        console.error("Authentication error:", error);
        return;
      }

      if (isAuthenticated) {
        // Check if user has a republic
        if (user?.current_republic_id) {
          // User has a republic, go to home
          router.replace('/(panel)/home');
        } else {
          // User doesn't have a republic, go to choice screen
          router.replace('/(panel)/(republic)/choice');
        }
      } else {
        // Not authenticated, go to sign in
        router.replace('/(auth)/sign-in');
      }
    }
  }, [isAuthenticated, loading, user, error, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' }}>
        <ActivityIndicator size="large" color="#7B68EE" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' }}>
        <Text style={{ color: 'white' }}>Erro de autenticação: {error}</Text>
      </View>
    );
  }

  return null;
}