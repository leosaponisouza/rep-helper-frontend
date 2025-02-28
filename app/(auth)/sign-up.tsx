// app/(auth)/sign-up.tsx
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
  TouchableWithoutFeedback,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, getFreshFirebaseToken } from '../../src/utils/firebaseClientConfig';
import api from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { Link, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ErrorHandler } from '../../src/utils/errorHandling';
import { checkApiConnection } from '../../src/services/api';

const SignUpScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [networkStatus, setNetworkStatus] = useState({ connected: true, checking: true });
  const [debugInfo, setDebugInfo] = useState('Aguardando ação...');
  
  // Estados de foco
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  // Verificar conectividade ao montar
  React.useEffect(() => {
    checkNetworkConnectivity();
  }, []);

  const checkNetworkConnectivity = async () => {
    try {
      setDebugInfo('Verificando conectividade...');
      const isConnected = await checkApiConnection();
      setNetworkStatus({ connected: isConnected, checking: false });
      setDebugInfo(`Conectividade: ${isConnected ? 'OK' : 'Falha'}`);
    } catch (error) {
      setNetworkStatus({ connected: false, checking: false });
      setDebugInfo(`Erro de conectividade: ${error.message}`);
      console.log('Falha na verificação de conexão:', error);
    }
  };

  const handleSignUp = async () => {
    try {
      setDebugInfo('Iniciando cadastro...');
      Keyboard.dismiss();

      // Validação de campos obrigatórios
      if (!name || !email || !password || !confirmPassword) {
        setError('Por favor, preencha todos os campos.');
        setDebugInfo('Erro: campos incompletos');
        return;
      }

      // // Validação de formato de email
      // const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      // if (!emailRegex.test(email)) {
      //   setError('Por favor, insira um email válido.');
      //   setDebugInfo('Erro: email inválido');
      //   return;
      // }

      // Validação de senhas
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        setDebugInfo('Erro: senhas não coincidem');
        return;
      }

      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        setDebugInfo('Erro: senha muito curta');
        return;
      }

      setLoading(true);
      setError('');
      setDebugInfo('Verificando conexão com API...');

      // Verificar conexão com a API antes de tentar cadastro
      const isConnected = await checkApiConnection();
      if (!isConnected) {
        setDebugInfo('Erro: Sem conexão com servidor');
        throw new Error('Sem conexão com o servidor. Verifique sua internet.');
      }
      
      setDebugInfo('Criando usuário no Firebase...');
      
      // 1. Criar o usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      setDebugInfo('Obtendo token Firebase...');
      const firebaseToken = await firebaseUser.getIdToken(true);

      // 2. Criar o usuário no backend com timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        setDebugInfo('Timeout na requisição ao backend');
        controller.abort();
      }, 15000);
      
      const userData = {
          name,
          email,
          firebase_uid: firebaseUser.uid,
          provider: 'email',
          role: 'user',
          status: 'active'
      };

      setDebugInfo('Enviando dados para backend...');
      
      try {
        console.log('URL da API:', api.defaults.baseURL);
        console.log('Dados enviados:', userData);
        console.log('Token Firebase:', firebaseToken.substring(0, 20) + '...');
        
        const response = await api.post('/users', userData, {
          headers: {
            Authorization: `Bearer ${firebaseToken}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        setDebugInfo('Resposta do backend recebida');
        
        // Debug da resposta
        console.log('Resposta do backend:', JSON.stringify(response.data, null, 2));
        console.log('Token tipo:', typeof response.data.token);
        console.log('Token valor:', response.data.token);
        console.log('User tipo:', typeof response.data.data.user);
        
        // Verificar se os dados necessários existem
        if (!response.data.token) {
          setDebugInfo('Token ausente na resposta');
          throw new Error('Token de autenticação não encontrado na resposta');
        }
        
        if (!response.data.data?.user) {
          setDebugInfo('Dados do usuário ausentes na resposta');
          throw new Error('Dados do usuário não encontrados na resposta');
        }
        
        // 3. Login (armazenar o token e dados do usuário)
        setDebugInfo('Realizando login...');
        
        // Converter token para string se não for
        const tokenString = typeof response.data.token === 'string' 
          ? response.data.token 
          : String(response.data.token);
        
        // Converter refreshToken para string se existir e não for string
        const refreshTokenString = response.data.refreshToken && typeof response.data.refreshToken !== 'string'
          ? String(response.data.refreshToken)
          : response.data.refreshToken;
        
        await login(
          tokenString,
          response.data.data.user,
          refreshTokenString
        );
        
        setDebugInfo('Redirecionando...');
        // 4. Navegar para a tela de escolha de república 
        router.replace('/(republic)/choice');
      } catch (apiError) {
        setDebugInfo(`Erro na API: ${apiError.message}`);
        console.error('Erro na API:', apiError);
        
        // Se o usuário foi criado no Firebase, mas falhou no backend
        // Podemos tentar excluir o usuário do Firebase
        try {
          if (firebaseUser) {
            setDebugInfo('Tentando excluir usuário Firebase após falha');
            await firebaseUser.delete();
          }
        } catch (deleteError) {
          setDebugInfo(`Erro ao excluir usuário Firebase: ${deleteError.message}`);
          console.error('Erro ao excluir usuário Firebase após falha no backend:', deleteError);
        }
        
        throw apiError;
      }
    } catch (error) {
      const parsedError = ErrorHandler.parseError(error);
      setError(parsedError.message);
      setDebugInfo(`Erro final: ${parsedError.message} (${parsedError.type})`);
      ErrorHandler.logError(parsedError);
      Alert.alert("Erro no cadastro", `${parsedError.message}\n\nTipo: ${parsedError.type}`);
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView 
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Crie sua Conta</Text>
              <Text style={styles.subtitle}>Preencha os campos abaixo para se cadastrar</Text>
            </View>

            {!networkStatus.connected && !networkStatus.checking && (
              <View style={styles.networkAlert}>
                <MaterialCommunityIcons name="wifi-off" size={18} color="white" />
                <Text style={styles.networkAlertText}>
                  Sem conexão com o servidor
                </Text>
              </View>
            )}

            <View style={styles.formContainer}>
              <View style={[
                styles.inputContainer, 
                nameFocused && styles.inputFocused
              ]}>
                <Ionicons name="person" size={20} color="#7B68EE" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nome Completo"
                  placeholderTextColor="#aaa"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  testID="name-input"
                />
              </View>

              <View style={[
                styles.inputContainer, 
                emailFocused && styles.inputFocused
              ]}>
                <Ionicons name="mail" size={20} color="#7B68EE" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#aaa"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  testID="email-input"
                />
              </View>

              <View style={[
                styles.inputContainer, 
                passwordFocused && styles.inputFocused
              ]}>
                <Ionicons name="lock-closed" size={20} color="#7B68EE" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Senha"
                  placeholderTextColor="#aaa"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  testID="password-input"
                />
                <TouchableOpacity onPress={toggleShowPassword} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#7B68EE" />
                </TouchableOpacity>
              </View>

              <View style={[
                styles.inputContainer, 
                confirmPasswordFocused && styles.inputFocused
              ]}>
                <Ionicons name="lock-closed" size={20} color="#7B68EE" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar Senha"
                  placeholderTextColor="#aaa"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => setConfirmPasswordFocused(false)}
                  testID="confirm-password-input"
                />
                <TouchableOpacity onPress={toggleShowConfirmPassword} style={styles.eyeIcon}>
                  <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#7B68EE" />
                </TouchableOpacity>
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={18} color="#FF6347" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Info de debug - remova quando não for mais necessário */}
              <View style={styles.debugContainer}>
                <Text style={styles.debugText}>Status: {debugInfo}</Text>
              </View>

              <TouchableOpacity 
                style={[
                  styles.button, 
                  (loading) && styles.buttonDisabled
                ]} 
                onPress={handleSignUp}
                disabled={loading}
                activeOpacity={0.8}
                testID="signup-button"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Criar Conta</Text>
                )}
              </TouchableOpacity>

              <View style={styles.signInContainer}>
                <Text style={styles.signInText}>Já tem uma conta? </Text>
                <Link href="/(auth)/sign-in" asChild>
                  <TouchableOpacity>
                    <Text style={styles.signInLink}>Entrar</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#222',
    },
    keyboardView: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: '#222',
        paddingHorizontal: 24,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    headerContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#aaa',
        textAlign: 'center',
    },
    formContainer: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#444',
        marginBottom: 16,
        height: 56,
        paddingHorizontal: 16,
    },
    inputFocused: {
        borderColor: '#7B68EE',
        backgroundColor: '#393939',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        height: '100%',
    },
    eyeIcon: {
        padding: 10,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: 'rgba(255, 99, 71, 0.15)',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#FF6347',
    },
    errorText: {
        color: '#FF6347',
        marginLeft: 8,
        fontSize: 14,
        flex: 1,
    },
    button: {
        backgroundColor: '#7B68EE',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 16,
        shadowColor: "#7B68EE",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    buttonDisabled: {
        backgroundColor: '#5a5a5a',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    signInContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    signInText: {
        color: '#fff',
        fontSize: 16,
    },
    signInLink: {
        fontWeight: 'bold',
        color: '#7B68EE',
        fontSize: 16,
    },
    networkAlert: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FF4757',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 20,
      width: '100%',
    },
    networkAlertText: {
      color: 'white',
      marginLeft: 8,
      fontWeight: '500',
    },
    // Estilos para debug
    debugContainer: {
      padding: 10,
      backgroundColor: '#333',
      borderRadius: 8,
      marginBottom: 16,
      borderLeftWidth: 3,
      borderLeftColor: '#7B68EE',
    },
    debugText: {
      color: '#aaa',
      fontSize: 12,
    }
});

export default SignUpScreen;