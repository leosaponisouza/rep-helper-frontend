import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { clearAuthData } from '../src/utils/storage';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../src/utils/firebaseClientConfig';

const LogoutClearStorage = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Limpar dados automaticamente ao abrir esta tela
    handleClearStorage();
  }, []);

  const handleClearStorage = async () => {
    try {
      setLoading(true);
      setMessage('Limpando armazenamento...');

      // Fazer logout do Firebase, se estiver logado
      try {
        if (auth.currentUser) {
          await signOut(auth);
        }
      } catch (firebaseError) {
        console.error('Erro ao deslogar do Firebase:', firebaseError);
      }

      // Limpar todos os dados de autenticação
      await clearAuthData();

      setMessage('Armazenamento limpo com sucesso!');
      
      // Esperar 2 segundos e depois redirecionar para login
      setTimeout(() => {
        router.replace('/(auth)/sign-in');
      }, 2000);
    } catch (error) {
      setMessage('Erro ao limpar armazenamento: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToLogin = () => {
    router.replace('/(auth)/sign-in');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Limpeza de Armazenamento</Text>
      
      <View style={styles.messageContainer}>
        <Text style={styles.message}>{message}</Text>
        {loading && <ActivityIndicator size="large" color="#7B68EE" style={styles.loader} />}
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleReturnToLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Voltar ao Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#333',
    borderRadius: 12,
    width: '100%',
    minHeight: 100,
    justifyContent: 'center',
  },
  message: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  loader: {
    marginTop: 10,
  },
  button: {
    backgroundColor: '#7B68EE',
    padding: 15,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: "#7B68EE",
    shadowOffset: {
        width: 0,
        height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default LogoutClearStorage; 