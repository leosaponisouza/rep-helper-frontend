// src/app/(panel)/(republic)/choice.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    TextInput,
    Keyboard,
    TouchableWithoutFeedback,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar
} from 'react-native';
import api from '../../../src/services/api';
import { useAuth } from '../../../src/context/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../../../src/utils/firebaseClientConfig';

interface Republic {
    id: number;
    name: string;
    code: string;
    // Add other properties as needed
}

const RepublicChoiceScreen = () => {
    const { user, login } = useAuth();
    const router = useRouter();
    const [republics, setRepublics] = useState<Republic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [joinCode, setJoinCode] = useState(''); 
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [joinCodeFocused, setJoinCodeFocused] = useState(false);
    const [networkStatus, setNetworkStatus] = useState({ connected: true, checking: true });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setFirebaseUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
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

    useEffect(() => {
        const fetchRepublics = async () => {
            if (!firebaseUser) return;
            setLoading(true);
            setError('');
            try {
                const firebaseToken = await firebaseUser.getIdToken();
                const response = await api.get('/republics', {
                    headers: { Authorization: `Bearer ${firebaseToken}` },
                });
                if (response.data && response.data.data && response.data.data.republics) {
                    setRepublics(response.data.data.republics);
                } else {
                    setError('Invalid data format received from the server.');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to fetch republics.');
                console.error('Error fetching republics:', err);
                Alert.alert('Error', err.message || 'Failed to fetch republics.');
            } finally {
                setLoading(false);
            }
        };

        if (firebaseUser && user) {
            fetchRepublics();
        }
    }, [firebaseUser, user]);

    const handleJoinRepublic = async () => {
        Keyboard.dismiss();
        if (!joinCode) {
            Alert.alert("Erro", 'Por favor, digite o código da república.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            if (!firebaseUser) {
                throw new Error('Usuário não autenticado.');
            }
            const firebaseToken = await firebaseUser.getIdToken();
            const response = await api.post(
                `/republics/join/${joinCode}`,
                {},
                { headers: { Authorization: `Bearer ${firebaseToken}` } }
            );

            login(response.data.token, response.data.data.user);
            Alert.alert("Sucesso", "Você entrou na república com sucesso!")
            router.replace('/(panel)/home'); 
        } catch (err: any) {
            if (err.response && err.response.status === 404) {
                setError('República não encontrada.');
                Alert.alert('Erro', 'República não encontrada.');
            } else if (err.response && err.response.status === 400) {
                setError('Você já faz parte desta república.');
                Alert.alert('Erro', 'Você já faz parte desta república.');
            } else {
                setError('Falha ao entrar na república.');
                Alert.alert('Erro', 'Falha ao entrar na república.');
            }

            console.error('Error joining republic:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectRepublic = async (republicId: number) => {
        setLoading(true);
        setError('');
        try {
            if (!firebaseUser) {
                throw new Error('Usuário não autenticado.');
            }

            const firebaseToken = await firebaseUser.getIdToken();
            const response = await api.put(
                `/users/${user?.uid}`,
                { current_republic_id: republicId },
                { headers: { Authorization: `Bearer ${firebaseToken}` } }
            );

            login(response.data.token, response.data.data.user);
            router.replace('/(panel)/home'); 
        } catch (err: any) {
            setError('Falha ao selecionar república.');
            console.error('Error selecting republic:', err);
            Alert.alert('Erro', 'Falha ao selecionar república.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#222" />
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <View style={styles.container}>
                        {!networkStatus.connected && !networkStatus.checking && (
                            <View style={styles.networkAlert}>
                                <MaterialCommunityIcons name="wifi-off" size={18} color="white" />
                                <Text style={styles.networkAlertText}>
                                    Sem conexão com o servidor
                                </Text>
                            </View>
                        )}

                        <View style={styles.headerContainer}>
                            <Text style={styles.title}>Escolha sua República</Text>
                            <Text style={styles.subtitle}>
                                Selecione uma república existente ou crie uma nova
                            </Text>
                        </View>

                        <ScrollView 
                            style={styles.scrollContainer} 
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#7B68EE" />
                                </View>
                            ) : error ? (
                                <View style={styles.errorContainer}>
                                    <Ionicons name="alert-circle" size={24} color="#FF6347" />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : republics.length === 0 ? (
                                <View style={styles.noRepublicsContainer}>
                                    <Ionicons name="home-outline" size={64} color="#7B68EE" style={styles.noRepublicsIcon} />
                                    <Text style={styles.noRepublicsText}>
                                        Você ainda não está em nenhuma república.
                                    </Text>
                                    <Text style={styles.noRepublicsSubtext}>
                                        Crie uma nova ou entre usando um código de convite.
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    <Text style={styles.sectionTitle}>Suas Repúblicas</Text>
                                    {republics.map((republic) => (
                                        <TouchableOpacity
                                            key={republic.id}
                                            style={styles.republicItem}
                                            onPress={() => handleSelectRepublic(republic.id)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.republicIconContainer}>
                                                <Ionicons name="home" size={24} color="#7B68EE" />
                                            </View>
                                            <View style={styles.republicInfo}>
                                                <Text style={styles.republicName}>{republic.name}</Text>
                                                <View style={styles.republicCodeContainer}>
                                                    <Text style={styles.republicCodeLabel}>Código:</Text>
                                                    <Text style={styles.republicCode}>{republic.code}</Text>
                                                </View>
                                            </View>
                                            <Ionicons name="chevron-forward" size={24} color="#7B68EE" />
                                        </TouchableOpacity>
                                    ))}
                                </>
                            )}

                            <View style={styles.joinSectionContainer}>
                                <View style={styles.joinSectionHeader}>
                                    <Ionicons name="key" size={24} color="#7B68EE" />
                                    <Text style={styles.sectionTitle}>Entrar em uma República</Text>
                                </View>
                                <Text style={styles.joinSectionSubtitle}>
                                    Insira o código de convite fornecido pelo administrador da república
                                </Text>
                                <View style={[
                                    styles.joinInputContainer, 
                                    joinCodeFocused && styles.inputFocused
                                ]}>
                                    <Ionicons name="key" size={20} color="#7B68EE" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.joinInput}
                                        placeholder="Código da República"
                                        placeholderTextColor="#aaa"
                                        value={joinCode}
                                        onChangeText={setJoinCode}
                                        autoCapitalize="characters"
                                        onFocus={() => setJoinCodeFocused(true)}
                                        onBlur={() => setJoinCodeFocused(false)}
                                    />
                                </View>
                                <TouchableOpacity 
                                    style={[
                                        styles.joinButton,
                                        (!networkStatus.connected || loading || !joinCode.trim()) && styles.buttonDisabled
                                    ]} 
                                    onPress={handleJoinRepublic}
                                    disabled={!networkStatus.connected || loading || !joinCode.trim()}
                                    activeOpacity={0.8}
                                >
                                    {loading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <Ionicons name="log-in" size={20} color="#fff" style={styles.buttonIcon} />
                                            <Text style={styles.joinButtonText}>Entrar na República</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={styles.createRepublicButton}
                                onPress={() => router.push('/(panel)/(republic)/new')}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="add-circle" size={20} color="#fff" style={styles.buttonIcon} />
                                <Text style={styles.createRepublicButtonText}>Criar Nova República</Text>
                            </TouchableOpacity>
                        </ScrollView>
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
        backgroundColor: '#222',
        padding: 20,
    },
    headerContainer: {
        marginBottom: 24,
        marginTop: 16,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#aaa',
        textAlign: 'center',
        marginBottom: 8,
        paddingHorizontal: 20,
    },
    scrollContainer: {
        flex: 1,
        width: '100%',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    loadingContainer: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 99, 71, 0.15)',
        padding: 16,
        borderRadius: 12,
        marginVertical: 16,
        borderLeftWidth: 3,
        borderLeftColor: '#FF6347',
    },
    errorText: {
        color: '#FF6347',
        marginLeft: 10,
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 16,
        marginTop: 8,
    },
    republicItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        borderRadius: 12,
        marginBottom: 16,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#444',
    },
    republicIconContainer: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: 'rgba(123, 104, 238, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    republicInfo: {
        flex: 1,
    },
    republicName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    republicCodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    republicCodeLabel: {
        color: '#aaa',
        fontSize: 14,
        marginRight: 4,
    },
    republicCode: {
        color: '#7B68EE',
        fontSize: 14,
        fontWeight: '500',
    },
    noRepublicsContainer: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: '#333',
        borderRadius: 12,
        marginVertical: 20,
        borderWidth: 1,
        borderColor: '#444',
    },
    noRepublicsIcon: {
        marginBottom: 16,
    },
    noRepublicsText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    noRepublicsSubtext: {
        color: '#aaa',
        textAlign: 'center',
        fontSize: 16,
    },
    joinSectionContainer: {
        marginTop: 16,
        marginBottom: 24,
        backgroundColor: '#333',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#444',
    },
    joinInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#444',
        height: 56,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    inputFocused: {
        borderColor: '#7B68EE',
        backgroundColor: '#393939',
    },
    inputIcon: {
        marginRight: 12,
    },
    joinInput: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        height: '100%',
    },
    joinButton: {
        backgroundColor: '#7B68EE',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
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
    joinButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    createRepublicButton: {
        flexDirection: 'row',
        backgroundColor: '#444',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    buttonIcon: {
        marginRight: 8,
    },
    joinSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    joinSectionSubtitle: {
        color: '#aaa',
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 20,
    },
    createRepublicButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonDisabled: {
        backgroundColor: '#5a5a5a',
        shadowOpacity: 0,
        elevation: 0,
    },
    networkAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF4757',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginTop: 60,
        marginBottom: 16,
        width: '100%',
    },
    networkAlertText: {
        color: 'white',
        marginLeft: 8,
        fontWeight: '500',
    },
});

export default RepublicChoiceScreen;