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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, SignUpFormData } from '../../src/validation/authSchemas';

const SignUpScreen = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [networkStatus, setNetworkStatus] = useState({ connected: true, checking: true });
  
  // Estados de foco
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  
  // Configuração do React Hook Form com Zod
  const { control, handleSubmit, formState: { errors } } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  // Verificar conectividade ao montar
  React.useEffect(() => {
    // Em produção, não precisamos verificar a conectividade automaticamente
    // checkNetworkConnectivity();
  }, []);

  const checkNetworkConnectivity = async () => {
    try {
      const isConnected = await checkApiConnection();
      setNetworkStatus({ connected: isConnected, checking: false });
    } catch (error: unknown) {
      setNetworkStatus({ connected: false, checking: false });
      // Removendo logs para produção
    }
  };

  const handleSignUp = async (data: SignUpFormData) => {
    try {
      Keyboard.dismiss();
      setLoading(true);
      setError('');

      // Verificar conexão com a API antes de tentar cadastro
      const isConnected = await checkApiConnection();
      if (!isConnected) {
        throw new Error('Sem conexão com o servidor. Verifique sua internet.');
      }
      
      // 1. Criar o usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;
      
      const firebaseToken = await firebaseUser.getIdToken(true);

      // 2. Criar o usuário no backend com timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 15000);
      
      const userData = {
          name: data.name,
          email: data.email,
          firebaseUid: firebaseUser.uid,
          provider: 'EMAIL',
          isAdmin: true,
          status: 'active'
      };
      
      try {
        // Removendo logs de dados sensíveis para produção
        
        const response = await api.post('api/v1/auth/signup', userData, {
          headers: {
            Authorization: `Bearer ${firebaseToken}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Removendo logs de depuração para produção
        
        // Verificar se os dados necessários existem
        if (!response.data.token) {
          throw new Error('Token de autenticação não encontrado na resposta');
        }
        
        if (!response.data.user) {
          throw new Error('Dados do usuário não encontrados na resposta');
        }
        
        // 3. Login (armazenar o token e dados do usuário)
        
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
          response.data.user,
          refreshTokenString
        );
        
        // 4. Navegar para a tela de escolha de república 
        router.replace('/(republic)/choice');
      } catch (apiError: unknown) {
        const errorMessage = apiError instanceof Error ? apiError.message : 'Erro desconhecido';
        // Removendo logs de depuração para produção
        
        // Se o usuário foi criado no Firebase, mas falhou no backend
        // Podemos tentar excluir o usuário do Firebase
        try {
          if (firebaseUser) {
            await firebaseUser.delete();
          }
        } catch (deleteError) {
          // Removendo logs de erro para produção
        }
        
        throw apiError;
      }
    } catch (error: unknown) {
      const parsedError = await ErrorHandler.parseError(error);
      setError(parsedError.message);
      // Removendo logs de erro para produção
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
              <Text style={styles.title}>Criar Conta</Text>
              <Text style={styles.subtitle}>
                Preencha os campos abaixo para criar sua conta
              </Text>
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
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[
                    styles.inputContainer, 
                    nameFocused && styles.inputFocused,
                    errors.name && styles.inputError
                  ]}>
                    <Ionicons name="person-outline" size={20} color="#7B68EE" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Nome completo"
                      placeholderTextColor="#aaa"
                      value={value}
                      onChangeText={onChange}
                      autoCapitalize="words"
                      onFocus={() => setNameFocused(true)}
                      onBlur={() => {
                        setNameFocused(false);
                        onBlur();
                      }}
                    />
                  </View>
                )}
              />
              {errors.name && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={18} color="#FF6347" />
                  <Text style={styles.errorText}>{errors.name.message}</Text>
                </View>
              )}

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[
                    styles.inputContainer, 
                    emailFocused && styles.inputFocused,
                    errors.email && styles.inputError
                  ]}>
                    <Ionicons name="mail-outline" size={20} color="#7B68EE" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="#aaa"
                      value={value}
                      onChangeText={onChange}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => {
                        setEmailFocused(false);
                        onBlur();
                      }}
                    />
                  </View>
                )}
              />
              {errors.email && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={18} color="#FF6347" />
                  <Text style={styles.errorText}>{errors.email.message}</Text>
                </View>
              )}

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[
                    styles.inputContainer, 
                    passwordFocused && styles.inputFocused,
                    errors.password && styles.inputError
                  ]}>
                    <Ionicons name="lock-closed-outline" size={20} color="#7B68EE" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Senha"
                      placeholderTextColor="#aaa"
                      value={value}
                      onChangeText={onChange}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => {
                        setPasswordFocused(false);
                        onBlur();
                      }}
                    />
                    <TouchableOpacity 
                      style={styles.passwordToggle} 
                      onPress={toggleShowPassword}
                    >
                      <Ionicons 
                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                        size={20} 
                        color="#aaa" 
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={18} color="#FF6347" />
                  <Text style={styles.errorText}>{errors.password.message}</Text>
                </View>
              )}

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[
                    styles.inputContainer, 
                    confirmPasswordFocused && styles.inputFocused,
                    errors.confirmPassword && styles.inputError
                  ]}>
                    <Ionicons name="lock-closed-outline" size={20} color="#7B68EE" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirmar senha"
                      placeholderTextColor="#aaa"
                      value={value}
                      onChangeText={onChange}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setConfirmPasswordFocused(true)}
                      onBlur={() => {
                        setConfirmPasswordFocused(false);
                        onBlur();
                      }}
                    />
                    <TouchableOpacity 
                      style={styles.passwordToggle} 
                      onPress={toggleShowConfirmPassword}
                    >
                      <Ionicons 
                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                        size={20} 
                        color="#aaa" 
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.confirmPassword && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={18} color="#FF6347" />
                  <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
                </View>
              )}

              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={18} color="#FF6347" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]} 
                onPress={handleSubmit(handleSignUp)}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="person-add" size={20} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Criar Conta</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Já tem uma conta?</Text>
                <Link href="/(auth)/sign-in" asChild>
                  <TouchableOpacity>
                    <Text style={styles.loginLink}>Entrar</Text>
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
  inputError: {
    borderColor: '#FF6347',
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
  passwordToggle: {
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
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
  },
  loginLink: {
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
});

export default SignUpScreen;