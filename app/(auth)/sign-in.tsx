import React, { useState, useEffect } from 'react';
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
    Platform
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../src/utils/firebaseClientConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import { storeToken, getToken, removeToken, storeData, getData, removeData } from '../../src/utils/storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [networkStatus, setNetworkStatus] = useState({ connected: true, checking: true });
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    const { login, logout } = useAuth();
    const router = useRouter();

    // Check for existing session on component mount
    useEffect(() => {
        checkExistingSession();
        checkNetworkConnectivity();
    }, []);

    const checkNetworkConnectivity = async () => {
        try {
            // Simple health check to your API
            await api.get('/health');
            setNetworkStatus({ connected: true, checking: false });
        } catch (error) {
            setNetworkStatus({ connected: false, checking: false });
            console.log('API connection check failed:', error);
        }
    };

    const checkExistingSession = async () => {
        try {
            const storedToken = await getToken();
            const storedUser = await getData('user');
            
            if (storedToken && storedUser) {
                const user = JSON.parse(storedUser);
                
                try {
                    await login(storedToken, user);
                    
                    if (user.current_republic_id) {
                        router.replace('/(panel)/home');
                    } else {
                        router.replace('/(panel)/(republic)/choice');
                    }
                } catch (error) {
                    console.log("Session validation failed:", error);
                    await clearSession();
                }
            }
        } catch (error) {
            console.log("Error checking existing session:", error);
            await clearSession();
        }
    };

    const clearSession = async () => {
        await removeToken();
        await removeData("user");
        logout();
    };

    const handleLogin = async () => {
        Keyboard.dismiss();

        // Form validation
        if (!email.trim()) {
            setError('Por favor, insira seu email.');
            return;
        }

        if (!password) {
            setError('Por favor, insira sua senha.');
            return;
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Por favor, insira um email válido.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Firebase Authentication
            await signInWithEmailAndPassword(auth, email, password);
            
            // Get Firebase token
            const firebaseToken = await auth.currentUser?.getIdToken();
            if (!firebaseToken) {
                throw new Error('Não foi possível obter o token de autenticação.');
            }
            
            // Backend API authentication
            const response = await api.post('/users/login', {}, {
                headers: { 
                    'Authorization': `Bearer ${firebaseToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data && response.data.token && response.data.data?.user) {
                // Store auth data
                await storeToken(response.data.token);
                await storeData('user', JSON.stringify(response.data.data.user));
                
                // Update auth context
                await login(response.data.token, response.data.data.user);
                
                // Navigate to appropriate screen
                if (response.data.data.user.current_republic_id) {
                    router.replace('/(panel)/home');
                } else {
                    router.replace('/(panel)/(republic)/choice');
                }
            } else {
                throw new Error('Resposta inválida do servidor');
            }
        } catch (error) {
            handleLoginError(error);
        } finally {
            setLoading(false);
        }
    };
    
    const handleLoginError = (error) => {
        console.log("Login error:", error);
        
        // Firebase auth errors
        if (error.code) {
            switch (error.code) {
                case 'auth/invalid-email':
                    setError('Email inválido.');
                    break;
                case 'auth/user-disabled':
                    setError('Esta conta foi desativada.');
                    break;
                case 'auth/user-not-found':
                    setError('Usuário não encontrado.');
                    break;
                case 'auth/wrong-password':
                    setError('Senha incorreta.');
                    break;
                case 'auth/too-many-requests':
                    setError('Muitas tentativas. Tente novamente mais tarde.');
                    break;
                case 'auth/network-request-failed':
                    setError('Falha na conexão. Verifique sua internet.');
                    break;
                default:
                    setError('Erro de autenticação. Tente novamente.');
            }
            return;
        }
        
        // API response errors
        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.message || 'Erro do servidor';
            
            setError(status === 401 ? 'Credenciais inválidas.' : 
                     status === 404 ? 'Usuário não encontrado.' : 
                     `Erro do servidor: ${message}`);
            return;
        }
        
        // Network errors
        if (error.request) {
            setError('Sem resposta do servidor. Verifique sua conexão.');
            return;
        }
        
        // Default error
        setError('Ocorreu um erro. Tente novamente.');
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
                            <View style={[
                                styles.inputContainer, 
                                emailFocused && styles.inputFocused
                            ]}>
                                <Ionicons name="mail-outline" size={20} color="#7B68EE" style={styles.inputIcon} />
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
                                />
                            </View>

                            <View style={[
                                styles.inputContainer, 
                                passwordFocused && styles.inputFocused
                            ]}>
                                <Ionicons name="lock-closed-outline" size={20} color="#7B68EE" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Senha"
                                    placeholderTextColor="#aaa"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    onFocus={() => setPasswordFocused(true)}
                                    onBlur={() => setPasswordFocused(false)}
                                />
                                <TouchableOpacity onPress={toggleShowPassword} style={styles.eyeIcon}>
                                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#7B68EE" />
                                </TouchableOpacity>
                            </View>

                            {error ? (
                                <View style={styles.errorContainer}>
                                    <Ionicons name="alert-circle" size={18} color="#FF6347" />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : null}

                            <TouchableOpacity 
                                style={[
                                    styles.button, 
                                    (!networkStatus.connected || loading) && styles.buttonDisabled
                                ]} 
                                onPress={handleLogin}
                                disabled={!networkStatus.connected || loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Entrar</Text>
                                )}
                            </TouchableOpacity>

                            <Link href="/(auth)/forgot-password" asChild>
                                <TouchableOpacity style={styles.forgotPassword}>
                                    <Text style={styles.link}>Esqueceu sua senha?</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.signUpText}>Não tem uma conta? </Text>
                            <Link href="/(auth)/sign-up" asChild>
                                <TouchableOpacity>
                                    <Text style={styles.signUpLink}>Criar agora</Text>
                                </TouchableOpacity>
                            </Link>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#222',
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 20,
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
        marginVertical: 20,
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
    forgotPassword: {
        alignItems: 'center',
        padding: 8,
    },
    link: {
        color: '#7B68EE',
        fontSize: 15,
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
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
        width: '100%',
    },
    signUpText: {
        color: '#ccc',
        fontSize: 15,
    },
    signUpLink: {
        fontWeight: 'bold',
        color: '#7B68EE',
        fontSize: 15,
    },
});

export default LoginScreen;