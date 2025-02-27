// src/utils/authProtection.tsx
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../context/AuthContext';

/**
 * This hook checks if the user is authenticated.
 * If they're not authenticated but trying to access a protected route,
 * they will be redirected to the authentication screen.
 */
export function useProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Skip this effect while auth state is still loading
    if (loading) return;

    // Check if the user is on a protected route (panel routes)
    const isInProtectedRoute = segments[0] === '(panel)';
    
    // If the user is not authenticated but is trying to access a protected route
    if (!isAuthenticated && isInProtectedRoute) {
      // Redirect them to the sign-in page
      router.replace('/(auth)/sign-in');
    }
    
    // If the user is authenticated but is in the auth flow
    if (isAuthenticated && segments[0] === '(auth)') {
      // Redirect them to the home page
      router.replace('/(panel)/home');
    }
  }, [isAuthenticated, loading, segments]);
}

/**
 * Auth protection component to be used in the root layout
 */
export function AuthProtection({ children }: { children: React.ReactNode }) {
  useProtectedRoute();
  return <>{children}</>;
}
