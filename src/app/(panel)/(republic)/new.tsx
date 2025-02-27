// app/(republic)/new.tsx
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
    ScrollView,
    Clipboard // Import Clipboard
} from 'react-native';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'expo-router';
import BackButton from '../../../../components/BackButton';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../../../utils/firebaseClientConfig';

const CreateRepublicScreen = () => {
    const [name, setName] = useState('');
    const [street, setStreet] = useState('');
    const [number, setNumber] = useState('');
    const [complement, setComplement] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zip_code, setZipCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [republicCode, setRepublicCode] = useState<string | null>(null); // State to hold republic code

    const { user, login } = useAuth();
    const router = useRouter();

    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setFirebaseUser(user);
        });
        return () => unsubscribe();
    }, []);


    const handleCreateRepublic = async () => {
        Keyboard.dismiss();

        if (!name || !street || !number || !neighborhood || !city || !state || !zip_code) {
            setError('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        setLoading(true);
        setError('');
        setRepublicCode(null); // Reset republic code state before request

        try {
            if (!firebaseUser) {
                throw new Error('Usuário não autenticado.');
            }

            if (user) {
                const republicData = {
                    name,
                    street,
                    number,
                    complement,
                    neighborhood,
                    city,
                    state,
                    zip_code,
                    owner_id: user.uid,
                };

                const firebaseToken = await firebaseUser.getIdToken();
                const response = await api.post('/republics', republicData, {
                    headers: {
                        Authorization: `Bearer ${firebaseToken}`,
                    },
                });

                login(response.data.token, response.data.data.user);
                if (response.data.data.republic && response.data.data.republic.code) { // Check if republic and code are in response
                    setRepublicCode(response.data.data.republic.code); // Store republic code
                    showRepublicCodeDialog(response.data.data.republic.code); // Show dialog after setting the code state
                } else {
                    router.replace('/(panel)/home'); // If no code, just navigate home
                }


            } else {
                throw new Error("Usuário não encontrado no contexto de autenticação.");
            }

        } catch (error: any) {
            setError(error.message || 'Erro ao criar república. Tente novamente.');
            console.error(error);
            Alert.alert("Erro", error.message);
        } finally {
            setLoading(false);
        }
    };

    const showRepublicCodeDialog = (code: string) => {
        Alert.alert(
            'República Criada!',
            'Compartilhe este código com seus moradores:\n\n' + code,
            [
                {
                    text: 'Copiar Código',
                    onPress: () => {
                        Clipboard.setString(code);
                        Alert.alert('', 'Código copiado para a área de transferência!');
                        router.replace('/(panel)/home');
                    },
                },
                {
                    text: 'OK',
                    onPress: () => {
                        router.replace('/(panel)/home');
                    },
                },
            ],
            { cancelable: false }
        );
    };


    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.container}>
                <BackButton />
                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >

                    <Text style={styles.title}>Criar uma nova república</Text>
                    <Text style={styles.subtitle}>
                        Preencha as informações abaixo para criar sua república.
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Nome da República"
                        placeholderTextColor="#aaa"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />
                    {/* ... Inputs for address ... */}
                    <TextInput
                        style={styles.input}
                        placeholder="Rua"
                        placeholderTextColor="#aaa"
                        value={street}
                        onChangeText={setStreet}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Número"
                        placeholderTextColor="#aaa"
                        value={number}
                        onChangeText={setNumber}
                        keyboardType="number-pad"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Complemento (opcional)"
                        placeholderTextColor="#aaa"
                        value={complement}
                        onChangeText={setComplement}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Bairro"
                        placeholderTextColor="#aaa"
                        value={neighborhood}
                        onChangeText={setNeighborhood}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Cidade"
                        placeholderTextColor="#aaa"
                        value={city}
                        onChangeText={setCity}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Estado (UF)"
                        placeholderTextColor="#aaa"
                        value={state}
                        onChangeText={setState}
                        maxLength={2}
                        autoCapitalize="characters"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="CEP"
                        placeholderTextColor="#aaa"
                        value={zip_code}
                        onChangeText={setZipCode}
                        keyboardType="number-pad"
                    />

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    {loading ? (
                        <ActivityIndicator size="large" color="#7B68EE" />
                    ) : (
                        <TouchableOpacity style={styles.button} onPress={handleCreateRepublic}>
                            <Text style={styles.buttonText}>Criar República</Text>
                        </TouchableOpacity>
                    )}
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
        marginBottom: 16,
        color: '#fff',
        fontFamily: 'Roboto',
        width: '100%',
        textAlign: 'left'

    },
    subtitle: {
        fontSize: 16,
        color: '#aaa',
        marginBottom: 32,
        width: '100%',
        textAlign: 'left'
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

export default CreateRepublicScreen;