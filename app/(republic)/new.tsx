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
    ScrollView,
    Platform,
    SafeAreaView,
    StatusBar,
    Clipboard,
    KeyboardAvoidingView,
} from 'react-native';
import api from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../../src/utils/firebaseClientConfig';

// Interface simples para os campos do formulário
type FormData = {
    name: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
};

const CreateRepublicScreen = () => {
    // Estado inicial simplificado
    const [formData, setFormData] = useState<FormData>({
        name: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zip_code: '',
    });
    
    // Estado para campo com foco atual (para destacar visualmente)
    const [focusedField, setFocusedField] = useState<string | null>(null);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

    const { user, login } = useAuth();
    const router = useRouter();

    // Monitorar autenticação do Firebase
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setFirebaseUser(user);
        });
        return () => unsubscribe();
    }, []);

    // Função simplificada para atualizar os campos
    const handleChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCreateRepublic = async () => {
        // Validação de campos obrigatórios
        const requiredFields: Array<keyof FormData> = ['name', 'street', 'number', 'neighborhood', 'city', 'state', 'zip_code'];
        const missingFields = requiredFields.filter(field => !formData[field].trim());

        if (missingFields.length > 0) {
            setError('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (!firebaseUser) {
                throw new Error('Usuário não autenticado.');
            }

            if (user) {
                const republicData = {
                    ...formData,
                    owner_id: user.uid,
                };

                const firebaseToken = await firebaseUser.getIdToken();
                const response = await api.post('/republics', republicData, {
                    headers: {
                        Authorization: `Bearer ${firebaseToken}`,
                    },
                });

                login(response.data.token, response.data.data.user);
                
                // Se tiver um código da república, mostre o diálogo
                if (response.data.data.republic?.code) {
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

    // Componente de campo de formulário simplificado
    const FormField = ({ 
        label, 
        field, 
        placeholder,
        keyboardType = 'default',
        autoCapitalize = 'none',
        maxLength,
        required = false,
        icon,
    }: { 
        label: string;
        field: keyof FormData;
        placeholder: string;
        keyboardType?: 'default' | 'number-pad' | 'email-address';
        autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
        maxLength?: number;
        required?: boolean;
        icon: string;
    }) => (
        <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
                {label} {required && <Text style={styles.requiredIndicator}>*</Text>}
            </Text>
            <View style={[
                styles.inputContainer,
                focusedField === field && styles.inputFocused
            ]}>
                <Ionicons name={icon} size={20} color="#7B68EE" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    value={formData[field]}
                    onChangeText={(value) => handleChange(field, value)}
                    onFocus={() => setFocusedField(field)}
                    onBlur={() => setFocusedField(null)}
                    placeholder={placeholder}
                    placeholderTextColor="#aaa"
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    maxLength={maxLength}
                    returnKeyType={field === 'zip_code' ? 'done' : 'next'}
                />
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#222" />
            
            {/* Abordagem simplificada com KeyboardAvoidingView fora do ScrollView */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={true}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Criar uma nova república</Text>
                        <Text style={styles.subtitle}>
                            Preencha as informações abaixo para criar sua república. Os campos com * são obrigatórios.
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <FormField 
                            label="Nome da República" 
                            field="name"
                            placeholder="Ex: República dos Estudantes"
                            autoCapitalize="words"
                            required={true}
                            icon="home"
                        />
                        
                        <Text style={styles.sectionTitle}>Endereço</Text>
                        
                        <FormField 
                            label="Rua" 
                            field="street"
                            placeholder="Nome da rua"
                            autoCapitalize="words"
                            required={true}
                            icon="location"
                        />
                        
                        <FormField 
                            label="Número" 
                            field="number"
                            placeholder="Número"
                            keyboardType="number-pad"
                            required={true}
                            icon="pin"
                        />
                        
                        <FormField 
                            label="Complemento" 
                            field="complement"
                            placeholder="Apartamento, bloco, etc. (opcional)"
                            autoCapitalize="words"
                            icon="information-circle"
                        />
                        
                        <FormField 
                            label="Bairro" 
                            field="neighborhood"
                            placeholder="Nome do bairro"
                            autoCapitalize="words"
                            required={true}
                            icon="map"
                        />
                        
                        <FormField 
                            label="Cidade" 
                            field="city"
                            placeholder="Nome da cidade"
                            autoCapitalize="words"
                            required={true}
                            icon="business"
                        />
                        
                        <FormField 
                            label="Estado (UF)" 
                            field="state"
                            placeholder="UF"
                            autoCapitalize="characters"
                            maxLength={2}
                            required={true}
                            icon="flag"
                        />
                        
                        <FormField 
                            label="CEP" 
                            field="zip_code"
                            placeholder="00000-000"
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
                        
                        {/* Espaço adicional no final */}
                        <View style={styles.bottomSpacer} />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// Estilos simplificados e melhorados
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#222',
    },
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100, // Espaço extra no fim do formulário
    },
    header: {
        marginTop: 20,
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#aaa',
        lineHeight: 22,
    },
    form: {
        width: '100%',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginTop: 16,
        marginBottom: 12,
    },
    fieldContainer: {
        marginBottom: 16,
    },
    fieldLabel: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 8,
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
        padding: 8,
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
        marginTop: 24,
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
    },
    bottomSpacer: {
        height: 60,
    }
});

export default CreateRepublicScreen;