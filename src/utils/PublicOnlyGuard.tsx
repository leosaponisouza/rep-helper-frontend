import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';

interface PublicOnlyGuardProps {
  children: React.ReactNode;
  fallbackRoute?: string;
}

export const PublicOnlyGuard: React.FC<PublicOnlyGuardProps> = ({ 
  children, 
}) => {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/(panel)/home");
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
};