import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Keyboard,
    TouchableWithoutFeedback,
    SafeAreaView,
    StatusBar,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, getFreshFirebaseToken } from '../../src/utils/firebaseClientConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ErrorHandler } from '../../src/utils/errorHandling';
import { checkApiConnection } from '../../src/services/api';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '../../src/validation/authSchemas';

const LoginScreen = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [networkStatus, setNetworkStatus] = useState({ connected: true, checking: true });
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    const { login } = useAuth();
    const router = useRouter();
    
    // Configuração do React Hook Form com Zod
    const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: ''
        }
    });

    // Verificar conectividade na montagem do componente
    useEffect(() => {
        // Em produção, não precisamos verificar a conectividade automaticamente
        // checkNetworkConnectivity();
    }, []);

    const checkNetworkConnectivity = async () => {
        try {
            const isConnected = await checkApiConnection();
            setNetworkStatus({ connected: isConnected, checking: false });
        } catch (error) {
            setNetworkStatus({ connected: false, checking: false });
            // Removendo log para produção
        }
    };

    const handleLogin = async (data: LoginFormData) => {
        Keyboard.dismiss();
        setLoading(true);
        setError('');

        try {
            // Verificar conexão com a API antes de tentar login
            const isConnected = await checkApiConnection();
            if (!isConnected) {
                throw new Error('Sem conexão com o servidor. Verifique sua internet.');
            }

            try {
                // Autenticação Firebase
                await signInWithEmailAndPassword(auth, data.email, data.password);
            } catch (firebaseError: any) {
                // Tratar erros do Firebase Authentication
                // Para erros de senha/email incorretos, usar mensagem genérica de segurança
                if (firebaseError.code === 'auth/wrong-password' || 
                    firebaseError.code === 'auth/user-not-found' || 
                    firebaseError.code === 'auth/invalid-email' ||
                    firebaseError.code === 'auth/invalid-credential') {
                    throw new Error('Email ou senha incorretos.');
                } else if (firebaseError.code === 'auth/too-many-requests') {
                    throw new Error('Muitas tentativas. Tente novamente mais tarde ou recupere sua senha.');
                } else if (firebaseError.code === 'auth/network-request-failed') {
                    throw new Error('Falha na conexão. Verifique sua internet e tente novamente.');
                } else if (firebaseError.code === 'auth/user-disabled') {
                    throw new Error('Esta conta foi desativada. Entre em contato com o suporte.');
                }
                // Para outros erros, repassar para tratamento geral
                throw firebaseError;
            }
            
            // Obter token Firebase
            const firebaseToken = await getFreshFirebaseToken(true);
            
            // Configurar controlador para timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            
            try {
                // Autenticação na API backend
                const response = await api.post('/api/v1/auth/login',
                    {
                        // Enviar o firebaseToken também no corpo da requisição
                        firebaseToken: firebaseToken
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${firebaseToken}`,
                            'Content-Type': 'application/json'
                        },
                        signal: controller.signal
                    }
                );
                
                clearTimeout(timeoutId);
        
                // Verificar a resposta da API
                if (response.data.token && response.data.user) {
                    // Armazenar dados de autenticação e atualizar contexto
                    await login(
                        response.data.token,
                        response.data.user,
                    );
        
                    // Navegar para tela apropriada
                    if (response.data.user.currentRepublicId) {
                        router.replace('/(panel)/home');
                    } else {
                        router.replace('/(republic)/choice');
                    }
                } else {
                    throw new Error('Resposta inválida do servidor. Tente novamente mais tarde.');
                }
            } catch (apiError: any) {
                clearTimeout(timeoutId);
                
                // Se for erro de timeout
                if (apiError.name === 'AbortError') {
                    throw new Error('O servidor demorou para responder. Tente novamente mais tarde.');
                }
                
                // Repassar erro para tratamento geral
                throw apiError;
            }
        } catch (error) {
            // Usar o utilitário de tratamento de erros
            const parsedError = await ErrorHandler.parseError(error);
            setError(parsedError.message);
            // Removendo log de erro para produção
        } finally {
            setLoading(false);
        }
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#222" />
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.container}>
                        <View style={styles.logoContainer}>
                            <Text style={styles.logo}>RepHelper</Text>
                            <Text style={styles.tagline}>Gerenciamento de repúblicas</Text>
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

                            {error ? (
                                <View style={styles.errorContainer}>
                                    <Ionicons name="alert-circle" size={18} color="#FF6347" />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : null}

                            <TouchableOpacity 
                                style={[styles.button, loading && styles.buttonDisabled]} 
                                onPress={handleSubmit(handleLogin)}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Entrar</Text>
                                )}
                            </TouchableOpacity>

                            <View style={styles.forgotPasswordContainer}>
                                <Link href="/(auth)/forgot-password" asChild>
                                    <TouchableOpacity>
                                        <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
                                    </TouchableOpacity>
                                </Link>
                            </View>

                            <View style={styles.signupContainer}>
                                <Text style={styles.signupText}>Não tem uma conta?</Text>
                                <Link href="/(auth)/sign-up" asChild>
                                    <TouchableOpacity style={styles.signupLinkContainer}>
                                        <Text style={styles.signupLink}>Cadastre-se</Text>
                                    </TouchableOpacity>
                                </Link>
                            </View>
                        </View>
                    </View>
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
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#222',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        fontSize: 38,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: 'Roboto',
        letterSpacing: 1,
    },
    tagline: {
        color: '#aaa',
        marginTop: 5,
        fontSize: 16,
    },
    formContainer: {
        width: '100%',
        maxWidth: 340,
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
        paddingHorizontal: 12,
    },
    inputFocused: {
        borderColor: '#7B68EE',
        backgroundColor: '#393939',
    },
    inputIcon: {
        marginRight: 10,
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
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    forgotPasswordContainer: {
        alignItems: 'center',
        padding: 8,
    },
    forgotPasswordText: {
        color: '#7B68EE',
        fontSize: 15,
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
        width: '100%',
    },
    signupText: {
        color: '#ccc',
        fontSize: 15,
        marginRight: 8,
    },
    signupLinkContainer: {
        marginLeft: 4,
    },
    signupLink: {
        fontWeight: 'bold',
        color: '#7B68EE',
        fontSize: 15,
    },
    inputError: {
        borderColor: '#FF6347',
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

export default LoginScreen;