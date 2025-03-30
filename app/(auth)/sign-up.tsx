// app/(auth)/sign-up.tsx
import React, { useState, useEffect, useRef } from 'react';
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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, SignUpFormData } from '../../src/validation/authSchemas';
import { clearAuthData } from '../../src/utils/storage';

const SignUpScreen = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [networkStatus, setNetworkStatus] = useState({ connected: true, checking: true });
  const [loadingMessage, setLoadingMessage] = useState('Criando conta...');
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Estados de foco
  const [nameFocused, setNameFocused] = useState(false);
  const [nicknameFocused, setNicknameFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  
  // Referência para controlar o cancelamento do cadastro
  const cancelSignupRef = useRef(false);

  const { signUp, loading, error, clearError } = useAuth();
  const router = useRouter();
  
  // Configuração do React Hook Form com Zod
  const { control, handleSubmit, formState: { errors } } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      nickname: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  // Sincronizar os estados de loading e erro do AuthContext com os locais
  useEffect(() => {
    setLocalLoading(loading);
    if (error) {
      setLocalError(error);
    }
  }, [loading, error]);

  // Resetar o status de cancelamento quando o componente for desmontado ou quando 'loading' mudar para false
  useEffect(() => {
    if (!loading) {
      cancelSignupRef.current = false;
    }
    
    return () => {
      cancelSignupRef.current = false;
    };
  }, [loading]);

  // Limpa o erro quando o usuário interage com os campos
  const handleFieldFocus = () => {
    clearError();
    setLocalError(null);
  };

  const handleSignUp = async (data: SignUpFormData) => {
    try {
      Keyboard.dismiss();
      
      // Se já estiver carregando, cancelar o cadastro atual
      if (localLoading) {
        cancelSignupRef.current = true;
        clearError();
        setLocalError(null);
        setLoadingMessage('Cancelando...');
        
        setTimeout(() => {
          setLocalLoading(false);
          setLoadingMessage('Criando conta...');
        }, 500);
        return;
      }
      
      // Limpar erros locais
      setLocalError(null);
      
      // Indicar que estamos carregando localmente
      setLocalLoading(true);
      
      // Resetar o estado de cancelamento
      cancelSignupRef.current = false;
      
      // Limpar armazenamento antes de fazer cadastro
      await clearAuthData();
      
      // Atualizar mensagem de loading com progresso
      setLoadingMessage('Criando conta...');
      await new Promise(resolve => setTimeout(resolve, 300)); // Pequeno delay para UI
      if (cancelSignupRef.current) {
        setLocalLoading(false);
        return;
      }
      
      setLoadingMessage('Registrando no Firebase...');
      await new Promise(resolve => setTimeout(resolve, 300)); // Pequeno delay para UI
      if (cancelSignupRef.current) {
        setLocalLoading(false);
        return;
      }
      
      setLoadingMessage('Enviando dados para o servidor...');
      await new Promise(resolve => setTimeout(resolve, 300)); // Pequeno delay para UI
      if (cancelSignupRef.current) {
        setLocalLoading(false);
        return;
      }
      
      // Usar o método signUp do contexto de autenticação com referência para cancelamento
      await signUp(
        data.email, 
        data.password, 
        {
          name: data.name,
          nickname: data.nickname || null,
          phoneNumber: data.phone || ''
        },
        cancelSignupRef
      );
      // O redirecionamento é tratado pelo AuthContext
    } catch (error: any) {
      // Capturar e exibir o erro localmente
      setLocalError(error.message || 'Erro ao criar conta');
      setLocalLoading(false);
    }
  };

  // Função de toggle para mostrar/esconder senha
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
                      onFocus={() => {
                        setNameFocused(true);
                        handleFieldFocus();
                      }}
                      onBlur={() => {
                        setNameFocused(false);
                        onBlur();
                      }}
                      editable={!localLoading}
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
                name="nickname"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[
                    styles.inputContainer, 
                    nicknameFocused && styles.inputFocused,
                    errors.nickname && styles.inputError
                  ]}>
                    <Ionicons name="person-circle-outline" size={20} color="#7B68EE" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Apelido (opcional)"
                      placeholderTextColor="#aaa"
                      value={value}
                      onChangeText={onChange}
                      autoCapitalize="words"
                      onFocus={() => {
                        setNicknameFocused(true);
                        handleFieldFocus();
                      }}
                      onBlur={() => {
                        setNicknameFocused(false);
                        onBlur();
                      }}
                      editable={!localLoading}
                    />
                  </View>
                )}
              />
              {errors.nickname && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={18} color="#FF6347" />
                  <Text style={styles.errorText}>{errors.nickname.message}</Text>
                </View>
              )}

              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[
                    styles.inputContainer, 
                    phoneFocused && styles.inputFocused,
                    errors.phone && styles.inputError
                  ]}>
                    <Ionicons name="call-outline" size={20} color="#7B68EE" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Telefone (opcional)"
                      placeholderTextColor="#aaa"
                      value={value}
                      onChangeText={onChange}
                      keyboardType="phone-pad"
                      onFocus={() => {
                        setPhoneFocused(true);
                        handleFieldFocus();
                      }}
                      onBlur={() => {
                        setPhoneFocused(false);
                        onBlur();
                      }}
                      editable={!localLoading}
                    />
                  </View>
                )}
              />
              {errors.phone && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={18} color="#FF6347" />
                  <Text style={styles.errorText}>{errors.phone.message}</Text>
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
                      onFocus={() => {
                        setEmailFocused(true);
                        handleFieldFocus();
                      }}
                      onBlur={() => {
                        setEmailFocused(false);
                        onBlur();
                      }}
                      editable={!localLoading}
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
                      onFocus={() => {
                        setPasswordFocused(true);
                        handleFieldFocus();
                      }}
                      onBlur={() => {
                        setPasswordFocused(false);
                        onBlur();
                      }}
                      editable={!localLoading}
                    />
                    <TouchableOpacity 
                      style={styles.passwordToggle} 
                      onPress={toggleShowPassword}
                      disabled={localLoading}
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
                      onFocus={() => {
                        setConfirmPasswordFocused(true);
                        handleFieldFocus();
                      }}
                      onBlur={() => {
                        setConfirmPasswordFocused(false);
                        onBlur();
                      }}
                      editable={!localLoading}
                    />
                    <TouchableOpacity 
                      style={styles.passwordToggle} 
                      onPress={toggleShowConfirmPassword}
                      disabled={localLoading}
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

              {localError && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={18} color="#FF6347" />
                  <Text style={styles.errorText}>{localError}</Text>
                </View>
              )}

              <TouchableOpacity 
                style={[styles.button, localLoading && styles.buttonDisabled]} 
                onPress={handleSubmit(handleSignUp)}
                activeOpacity={0.8}
              >
                {localLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.loadingText}>{loadingMessage}</Text>
                  </View>
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
                  <TouchableOpacity style={styles.loginLinkContainer}>
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
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
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
    maxWidth: 340,
    alignSelf: 'center',
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
    flexDirection: 'row',
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
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
    marginRight: 8,
  },
  loginLinkContainer: {
    marginLeft: 4,
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default SignUpScreen;