// app/index.tsx
import { useEffect, useState } from 'react';
import { useRouter, Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { View, ActivityIndicator, Text } from 'react-native';

export default function Index() {
  const { user, isAuthenticated, loading, error } = useAuth();
  const [canRedirect, setCanRedirect] = useState(false);
  
  // Em vez de navegar imediatamente, vamos esperar um pouco
  useEffect(() => {
    // Apenas configure redirecionamento quando não estiver carregando
    if (!loading) {
      // Dar tempo para a UI renderizar e o componente montar completamente
      const timer = setTimeout(() => {
        setCanRedirect(true);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Se estiver carregando, mostre o indicador de carregamento
  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#222',
        padding: 20
      }}>
        <ActivityIndicator size="large" color="#7B68EE" />
        <Text style={{ 
          color: 'white', 
          marginTop: 20, 
          fontSize: 16 
        }}>
          Carregando...
        </Text>
      </View>
    );
  }
  
  // Se houver erro, mostre o erro
  if (error) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#222',
        padding: 20
      }}>
        <Text style={{ 
          color: '#FF6347', 
          marginBottom: 20, 
          fontSize: 16,
          textAlign: 'center'
        }}>
          {error}
        </Text>
        <ActivityIndicator size="small" color="#7B68EE" />
        <Text style={{ 
          color: 'white', 
          marginTop: 20, 
          fontSize: 14,
          opacity: 0.7,
          textAlign: 'center'
        }}>
          Redirecionando para login...
        </Text>
        {canRedirect && <Redirect href="/(auth)/sign-in" />}
      </View>
    );
  }
  
  // Se o usuário estiver autenticado e não estiver carregando
  if (isAuthenticated && canRedirect) {
    // Verificar se usuário tem uma república
    if (user?.current_republic_id) {
      return <Redirect href="/(panel)/home" />;
    } else {
      return <Redirect href="/(republic)/choice" />;
    }
  }
  
  // Se não estiver autenticado e não estiver carregando
  if (!isAuthenticated && canRedirect) {
    return <Redirect href="/(auth)/sign-in" />;
  }
  
  // Em caso de dúvida, mostrar um loader
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#222'
    }}>
      <ActivityIndicator size="large" color="#7B68EE" />
    </View>
  );
}