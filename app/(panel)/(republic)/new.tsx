// app/(panel)/(republic)/new.tsx
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
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar,
    Clipboard,
} from 'react-native';
import api from '../../../src/services/api';
import { useAuth } from '../../../src/context/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../../../src/utils/firebaseClientConfig';

interface FormFieldState {
    value: string;
    focused: boolean;
}

const CreateRepublicScreen = () => {
    const [formState, setFormState] = useState({
        name: { value: '', focused: false },
        street: { value: '', focused: false },
        number: { value: '', focused: false },
        complement: { value: '', focused: false },
        neighborhood: { value: '', focused: false },
        city: { value: '', focused: false },
        state: { value: '', focused: false },
        zip_code: { value: '', focused: false },
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [republicCode, setRepublicCode] = useState<string | null>(null);

    const { user, login } = useAuth();
    const router = useRouter();
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setFirebaseUser(user);
        });
        return () => unsubscribe();
    }, []);

    const handleFieldChange = (field: keyof typeof formState, value: string) => {
        setFormState({
            ...formState,
            [field]: { ...formState[field], value }
        });
    };

    const handleFieldFocus = (field: keyof typeof formState) => {
        setFormState({
            ...formState,
            [field]: { ...formState[field], focused: true }
        });
    };

    const handleFieldBlur = (field: keyof typeof formState) => {
        setFormState({
            ...formState,
            [field]: { ...formState[field], focused: false }
        });
    };

    const handleCreateRepublic = async () => {
        Keyboard.dismiss();

        // Check required fields
        const requiredFields = ['name', 'street', 'number', 'neighborhood', 'city', 'state', 'zip_code'];
        const missingFields = requiredFields.filter(
            field => !formState[field as keyof typeof formState].value.trim()
        );

        if (missingFields.length > 0) {
            setError('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        setLoading(true);
        setError('');
        setRepublicCode(null);

        try {
            if (!firebaseUser) {
                throw new Error('Usuário não autenticado.');
            }

            if (user) {
                const republicData = {
                    name: formState.name.value,
                    street: formState.street.value,
                    number: formState.number.value,
                    complement: formState.complement.value,
                    neighborhood: formState.neighborhood.value,
                    city: formState.city.value,
                    state: formState.state.value,
                    zip_code: formState.zip_code.value,
                    owner_id: user.uid,
                };

                const firebaseToken = await firebaseUser.getIdToken();
                const response = await api.post('/republics', republicData, {
                    headers: {
                        Authorization: `Bearer ${firebaseToken}`,
                    },
                });

                login(response.data.token, response.data.data.user);
                if (response.data.data.republic && response.data.data.republic.code) {
                    setRepublicCode(response.data.data.republic.code);
                    showRepublicCodeDialog(response.data.data.republic.code);
                } else {
                    router.replace('/(panel)/home');
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

    const FormField = ({ 
        label, 
        placeholder, 
        field, 
        keyboardType = 'default',
        autoCapitalize = 'none',
        maxLength,
        required = false,
        icon,
    }: { 
        label: string; 
        placeholder: string; 
        field: keyof typeof formState;
        keyboardType?: 'default' | 'number-pad' | 'email-address';
        autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
        maxLength?: number;
        required?: boolean;
        icon: any;
    }) => (
        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
                {label} {required && <Text style={styles.requiredIndicator}>*</Text>}
            </Text>
            <View style={[
                styles.inputContainer,
                formState[field].focused && styles.inputFocused
            ]}>
                <Ionicons name={icon} size={20} color="#7B68EE" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor="#aaa"
                    value={formState[field].value}
                    onChangeText={(value) => handleFieldChange(field, value)}
                    onFocus={() => handleFieldFocus(field)}
                    onBlur={() => handleFieldBlur(field)}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    maxLength={maxLength}
                />
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#222" />
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <View style={styles.container}>
                        <ScrollView
                            style={styles.scrollContainer}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.headerContainer}>
                                <Text style={styles.title}>Criar uma nova república</Text>
                                <Text style={styles.subtitle}>
                                    Preencha as informações abaixo para criar sua república. Os campos com * são obrigatórios.
                                </Text>
                            </View>

                            <View style={styles.formContainer}>
                                <FormField 
                                    label="Nome da República" 
                                    placeholder="Ex: República dos Estudantes"
                                    field="name"
                                    autoCapitalize="words"
                                    required={true}
                                    icon="home"
                                />
                                
                                <Text style={styles.sectionLabel}>Endereço</Text>
                                
                                <FormField 
                                    label="Rua" 
                                    placeholder="Nome da rua"
                                    field="street"
                                    autoCapitalize="words"
                                    required={true}
                                    icon="location"
                                />
                                
                                <FormField 
                                    label="Número" 
                                    placeholder="Número"
                                    field="number"
                                    keyboardType="number-pad"
                                    required={true}
                                    icon="pin"
                                />
                                
                                <FormField 
                                    label="Complemento" 
                                    placeholder="Apartamento, bloco, etc. (opcional)"
                                    field="complement"
                                    autoCapitalize="words"
                                    icon="information-circle"
                                />
                                
                                <FormField 
                                    label="Bairro" 
                                    placeholder="Nome do bairro"
                                    field="neighborhood"
                                    autoCapitalize="words"
                                    required={true}
                                    icon="map"
                                />
                                
                                <FormField 
                                    label="Cidade" 
                                    placeholder="Nome da cidade"
                                    field="city"
                                    autoCapitalize="words"
                                    required={true}
                                    icon="business"
                                />
                                
                                <FormField 
                                    label="Estado (UF)" 
                                    placeholder="UF"
                                    field="state"
                                    autoCapitalize="characters"
                                    maxLength={2}
                                    required={true}
                                    icon="flag"
                                />
                                
                                <FormField 
                                    label="CEP" 
                                    placeholder="00000-000"
                                    field="zip_code"
                                    keyboardType="number-pad"
                                    required={true}
                                    icon="mail"
                                />

                                {error ? (
                                    <View style={styles.errorContainer}>
                                        <Ionicons name="alert-circle" size={18} color="#FF6347" />
                                        <Text style={styles.errorText}>{error}</Text>
                                    </View>
                                ) : null}

                                <TouchableOpacity 
                                    style={[styles.button, loading && styles.buttonDisabled]} 
                                    onPress={handleCreateRepublic}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                >
                                    {loading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <Ionicons name="add-circle" size={20} color="#fff" style={styles.buttonIcon} />
                                            <Text style={styles.buttonText}>Criar República</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
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
    },
    scrollContainer: {
        width: '100%',
        paddingHorizontal: 20,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    headerContainer: {
        marginBottom: 24,
        paddingHorizontal: 4,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
        fontFamily: 'Roboto',
    },
    subtitle: {
        fontSize: 16,
        color: '#aaa',
        marginBottom: 16,
        lineHeight: 22,
    },
    formContainer: {
        width: '100%',
    },
    sectionLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginTop: 16,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    fieldContainer: {
        marginBottom: 16,
    },
    fieldLabel: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    requiredIndicator: {
        color: '#FF6347',
        fontWeight: 'bold',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#444',
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
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 99, 71, 0.15)',
        padding: 12,
        borderRadius: 8,
        marginVertical: 16,
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
        marginTop: 16,
        flexDirection: 'row',
        shadowColor: "#7B68EE",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonDisabled: {
        backgroundColor: '#5a5a5a',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonIcon: {
        marginRight: 8,
    }
});

export default CreateRepublicScreen;
