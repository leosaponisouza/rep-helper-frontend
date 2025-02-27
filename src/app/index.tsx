// app/index.tsx
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from './../context/AuthContext';
import { View, Text, ActivityIndicator } from 'react-native';

export default function Index() {
    const { isAuthenticated, loading, error } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (error) {
                // Handle the authentication error, e.g., show a message
                console.error("Authentication error:", error);
                // You might want to navigate to an error screen here
                return;
            }

            if (isAuthenticated) {
                router.replace('/(panel)/home');
            } else {
                router.replace('/sign-in');
            }
        }
    }, [isAuthenticated, loading, error, router]);

    if(loading){
        return (
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#333'}}>
                <ActivityIndicator size='large' color='#7B68EE'/>
            </View>
        )
    }

    if (error) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' }}>
                <Text style={{ color: 'white' }}>Erro de autenticação: {error}</Text>
            </View>
        )
    }

    return null;
}
