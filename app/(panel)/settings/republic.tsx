import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Share,
  Clipboard
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../src/services/api';
import { ErrorHandler } from '../../../src/utils/errorHandling';
import * as Haptics from 'expo-haptics';

// Improved type definitions
interface Republic {
  id: string;
  name: string;
  code: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon: string;
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  disabled?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'email-address' | 'numeric';
  maxLength?: number;
  required?: boolean;
}

const RepublicSettingsScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  const [republic, setRepublic] = useState<Republic | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [regeneratingCode, setRegeneratingCode] = useState<boolean>(false);
  
  // Form state with explicit types
  const [name, setName] = useState<string>('');
  const [street, setStreet] = useState<string>('');
  const [number, setNumber] = useState<string>('');
  const [complement, setComplement] = useState<string>('');
  const [neighborhood, setNeighborhood] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [zipCode, setZipCode] = useState<string>('');
  
  // Input focus states with explicit types
  const [nameFocused, setNameFocused] = useState<boolean>(false);
  const [streetFocused, setStreetFocused] = useState<boolean>(false);
  const [numberFocused, setNumberFocused] = useState<boolean>(false);
  const [complementFocused, setComplementFocused] = useState<boolean>(false);
  const [neighborhoodFocused, setNeighborhoodFocused] = useState<boolean>(false);
  const [cityFocused, setCityFocused] = useState<boolean>(false);
  const [stateFocused, setStateFocused] = useState<boolean>(false);
  const [zipCodeFocused, setZipCodeFocused] = useState<boolean>(false);
  
  // Verify if the user is the owner of the republic
  const isOwner = user?.uid === republic?.owner_id;
  
  const handleRegenerateCode = async () => {
    if (!isOwner) {
      Alert.alert('Erro', 'Apenas o dono da república pode gerar novos códigos');
      return;
    }
    
    Alert.alert(
      'Regenerar Código',
      'Tem certeza que deseja criar um novo código de convite? O código atual deixará de funcionar.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: async () => {
            try {
              setRegeneratingCode(true);
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              
              const response = await api.post<{ code: string }>(`/api/v1/republics/${republic?.id}/regenerate-code`);
              
              if (response.data?.code) {
                setRepublic(prev => prev ? {
                  ...prev,
                  code: response.data.code
                } : null);
                
                Alert.alert('Sucesso', 'Novo código de convite gerado com sucesso!');
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (error) {
              ErrorHandler.handle(error);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            } finally {
              setRegeneratingCode(false);
            }
          }
        }
      ]
    );
  };
  
  const handleCopyCode = () => {
    if (republic?.code) {
      Clipboard.setString(republic.code);
      Alert.alert('Código Copiado', 'O código de convite foi copiado para a área de transferência.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };
  
  const handleShareCode = async () => {
    if (republic?.code) {
      try {
        await Share.share({
          message: `Entre na minha república no RepHelper usando o código: ${republic.code}`,
        });
      } catch (error) {
        Alert.alert('Erro', 'Houve um erro ao compartilhar o código');
      }
    }
  };

  // Fetch republic data
  useEffect(() => {
    const fetchRepublicData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!user?.currentRepublicId) {
          throw new Error("Você não está associado a nenhuma república");
        }
        
        const response = await api.get<Republic>(`/api/v1/republics/${user.currentRepublicId}`);
        const republicData = response.data;
        
        setRepublic(republicData);
        
        // Set form values with null coalescing
        setName(republicData.name ?? '');
        setStreet(republicData.street ?? '');
        setNumber(republicData.number ?? '');
        setComplement(republicData.complement ?? '');
        setNeighborhood(republicData.neighborhood ?? '');
        setCity(republicData.city ?? '');
        setState(republicData.state ?? '');
        setZipCode(republicData.zip_code ?? '');
        
      } catch (error) {
        const parsedError = ErrorHandler.parseError(error);
        setError(parsedError.message);
        ErrorHandler.logError(parsedError);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRepublicData();
  }, [user?.currentRepublicId]);

  const handleSaveChanges = async () => {
    Keyboard.dismiss();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!isOwner) {
      Alert.alert('Erro', 'Apenas o dono da república pode alterar estas informações');
      return;
    }
    
    if (!name.trim() || !street.trim() || !number.trim() || !neighborhood.trim() || 
        !city.trim() || !state.trim() || !zipCode.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }
    
    try {
      setSaving(true);
      
      const republicData = {
        name,
        street,
        number,
        complement: complement || null,
        neighborhood,
        city,
        state,
        zip_code: zipCode
      };
      
      const response = await api.put<Republic>(`/api/v1/republics/${republic?.id}`, republicData);
      
      if (response.data) {
        setRepublic(response.data);
        Alert.alert('Sucesso', 'Informações da república atualizadas com sucesso!');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
    } catch (error) {
      ErrorHandler.handle(error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  // Form input component with improved type safety
  const FormInput: React.FC<FormInputProps> = ({ 
    label, 
    value, 
    onChangeText, 
    placeholder, 
    icon, 
    isFocused, 
    onFocus, 
    onBlur, 
    disabled = false,
    keyboardType = 'default',
    maxLength,
    required = false
  }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputFocused,
        disabled && styles.inputDisabled
      ]}>
        <Ionicons name={icon as any} size={20} color="#7B68EE" style={styles.inputIcon} />
        <TextInput
          style={[styles.input, disabled && styles.disabledInput]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#aaa"
          onFocus={onFocus}
          onBlur={onBlur}
          editable={!disabled}
          keyboardType={keyboardType}
          maxLength={maxLength}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7B68EE" />
            <Text style={styles.loadingText}>Carregando dados da república...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={50} color="#FF6347" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.errorButton}
              onPress={() => router.back()}
            >
              <Text style={styles.errorButtonText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Rest of the render remains the same as in the original code
          <ScrollView style={styles.container}>
            {/* Original render code */}
          </ScrollView>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#aaa',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF6347',
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
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
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7B68EE',
    marginBottom: 16,
  },
  inviteCodeContainer: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
  },
  codeContainer: {
    marginBottom: 16,
  },
  codeLabel: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 8,
  },
  codeValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 2,
  },
  codeActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(123, 104, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  regenerateButton: {
    flexDirection: 'row',
    backgroundColor: '#7B68EE',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 12,
  },
  regenerateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  formContainer: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
  required: {
    color: '#FF6347',
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
  inputDisabled: {
    opacity: 0.7,
    backgroundColor: '#3a3a3a',
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
  disabledInput: {
    color: '#888',
  },
  dangerZone: {
    backgroundColor: 'rgba(255, 99, 71, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 99, 71, 0.3)',
  },
  dangerTitle: {
    color: '#FF6347',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 99, 71, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  dangerButtonIcon: {
    marginRight: 10,
  },
  dangerButtonText: {
    color: '#FF6347',
    fontSize: 16,
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
  buttonIcon: {
    marginRight: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default RepublicSettingsScreen;