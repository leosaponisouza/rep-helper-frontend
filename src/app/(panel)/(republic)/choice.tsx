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
    ScrollView
} from 'react-native';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../../../utils/firebaseClientConfig';
import BackButton from '../../../../components/BackButton';

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
    const [joinCode, setJoinCode] = useState(''); // State for joining a republic
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setFirebaseUser(user);
        });
        return () => unsubscribe();
    }, []);

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
            Alert.alert("Error", 'Please enter a join code.');
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
            Alert.alert("Success", "You have joined the republic")
            router.replace('/(panel)/home'); // Navigate to home or appropriate screen
        } catch (err: any) {
            if (err.response && err.response.status === 404) {
                setError('Republic not found.');
                Alert.alert('Error', 'Republic not found.');
            } else if (err.response && err.response.status === 400) {
                setError('You are already in this republic.');
                Alert.alert('Error', 'You are already in this republic.');
            } else {
                setError('Failed to join republic.');
                Alert.alert('Error', 'Failed to join republic.');
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
            router.replace('/(panel)/home'); // Navigate to home or appropriate screen
        } catch (err: any) {
            setError('Failed to select republic.');
            console.error('Error selecting republic:', err);
            Alert.alert('Error', 'Failed to select republic.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.container}>
                <BackButton/>
                <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} >
                    <Text style={styles.title}>Escolha sua República</Text>

                    {loading ? (
                        <ActivityIndicator size="large" color="#7B68EE" />
                    ) : error ? (
                        <Text style={styles.error}>{error}</Text>
                    ) : republics.length === 0 ? (
                        <View style={styles.noRepublicsContainer}>
                            <Text style={styles.noRepublicsText}>
                                Você ainda não está em nenhuma república.
                            </Text>
                            <TouchableOpacity
                                style={styles.createRepublicButton}
                                onPress={() => router.push('/(panel)/(republic)/new')}
                            >
                                <Text style={styles.createRepublicButtonText}>Criar uma República</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        republics.map((republic) => (
                            <TouchableOpacity
                                key={republic.id}
                                style={styles.republicItem}
                                onPress={() => handleSelectRepublic(republic.id)}
                            >
                                <Text style={styles.republicName}>{republic.name}</Text>
                                <Text style={styles.republicCode}>Código: {republic.code}</Text>
                            </TouchableOpacity>
                        ))
                    )}
                    <View style={styles.joinRepublicSection}>
                        <TextInput
                            style={styles.joinInput}
                            placeholder="Código da República"
                            placeholderTextColor="#aaa"
                            value={joinCode}
                            onChangeText={setJoinCode}
                            autoCapitalize="characters" // Most common case for codes
                        />
                        <TouchableOpacity style={styles.joinButton} onPress={handleJoinRepublic}>
                            <Text style={styles.joinButtonText}>Entrar</Text>
                        </TouchableOpacity>
                    </View>
                    {republics.length > 0 ?
                        <TouchableOpacity
                            style={styles.createRepublicButton}
                            onPress={() => router.push('/(panel)/(republic)/new')}
                        >
                            <Text style={styles.createRepublicButtonText}>Criar uma República</Text>
                        </TouchableOpacity> : <></>}
                </ScrollView>
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#333',
        paddingTop: 60,
        alignItems: 'center',

    },
    scrollContainer: {
        width: '100%',
        paddingHorizontal: 20,
    },
    scrollContent: {
        alignItems: 'center',
        paddingBottom: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        color: '#fff',
        textAlign: 'center',
    },
    republicItem: {
        backgroundColor: '#444',
        width: '100%',
        padding: 20,
        borderRadius: 8,
        marginBottom: 15,
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    republicName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5
    },
    republicCode: {
        color: '#aaa',
        fontSize: 14,
    },
    error: {
        color: '#FF6347',
        marginBottom: 15,
        textAlign: 'center',
    },
    joinRepublicSection: {
        width: '100%',
        marginBottom: 20,
    },
    joinInput: {
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
    joinButton: {
        backgroundColor: '#7B68EE',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    joinButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    createRepublicButton: {
        backgroundColor: '#555',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
        marginBottom: 20
    },
    createRepublicButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    noRepublicsContainer: {
        alignItems: 'center',
        width: '100%'
    },
    noRepublicsText: {
        color: '#fff',
        textAlign: 'center',
        marginBottom: 20
    },
});

export default RepublicChoiceScreen;
