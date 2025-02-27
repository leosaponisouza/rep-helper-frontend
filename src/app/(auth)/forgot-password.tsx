import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback, // Para dispensar o teclado
} from 'react-native';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth'; // Importe sendPasswordResetEmail
import { auth } from '../../utils/firebaseClientConfig'; // Importe a instância 'auth'
import { useRouter } from 'expo-router';
import BackButton from '@/components/BackButton';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false); // Estado para mensagem de sucesso

  const router = useRouter();

  const handleResetPassword = async () => {
    Keyboard.dismiss();

    if (!email) {
      setError('Por favor, insira seu email.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await sendPasswordResetEmail(auth, email); // Chama a função do Firebase
      setSuccess(true); // Define o estado de sucesso
      Alert.alert(
          "Sucesso",
          "Um email de redefinição de senha foi enviado para o seu endereço de email."
      );
      router.replace("/(auth)/sign-in")

    } catch (error: any) {
      if (error.code === 'auth/invalid-email') {
        setError('Email inválido.');
      } else if (error.code === 'auth/user-not-found') {
        setError('Usuário não encontrado.');
      } else {
        setError('Erro ao enviar email de redefinição. Tente novamente.');
        console.error(error);
      }
      Alert.alert("Erro", error.message)
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
      <BackButton />
        <Text style={styles.title}>Esqueceu sua senha?</Text>

        <Text style={styles.subtitle}>
          Digite seu email abaixo para receber um link de redefinição de senha.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator size="large" color="#7B68EE" />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
            <Text style={styles.buttonText}>Enviar email</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#333',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#fff',
        fontFamily: 'Roboto', // Exemplo, ajuste se necessário
        textAlign: 'left', // Alinha o título à esquerda
        width: '100%', // Ocupa toda a largura
    },
    subtitle: {
        fontSize: 16,
        color: '#aaa', // Cinza mais claro
        marginBottom: 32,
        textAlign: 'left', // Alinha o subtítulo à esquerda
        width: '100%',
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: '#7B68EE',
        borderWidth: 1,
        marginBottom: 15,
        paddingHorizontal: 15,
        borderRadius: 8,
        color: '#fff',
        backgroundColor: '#444',
        fontSize: 16,
    },
    error: {
        color: '#FF6347',
        marginBottom: 15,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#7B68EE',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default ForgotPasswordScreen;