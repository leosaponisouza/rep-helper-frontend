import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView,
    Keyboard,
    SafeAreaView,
    StatusBar,
    Clipboard,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { router, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Validation Schema
const republicSchema = z.object({
    name: z.string().min(3, { message: "Nome da república é obrigatório" }),
    street: z.string().min(1, { message: "Rua é obrigatória" }),
    number: z.string().min(1, { message: "Número é obrigatório" }),
    complement: z.string().optional(),
    neighborhood: z.string().min(1, { message: "Bairro é obrigatório" }),
    city: z.string().min(1, { message: "Cidade é obrigatória" }),
    state: z.string().length(2, { message: "Estado deve ter 2 letras" }),
    zip_code: z.string().regex(/^\d{5}-\d{3}$/, { message: "CEP inválido" })
});

type RepublicFormData = z.infer<typeof republicSchema>;

const CreateRepublicScreen: React.FC = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { 
        control, 
        handleSubmit, 
        formState: { errors }, 
        reset 
    } = useForm<RepublicFormData>({
        resolver: zodResolver(republicSchema),
        mode: 'onBlur'
    });

    // Reset form when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            reset();
        }, [reset])
    );

    const onSubmit = async (data: RepublicFormData) => {
        Keyboard.dismiss();
        setIsSubmitting(true);

        try {
            // Haptic feedback on submission
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            if (!user) {
                throw new Error('Usuário não autenticado');
            }

            const republicData = {
                ...data,
                owner_id: user.uid,
            };

            const response = await api.post('/republics', republicData);
            const republicCode = response.data.data.republic?.code;

            if (republicCode) {
                showRepublicCodeDialog(republicCode);
            } else {
                router.replace('/(panel)/home');
            }
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            
            const errorMessage = error.response?.data?.message 
                || error.message 
                || 'Erro ao criar república';

            Alert.alert('Erro', errorMessage);
        } finally {
            setIsSubmitting(false);
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
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        Alert.alert('', 'Código copiado para a área de transferência!');
                        router.replace('/(panel)/home');
                    },
                },
                {
                    text: 'OK',
                    onPress: () => router.replace('/(panel)/home'),
                },
            ],
            { cancelable: false }
        );
    };

    const FormInput = ({ 
        control, 
        name, 
        label, 
        icon, 
        rules = {}, 
        ...inputProps 
    }: {
        control: any;
        name: keyof RepublicFormData;
        label: string;
        icon: string;
        rules?: object;
        inputProps?: any;
    }) => {
        return (
            <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                    {label} {rules.required && <Text style={styles.requiredIndicator}>*</Text>}
                </Text>
                <Controller
                    control={control}
                    name={name}
                    rules={rules}
                    render={({ field: { onChange, value, onBlur } }) => (
                        <View style={[
                            styles.inputContainer,
                            errors[name] && styles.inputError
                        ]}>
                            <Ionicons 
                                name={icon} 
                                size={20} 
                                color={errors[name] ? "#FF6347" : "#7B68EE"} 
                                style={styles.inputIcon} 
                            />
                            <TextInput
                                style={styles.input}
                                onChangeText={onChange}
                                onBlur={onBlur}
                                value={value}
                                placeholderTextColor="#aaa"
                                {...inputProps}
                            />
                        </View>
                    )}
                />
                {errors[name] && (
                    <Text style={styles.errorText}>
                        {errors[name]?.message as string}
                    </Text>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#222" />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Criar uma nova república</Text>
                        <Text style={styles.subtitle}>
                            Preencha as informações abaixo para criar sua república. 
                            Os campos com * são obrigatórios.
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <FormInput
                            control={control}
                            name="name"
                            label="Nome da República"
                            icon="home"
                            placeholder="Ex: República dos Estudantes"
                            autoCapitalize="words"
                            rules={{ required: true }}
                        />

                        <Text style={styles.sectionTitle}>Endereço</Text>

                        <FormInput
                            control={control}
                            name="street"
                            label="Rua"
                            icon="location"
                            placeholder="Nome da rua"
                            autoCapitalize="words"
                            rules={{ required: true }}
                        />

                        <FormInput
                            control={control}
                            name="number"
                            label="Número"
                            icon="pin"
                            placeholder="Número"
                            keyboardType="number-pad"
                            rules={{ required: true }}
                        />

                        <FormInput
                            control={control}
                            name="complement"
                            label="Complemento"
                            icon="information-circle"
                            placeholder="Apartamento, bloco, etc. (opcional)"
                            autoCapitalize="words"
                        />

                        <FormInput
                            control={control}
                            name="neighborhood"
                            label="Bairro"
                            icon="map"
                            placeholder="Nome do bairro"
                            autoCapitalize="words"
                            rules={{ required: true }}
                        />

                        <FormInput
                            control={control}
                            name="city"
                            label="Cidade"
                            icon="business"
                            placeholder="Nome da cidade"
                            autoCapitalize="words"
                            rules={{ required: true }}
                        />

                        <FormInput
                            control={control}
                            name="state"
                            label="Estado (UF)"
                            icon="flag"
                            placeholder="UF"
                            autoCapitalize="characters"
                            maxLength={2}
                            rules={{ required: true }}
                        />

                        <FormInput
                            control={control}
                            name="zip_code"
                            label="CEP"
                            icon="mail"
                            placeholder="00000-000"
                            keyboardType="number-pad"
                            rules={{ required: true }}
                        />

                        <TouchableOpacity
                            style={[
                                styles.button, 
                                isSubmitting && styles.buttonDisabled
                            ]}
                            onPress={handleSubmit(onSubmit)}
                            disabled={isSubmitting}
                            activeOpacity={0.8}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons 
                                        name="add-circle" 
                                        size={20} 
                                        color="#fff" 
                                        style={styles.buttonIcon} 
                                    />
                                    <Text style={styles.buttonText}>
                                        Criar República
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    // Styles remain largely the same as the original
    safeArea: {
        flex: 1,
        backgroundColor: '#222',
    },
    scrollView: {
        flex: 1,
        backgroundColor: '#222',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
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
    inputError: {
        borderColor: '#FF6347',
        backgroundColor: 'rgba(255, 99, 71, 0.1)',
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
    errorText: {
        color: '#FF6347',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
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
});

export default CreateRepublicScreen;