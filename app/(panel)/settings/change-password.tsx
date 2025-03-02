// app/(panel)/settings/change-password.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/context/AuthContext';
import { auth } from '../../../src/utils/firebaseClientConfig';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import * as Haptics from 'expo-haptics';

const ChangePasswordScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [currentPasswordFocused, setCurrentPasswordFocused] = useState(false);
  const [newPasswordFocused, setNewPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleChangePassword = async () => {
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Validação básica
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Por favor, preencha todos os campos');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('A nova senha e a confirmação não correspondem');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const firebaseUser = auth.currentUser;
      if (!firebaseUser || !firebaseUser.email) {
        throw new Error('Usuário não autenticado');
      }
      
      // Reautenticar usuário (exigido pelo Firebase antes de alterar senha)
      const credential = EmailAuthProvider.credential(
        firebaseUser.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(firebaseUser, credential);
      
      // Atualizar senha
      await updatePassword(firebaseUser, newPassword);
      
      // Sucesso
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Senha Alterada',
        'Sua senha foi alterada com sucesso',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Tratar erros comuns
      if (error.code === 'auth/wrong-password') {
        setError('Senha atual incorreta');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Tente novamente mais tarde');
      } else if (error.code === 'auth/requires-recent-login') {
        setError('Por favor, faça login novamente antes de alterar sua senha');
      } else {
        setError('Erro ao alterar senha: ' + (error.message || error));
      }
      
      console.error('Erro ao alterar senha:', error);
    } finally {
      setLoading(false);
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
            <Text style={styles.title}>Alterar Senha</Text>
            <Text style={styles.subtitle}>
              Para sua segurança, digite sua senha atual e depois escolha uma nova senha.
            </Text>
          </View>
          
          <View style={styles.formContainer}>
            {/* Campo de senha atual */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Senha Atual</Text>
              <View style={[
                styles.inputContainer,
                currentPasswordFocused && styles.inputFocused
              ]}>
                <Ionicons name="lock-closed" size={20} color="#7B68EE" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Digite sua senha atual"
                  placeholderTextColor="#aaa"
                  secureTextEntry={!showCurrentPassword}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  onFocus={() => setCurrentPasswordFocused(true)}
                  onBlur={() => setCurrentPasswordFocused(false)}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <Ionicons
                    name={showCurrentPassword ? 'eye-off' : 'eye'}
                    size={22}
                    color="#7B68EE"
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Campo de nova senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nova Senha</Text>
              <View style={[
                styles.inputContainer,
                newPasswordFocused && styles.inputFocused
              ]}>
                <Ionicons name="lock-closed" size={20} color="#7B68EE" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Digite sua nova senha"
                  placeholderTextColor="#aaa"
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  onFocus={() => setNewPasswordFocused(true)}
                  onBlur={() => setNewPasswordFocused(false)}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons
                    name={showNewPassword ? 'eye-off' : 'eye'}
                    size={22}
                    color="#7B68EE"
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.passwordHint}>
                A senha deve ter pelo menos 6 caracteres
              </Text>
            </View>
            
            {/* Campo de confirmação de senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirmar Nova Senha</Text>
              <View style={[
                styles.inputContainer,
                confirmPasswordFocused && styles.inputFocused
              ]}>
                <Ionicons name="lock-closed" size={20} color="#7B68EE" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirme sua nova senha"
                  placeholderTextColor="#aaa"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => setConfirmPasswordFocused(false)}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={22}
                    color="#7B68EE"
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Mensagem de erro */}
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#FF6347" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            
            {/* Botão de salvar */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="save" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.submitButtonText}>Alterar Senha</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.securityTips}>
            <Text style={styles.securityTipsTitle}>
              Dicas de Segurança
            </Text>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={18} color="#7B68EE" style={styles.tipIcon} />
              <Text style={styles.tipText}>Use uma combinação de letras, números e símbolos</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={18} color="#7B68EE" style={styles.tipIcon} />
              <Text style={styles.tipText}>Evite informações pessoais como datas ou nomes</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={18} color="#7B68EE" style={styles.tipIcon} />
              <Text style={styles.tipText}>Não reutilize senhas de outros serviços</Text>
            </View>
          </View>
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
    padding: 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: '#333',
    borderRadius: 12,
    margin: 20,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#444',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#555',
    height: 56,
    paddingHorizontal: 12,
  },
  inputFocused: {
    borderColor: '#7B68EE',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  passwordHint: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 99, 71, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6347',
  },
  errorText: {
    color: '#FF6347',
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#7B68EE',
    flexDirection: 'row',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#5a5a5a',
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 10,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  securityTips: {
    backgroundColor: 'rgba(123, 104, 238, 0.1)',
    borderRadius: 12,
    margin: 20,
    padding: 20,
    marginTop: 0,
    borderWidth: 1,
    borderColor: 'rgba(123, 104, 238, 0.2)',
  },
  securityTipsTitle: {
    color: '#7B68EE',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipIcon: {
    marginRight: 8,
  },
  tipText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
});

export default ChangePasswordScreen;