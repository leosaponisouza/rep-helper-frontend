import React, { useState, useEffect, useRef } from 'react';
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
    Platform,
    Alert
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../src/utils/firebaseClientConfig';
import { useAuth } from '../../src/context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ErrorHandler } from '../../src/utils/errorHandling';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '../../src/validation/authSchemas';
import { clearAuthData } from '../../src/utils/storage';
import api from '../../src/services/api';

const LoginScreen = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [networkStatus, setNetworkStatus] = useState({ connected: true, checking: true });
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Autenticando...');
    const [localLoading, setLocalLoading] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    
    // Referência para controlar o cancelamento do login
    const cancelLoginRef = useRef(false);

    const { loginWithCredentials, loading, error, clearError } = useAuth();
    const router = useRouter();
    
    // Configuração do React Hook Form com Zod
    const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: ''
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
            cancelLoginRef.current = false;
        }
        
        return () => {
            cancelLoginRef.current = false;
        };
    }, [loading]);

    const handleLogin = async (data: LoginFormData) => {
        Keyboard.dismiss();
        
        // Se já estiver carregando, cancelar o login atual
        if (localLoading) {
            cancelLoginRef.current = true;
            clearError();
            setLocalError(null);
            setLoadingMessage('Cancelando...');
            
            setTimeout(() => {
                setLocalLoading(false);
                setLoadingMessage('Autenticando...');
            }, 500);
            return;
        }
        
        // Limpar erros locais
        setLocalError(null);
        
        // Indicar que estamos carregando localmente
        setLocalLoading(true);
        
        // Resetar o estado de cancelamento
        cancelLoginRef.current = false;
        
        try {
            // Limpar armazenamento antes de fazer login
            await clearAuthData();
            
            // Atualizar mensagem de loading com progresso
            setLoadingMessage('Autenticando...');
            
            // Verificar se o login foi cancelado a cada etapa
            await new Promise(resolve => setTimeout(resolve, 300)); // Pequeno delay para UI
            if (cancelLoginRef.current) {
                setLocalLoading(false);
                return;
            }
            
            setLoadingMessage('Conectando ao servidor...');
            await new Promise(resolve => setTimeout(resolve, 300)); // Pequeno delay para UI
            if (cancelLoginRef.current) {
                setLocalLoading(false);
                return;
            }
            
            // Usar o método loginWithCredentials do contexto de autenticação com referência para cancelamento
            await loginWithCredentials(data.email, data.password, cancelLoginRef);
            
            // O redirecionamento é tratado pelo AuthContext
        } catch (error: any) {
            // Capturar e exibir o erro localmente
            setLocalError(error.message || 'Erro ao fazer login');
            setLocalLoading(false);
        }
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    // Limpa o erro quando o usuário interage com os campos
    const handleFieldFocus = () => {
        clearError();
        setLocalError(null);
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

                            {localError && (
                                <View style={styles.errorContainer}>
                                    <Ionicons name="alert-circle" size={18} color="#FF6347" />
                                    <Text style={styles.errorText}>{localError}</Text>
                                </View>
                            )}

                            <TouchableOpacity 
                                style={[styles.button, localLoading && styles.buttonDisabled]} 
                                onPress={handleSubmit(handleLogin)}
                                activeOpacity={0.8}
                            >
                                {localLoading ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="small" color="#fff" />
                                        <Text style={styles.loadingText}>{loadingMessage}</Text>
                                    </View>
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

export default LoginScreen;