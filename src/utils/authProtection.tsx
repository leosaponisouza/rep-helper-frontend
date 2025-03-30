// src/utils/authProtection.tsx
import React, { useEffect, useState } from 'react';
import { useSegments, Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';

/**
 * Hook que verifica se o usuário está autenticado e determina a rota de redirecionamento
 */
export function useProtectedRoute() {
  const { isAuthenticated, loading, user } = useAuth();
  const segments = useSegments();
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    // Ignorar este efeito enquanto o estado de autenticação ainda está carregando
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inRepublicGroup = segments[0] === '(republic)';
    const inPanelGroup = segments[0] === '(panel)';
    
    // Se não estiver autenticado mas está tentando acessar páginas protegidas
    if (!isAuthenticated) {
      if (inPanelGroup || inRepublicGroup) {
        setRedirectTo('/(auth)/sign-in');
      } else {
        setRedirectTo(null);
      }
    } else {
      // Usuário está autenticado
      
      // Se estiver nas telas de autenticação, redirecionar
      if (inAuthGroup) {
        // Decidir para onde redirecionar com base no estado do usuário
        if (user?.currentRepublicId) {
          setRedirectTo('/(panel)/home');
        } else {
          setRedirectTo('/(republic)/choice');
        }
      }
      // Se o usuário estiver no grupo panel, mas não tiver república associada
      else if (inPanelGroup && !user?.currentRepublicId) {
        setRedirectTo('/(republic)/choice');
      }
      // Se o usuário estiver no grupo republic, mas já tiver república associada
      else if (inRepublicGroup && user?.currentRepublicId && segments[1] !== 'new') {
        setRedirectTo('/(panel)/home');
      }
      else {
        setRedirectTo(null);
      }
    }
  }, [isAuthenticated, loading, segments, user]);

  return { redirectTo, loading };
}

/**
 * Componente de proteção de autenticação para ser usado em layouts
 */
export function AuthProtection({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  const { redirectTo } = useProtectedRoute();
  
  // Verificamos apenas se é necessário inicializar a autenticação
  // em vez de mostrar tela de loading/erro
  const inAuthGroup = useSegments()[0] === '(auth)';

  // Em telas de autenticação, não mostramos o loading global
  // o loading e erros serão tratados por cada tela específica
  if (loading && !inAuthGroup) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#222' }}>
        <ActivityIndicator size="large" color="#7B68EE" />
      </View>
    );
  }
  
  // Se tiver um redirecionamento, faça-o
  if (redirectTo) {
    return <Redirect href={redirectTo as any} />;
  }
  
  // Caso contrário, renderize os filhos
  return <>{children}</>;
}