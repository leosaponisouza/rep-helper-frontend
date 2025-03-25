// app/(panel)/settings/account.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Image,
    Alert,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    Keyboard
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../src/services/api';
import { ErrorHandler } from '../../../src/utils/errorHandling';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { updateCurrentUser } from 'firebase/auth';
import { uploadImageToSupabase, deleteImageFromSupabase } from '../../../src/services/supabase';

const AccountScreen = () => {
    const router = useRouter();
    const { user, login, updateStoredUser } = useAuth();

    const [name, setName] = useState(user?.name || '');
    const [nickname, setNickname] = useState(user?.nickname || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phoneNumber || '');
    const [profileImage, setProfileImage] = useState<string | null>(user?.profilePictureUrl || null);
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Estados de foco para inputs
    const [nameFocused, setNameFocused] = useState(false);
    const [nicknameFocused, setNicknameFocused] = useState(false);
    const [phoneFocused, setPhoneFocused] = useState(false);

    // Atualiza os dados do usuário quando o objeto user mudar
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setNickname(user.nickname || '');
            setEmail(user.email || '');
            setPhone(user.phoneNumber || '');
            if (user.profilePictureUrl) {
                setProfileImage(user.profilePictureUrl);
            }
        }
    }, [user]);

    // Função para salvar alterações no perfil
    const handleSaveProfile = async () => {
        Keyboard.dismiss();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (!name.trim()) {
            Alert.alert('Erro', 'O nome é obrigatório');
            return;
        }

        try {
            setLoading(true);

            const userData = {
                name,
                nickname: nickname.trim() || null, // Garante que seja null se estiver vazio
                phoneNumber: phone,
                profilePictureUrl: profileImage // Enviando a URL da imagem para o backend
            };

            console.log('Enviando dados para atualização:', userData);
            const response = await api.put(`/api/v1/users/${user?.uid}`, userData);

            if (response.data) {
                await updateStoredUser(response.data);
                Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
            }
        } catch (error) {
            console.error('Erro ao salvar perfil:', error);
            ErrorHandler.handle(error);
        } finally {
            setLoading(false);
        }
    };

    // Função para selecionar imagem da galeria
    const pickImage = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Limpar erro anterior
        setUploadError(null);

        try {
            // Solicitar permissão para acessar a galeria
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permissionResult.granted === false) {
                Alert.alert('Permissão Negada', 'É necessário permissão para acessar sua galeria de fotos');
                return;
            }

            // Abrir seletor de imagem
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7, // Reduzindo a qualidade para tamanho menor
                allowsMultipleSelection: false,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                // Iniciar upload
                setUploadingImage(true);
                
                try {
                    console.log('Imagem selecionada. Iniciando upload para Supabase...');
                    // Upload para o Supabase usando a função do serviço
                    const imageUri = result.assets[0].uri;
                    const asset = result.assets[0];
                    
                    console.log('Detalhes da imagem:', {
                        uri: asset.uri,
                        width: asset.width,
                        height: asset.height,
                        fileSize: asset.fileSize,
                        type: asset.type
                    });
                    
                    const { url, error } = await uploadImageToSupabase(imageUri);
                    
                    if (error || !url) {
                        setUploadError(error?.message || 'Falha ao fazer upload da imagem');
                        throw new Error(`Falha ao fazer upload da imagem para o Supabase: ${error?.message}`);
                    }
                    
                    console.log('Upload concluído. URL recebida:', url);
                    
                    // Atualizar a imagem no estado
                    setProfileImage(url);
                    
                    // Atualizar o perfil do usuário no backend com a nova URL
                    console.log('Atualizando perfil no backend com nova URL...');
                    const response = await api.put(`/api/v1/users/${user?.uid}`, {
                        profilePictureUrl: url
                    });

                    console.log('Resposta da API:', response.data);

                    // Atualizar usuário no contexto de autenticação
                    if (user) {
                        // Criar objeto com todos os dados do usuário atual + a nova URL
                        const updatedUser = {
                            ...user,
                            profilePictureUrl: url
                        };
                        
                        // Log para debug
                        console.log('Atualizando usuário no contexto com nova imagem:', updatedUser);
                        
                        // Atualizar o contexto de autenticação
                        await updateStoredUser(updatedUser);
                        
                        // Log para confirmar que a atualização foi concluída
                        console.log('Usuário atualizado no contexto com sucesso');
                    }

                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Alert.alert('Sucesso', 'Foto de perfil atualizada com sucesso!');
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Erro desconhecido';
                    console.error('Erro detalhado no upload:', error);
                    setUploadError(message);
                    
                    Alert.alert(
                        'Erro ao Enviar Imagem', 
                        `Não foi possível fazer o upload da imagem: ${message}`
                    );
                    
                    ErrorHandler.handle(error);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                } finally {
                    setUploadingImage(false);
                }
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            console.error('Erro ao selecionar imagem:', error);
            setUploadError(message);
            Alert.alert('Erro', `Não foi possível selecionar a imagem: ${message}`);
            setUploadingImage(false);
        }
    };

    const confirmDeleteProfilePicture = () => {
        if (!profileImage) return;

        Alert.alert(
            'Remover Foto',
            'Tem certeza que deseja remover sua foto de perfil?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Remover',
                    style: 'destructive',
                    onPress: handleDeleteProfilePicture
                }
            ]
        );
    };

    const handleDeleteProfilePicture = async () => {
        try {
            setUploadingImage(true);
            setUploadError(null);

            // Deletar a imagem do Supabase se tivermos uma URL válida
            if (profileImage) {
                console.log('Tentando excluir imagem do Supabase:', profileImage);
                const { success, error } = await deleteImageFromSupabase(profileImage);
                
                if (error) {
                    console.warn('Erro ao deletar imagem do Supabase:', error);
                    // Continuar mesmo com erro, para pelo menos remover a referência no backend
                }
            }

            // Atualizar o perfil do usuário no backend
            console.log('Atualizando perfil no backend para remover a URL da imagem');
            const response = await api.put(`/api/v1/users/${user?.uid}`, {
                profilePictureUrl: null
            });
            
            setProfileImage(null);

            // Atualizar usuário no contexto
            if (user) {
                const updatedUser = {
                    ...user,
                    profilePictureUrl: null
                };

                await updateStoredUser(updatedUser);
                console.log('Usuário atualizado no contexto após remoção de imagem');
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Sucesso', 'Foto de perfil removida com sucesso!');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            console.error('Erro ao excluir imagem:', error);
            setUploadError(message);
            Alert.alert('Erro', `Não foi possível remover a foto: ${message}`);
            ErrorHandler.handle(error);
        } finally {
            setUploadingImage(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#222" />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView style={styles.container}>
                    <View style={styles.header}>
                        <View style={styles.profileImageContainer}>
                            {uploadingImage ? (
                                <View style={styles.uploading}>
                                    <ActivityIndicator size="large" color="#7B68EE" />
                                </View>
                            ) : profileImage ? (
                                <Image 
                                    source={{ uri: profileImage }} 
                                    style={styles.profileImage}
                                    onError={(e) => {
                                        console.error('Erro ao carregar imagem:', e.nativeEvent.error);
                                        setUploadError('Não foi possível carregar a imagem');
                                    }}
                                />
                            ) : (
                                <View style={styles.placeholderImage}>
                                    <Text style={styles.placeholderText}>
                                        {user && user.nickname
                                            ? user.nickname[0].toUpperCase()
                                            : name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.imageActions}>
                                <TouchableOpacity
                                    style={styles.imageActionButton}
                                    onPress={pickImage}
                                    disabled={uploadingImage}
                                >
                                    <Ionicons name="camera" size={18} color="#fff" />
                                </TouchableOpacity>

                                {profileImage && (
                                    <TouchableOpacity
                                        style={[styles.imageActionButton, styles.deleteImageButton]}
                                        onPress={confirmDeleteProfilePicture}
                                        disabled={uploadingImage}
                                    >
                                        <Ionicons name="trash" size={18} color="#fff" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {uploadError && (
                            <Text style={styles.errorText}>
                                {uploadError}
                            </Text>
                        )}

                        <Text style={styles.userName}>
                            {nickname || name}
                        </Text>
                        <Text style={styles.userEmail}>{email}</Text>
                    </View>

                    <View style={styles.formSection}>
                        <Text style={styles.sectionTitle}>Informações Pessoais</Text>

                        <View style={styles.formContainer}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Nome Completo</Text>
                                <View style={[
                                    styles.inputContainer,
                                    nameFocused && styles.inputFocused
                                ]}>
                                    <Ionicons name="person" size={20} color="#7B68EE" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="Seu nome completo"
                                        placeholderTextColor="#aaa"
                                        onFocus={() => setNameFocused(true)}
                                        onBlur={() => setNameFocused(false)}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Apelido (opcional)</Text>
                                <View style={[
                                    styles.inputContainer,
                                    nicknameFocused && styles.inputFocused
                                ]}>
                                    <Ionicons name="at" size={20} color="#7B68EE" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        value={nickname}
                                        onChangeText={setNickname}
                                        placeholder="Como você gostaria de ser chamado"
                                        placeholderTextColor="#aaa"
                                        onFocus={() => setNicknameFocused(true)}
                                        onBlur={() => setNicknameFocused(false)}
                                    />
                                </View>
                                <Text style={styles.helperText}>
                                    Se definido, será usado em vez do seu nome em toda a aplicação
                                </Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Email</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="mail" size={20} color="#7B68EE" style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { color: '#888' }]}
                                        value={email}
                                        placeholder="Seu email"
                                        placeholderTextColor="#aaa"
                                        editable={false}
                                    />
                                </View>
                                <Text style={styles.emailNote}>
                                    O email não pode ser alterado
                                </Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Telefone (opcional)</Text>
                                <View style={[
                                    styles.inputContainer,
                                    phoneFocused && styles.inputFocused
                                ]}>
                                    <Ionicons name="call" size={20} color="#7B68EE" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        value={phone}
                                        onChangeText={setPhone}
                                        placeholder="Seu número de telefone"
                                        placeholderTextColor="#aaa"
                                        keyboardType="phone-pad"
                                        onFocus={() => setPhoneFocused(true)}
                                        onBlur={() => setPhoneFocused(false)}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.securitySection}>
                        <Text style={styles.sectionTitle}>Segurança</Text>

                        <TouchableOpacity
                            style={styles.securityButton}
                            onPress={() => router.push('/(panel)/settings/change-password')}
                        >
                            <View style={styles.securityButtonContent}>
                                <Ionicons name="lock-closed" size={20} color="#7B68EE" />
                                <Text style={styles.securityButtonText}>Alterar Senha</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#7B68EE" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            loading && styles.buttonDisabled
                        ]}
                        onPress={handleSaveProfile}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="save" size={20} color="#fff" style={styles.saveButtonIcon} />
                                <Text style={styles.saveButtonText}>Salvar Alterações</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#222',
    },
    container: {
        flex: 1,
        backgroundColor: '#222',
    },
    header: {
        alignItems: 'center',
        paddingVertical: 24,
        backgroundColor: '#333',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#444',
    },
    profileImageContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    placeholderImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#7B68EE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: 'white',
    },
    uploading: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageActions: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: -5,
        right: -5,
    },
    imageActionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#7B68EE',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    deleteImageButton: {
        backgroundColor: '#FF6347',
    },
    errorText: {
        color: '#FF6347',
        marginTop: 5,
        marginBottom: 10,
        textAlign: 'center',
        fontSize: 12,
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
        color: '#aaa',
    },
    formSection: {
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#7B68EE',
        marginBottom: 16,
    },
    formContainer: {
        backgroundColor: '#333',
        borderRadius: 12,
        padding: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#444',
        borderRadius: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#555',
    },
    inputFocused: {
        borderColor: '#7B68EE',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        color: 'white',
        fontSize: 16,
    },
    emailNote: {
        color: '#888',
        fontSize: 12,
        marginTop: 4,
        fontStyle: 'italic',
    },
    helperText: {
        color: '#aaa',
        fontSize: 12,
        marginTop: 4,
    },
    securitySection: {
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    securityButton: {
        backgroundColor: '#333',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    securityButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    securityButtonText: {
        color: 'white',
        fontSize: 16,
        marginLeft: 12,
    },
    saveButton: {
        backgroundColor: '#7B68EE',
        borderRadius: 12,
        padding: 16,
        margin: 20,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 40,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    saveButtonIcon: {
        marginRight: 10,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AccountScreen;