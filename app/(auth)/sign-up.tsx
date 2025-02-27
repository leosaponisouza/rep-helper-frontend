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
  TouchableWithoutFeedback
} from 'react-native';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'; // Firebase Auth
import { auth } from '../../src/utils/firebaseClientConfig'; // Importe a instância 'auth'
import api from '../../src/services/api'; // Sua instância do axios
import { useAuth } from '../../src/context/AuthContext';
import { Link, useRouter } from 'expo-router'; // useRouter para navegação
import { Ionicons } from '@expo/vector-icons';
import BackButton from '@/components/BackButton';

const SignUpScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  const { login } = useAuth();
  const router = useRouter();

  const handleSignUp = async () => {
    Keyboard.dismiss();

    if (!name || !email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Criar o usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const firebaseToken = await firebaseUser.getIdToken();

      // 2. Criar o usuário no SEU backend (enviar os dados, incluindo o firebase_uid)
      const userData = {
          name,
          email,
          firebase_uid: firebaseUser.uid, // Importante!
          provider: 'email', //  Já que estamos usando email/senha
          role: 'user', // Defina um role padrão, por exemplo.
          status: 'active'
      };

      const response = await api.post('/users', userData, {
        headers: {
          Authorization: `Bearer ${firebaseToken}` // Envia o token do firebase *mesmo na criação*.
        }
      });


      // 3. Fazer Login (armazenar o token)
      login(response.data.token, response.data.data.user);

      // 4. Navegar para a tela de escolha de república 
      router.replace('/(panel)/(republic)/choice');

    } catch (error: any) {
        //Tratamento de erros do firebase
      if (error.code === 'auth/email-already-in-use') {
        setError('Este email já está em uso.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Email inválido.');
      } else if (error.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError('Erro ao criar conta. Tente novamente.');
        console.error(error);
      }
        Alert.alert("Erro", error.message);
    } finally {
      setLoading(false);
    }
  };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
      <BackButton />
        <Text style={styles.title}>Crie sua Conta</Text>

        <TextInput
          style={styles.input}
          placeholder="Nome Completo"
          placeholderTextColor="#aaa"
          value={name}
          onChangeText={setName}
          autoCapitalize="words" // Capitaliza a primeira letra de cada palavra
        />

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
        <View style={styles.passwordContainer}>
            <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor="#aaa"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
            />
             <TouchableOpacity onPress={toggleShowPassword} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color="#7B68EE" />
            </TouchableOpacity>
        </View>
        <View style={styles.passwordContainer}>
            <TextInput
            style={styles.input}
            placeholder="Confirmar Senha"
            placeholderTextColor="#aaa"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity onPress={toggleShowConfirmPassword} style={styles.eyeIcon}>
                <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={24} color="#7B68EE" />
            </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator size="large" color="#7B68EE" />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleSignUp}>
            <Text style={styles.buttonText}>Criar Conta</Text>
          </TouchableOpacity>
        )}
        <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Já tem uma conta? </Text>
            <Link href="/(auth)/sign-in" asChild>
                <TouchableOpacity>
                    <Text style={[styles.link, styles.signInLink]}>Entrar</Text>
                </TouchableOpacity>
            </Link>
        </View>

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
        marginBottom: 30,
        color: '#fff',
        fontFamily: 'Roboto', // Opcional
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
    passwordContainer: { //Para o botão de olho
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 15,
    },
      eyeIcon: {
        position: 'absolute',
        right: 15,
        height: '100%',
        justifyContent: 'center',
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
     link: {
        color: '#7B68EE', // Roxo claro para links
        marginTop: 15,
        textDecorationLine: 'underline', // Sublinhado (opcional)
    },
    signInContainer:{
        flexDirection: 'row',
        marginTop: 20,
    },
    signInText:{
        color: '#fff',
    },
    signInLink:{
        fontWeight: 'bold',
        color: '#7B68EE', // Cor do link "Criar" igual à dos links
    }
});

export default SignUpScreen;