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
interface AddressResponse {
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  fullAddress: string;
}

interface Republic {
  id: string;
  name: string;
  code: string;
  address: AddressResponse;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
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
  const [customCode, setCustomCode] = useState<string>('');
  const [showCustomCodeInput, setShowCustomCodeInput] = useState<boolean>(false);
  const [codeLength, setCodeLength] = useState<number>(6); // Valor padrão, será atualizado com a API
  const [customCodeFocused, setCustomCodeFocused] = useState<boolean>(false);
  const [republicMembers, setRepublicMembers] = useState<any[]>([]);
  
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
  const isOwner = user?.uid === republic?.ownerId;
  
  // Buscar membros da república para verificar se o usuário é admin
  useEffect(() => {
    const fetchRepublicMembers = async () => {
      if (!user?.currentRepublicId) return;
      
      try {
        const response = await api.get(`/api/v1/republics/${user.currentRepublicId}/members`);
        setRepublicMembers(response.data);
      } catch (error) {
        console.error('Erro ao buscar membros:', error);
      }
    };
    
    fetchRepublicMembers();
  }, [user?.currentRepublicId]);
  
  // Verificar se o usuário é admin da república
  const isUserAdmin = republicMembers.some(m => m.uid === user?.uid && m.isAdmin);
  
  // Função para obter o tamanho necessário do código
  useEffect(() => {
    const fetchCodeLength = async () => {
      try {
        const response = await api.get('/api/v1/republics/code-length');
        if (response.data && response.data.codeLength) {
          setCodeLength(response.data.codeLength);
        }
      } catch (error) {
        console.error('Erro ao obter o tamanho do código:', error);
      }
    };

    fetchCodeLength();
  }, []);

  const handleRegenerateCode = async () => {
    if (!isOwner && !isUserAdmin) {
      Alert.alert('Erro', 'Apenas o dono ou administradores podem gerar novos códigos');
      return;
    }
    
    // Se estiver mostrando o input de código personalizado, esconde
    if (showCustomCodeInput) {
      setShowCustomCodeInput(false);
      setCustomCode('');
      return;
    }

    Alert.alert(
      'Regenerar Código',
      'Você deseja gerar um código aleatório ou criar um código personalizado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Personalizado', 
          onPress: () => {
            setShowCustomCodeInput(true);
          }
        },
        {
          text: 'Aleatório',
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

  const handleGenerateCustomCode = async () => {
    if (!customCode) {
      Alert.alert('Erro', 'Por favor, digite um código personalizado.');
      return;
    }

    if (customCode.length !== codeLength) {
      Alert.alert('Erro', `O código deve ter exatamente ${codeLength} caracteres.`);
      return;
    }

    try {
      setRegeneratingCode(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const response = await api.post<{ code: string }>(`/api/v1/republics/${republic?.id}/regenerate-code`, {
        customCode: customCode
      });
      
      if (response.data?.code) {
        setRepublic(prev => prev ? {
          ...prev,
          code: response.data.code
        } : null);
        
        Alert.alert('Sucesso', 'Novo código de convite personalizado gerado com sucesso!');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setShowCustomCodeInput(false);
      setCustomCode('');
    } catch (error) {
      ErrorHandler.handle(error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setRegeneratingCode(false);
    }
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
        
        console.log('Dados da república recebidos:', JSON.stringify(republicData, null, 2));
        
        setRepublic(republicData);
        
        // Set form values with null coalescing
        setName(republicData.name ?? '');
        
        // Acessando os dados de endereço a partir da nova estrutura
        if (republicData.address) {
          console.log('Dados de endereço encontrados:', republicData.address);
          setStreet(republicData.address.street ?? '');
          setNumber(republicData.address.number ?? '');
          setComplement(republicData.address.complement ?? '');
          setNeighborhood(republicData.address.neighborhood ?? '');
          setCity(republicData.address.city ?? '');
          setState(republicData.address.state ?? '');
          setZipCode(republicData.address.zipCode ?? '');
        } else {
          console.error('Dados de endereço não encontrados na resposta:', republicData);
        }
        
      } catch (error) {
        console.error('Erro ao buscar dados da república:', error);
        const parsedError = await ErrorHandler.parseError(error);
        setError(parsedError.message);
        ErrorHandler.handle(error);
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
        address: {
          street,
          number,
          complement: complement || null,
          neighborhood,
          city,
          state,
          zipCode
        }
      };
      
      console.log('Enviando dados para atualização:', JSON.stringify(republicData, null, 2));
      
      const response = await api.put<Republic>(`/api/v1/republics/${republic?.id}`, republicData);
      
      console.log('Resposta da atualização:', JSON.stringify(response.data, null, 2));
      
      if (response.data) {
        setRepublic(response.data);
        
        // Atualizando os campos com os dados da resposta para garantir consistência
        setName(response.data.name);
        if (response.data.address) {
          setStreet(response.data.address.street ?? '');
          setNumber(response.data.address.number ?? '');
          setComplement(response.data.address.complement ?? '');
          setNeighborhood(response.data.address.neighborhood ?? '');
          setCity(response.data.address.city ?? '');
          setState(response.data.address.state ?? '');
          setZipCode(response.data.address.zipCode ?? '');
        }
        
        Alert.alert('Sucesso', 'Informações da república atualizadas com sucesso!');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
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
          </View>
        ) : (
          <ScrollView style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Configurações da República</Text>
              <Text style={styles.subtitle}>Gerencie informações e configurações da sua república</Text>
            </View>
            
            {/* Seção de código de convite */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Código de Convite</Text>
              
              <View style={styles.inviteCodeContainer}>
                <View style={styles.codeContainer}>
                  <Text style={styles.codeLabel}>Compartilhe este código para convidar novos membros:</Text>
                  <Text style={styles.codeValue}>{republic?.code}</Text>
                  
                  {/* Custom Code Input (quando ativado) */}
                  {showCustomCodeInput && (
                    <View style={styles.customCodeContainer}>
                      <Text style={styles.customCodeLabel}>Digite um código personalizado:</Text>
                      <View style={[
                        styles.customCodeInputContainer,
                        customCodeFocused && styles.inputFocused
                      ]}>
                        <TextInput
                          style={styles.customCodeInput}
                          value={customCode}
                          onChangeText={text => setCustomCode(text.toUpperCase())}
                          placeholder={`${codeLength} caracteres`}
                          placeholderTextColor="#aaa"
                          maxLength={codeLength}
                          autoCapitalize="characters"
                          onFocus={() => setCustomCodeFocused(true)}
                          onBlur={() => setCustomCodeFocused(false)}
                          autoFocus={true}
                        />
                      </View>
                      
                      <View style={styles.customCodeActions}>
                        <TouchableOpacity
                          style={[
                            styles.customCodeButton, 
                            customCode.length !== codeLength ? styles.disabledButton : styles.confirmButton
                          ]}
                          onPress={handleGenerateCustomCode}
                          disabled={customCode.length !== codeLength}
                        >
                          <Text style={styles.customCodeButtonText}>
                            {customCode.length === codeLength ? 'Confirmar' : `Mais ${codeLength - customCode.length} caracteres`}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  
                  <View style={styles.codeActions}>
                    <TouchableOpacity style={styles.codeActionButton} onPress={handleCopyCode}>
                      <Ionicons name="copy-outline" size={24} color="#7B68EE" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.codeActionButton} onPress={handleShareCode}>
                      <Ionicons name="share-social-outline" size={24} color="#7B68EE" />
                    </TouchableOpacity>
                    
                    {(isOwner || isUserAdmin) && (
                      <TouchableOpacity
                        style={styles.regenerateButton}
                        onPress={handleRegenerateCode}
                        disabled={regeneratingCode}
                      >
                        {regeneratingCode ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons 
                              name={showCustomCodeInput ? "close" : "refresh"} 
                              size={20} 
                              color="#fff" 
                              style={{ marginRight: 8 }} 
                            />
                            <Text style={styles.regenerateButtonText}>
                              {showCustomCodeInput ? "Cancelar" : "Gerar Novo Código"}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>
            
            {/* Seção de informações da república */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informações da República</Text>
              
              <View style={styles.formContainer}>
                <FormInput
                  label="Nome da República"
                  value={name}
                  onChangeText={setName}
                  placeholder="Digite o nome da república"
                  icon="home"
                  isFocused={nameFocused}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  disabled={!isOwner}
                  required={true}
                />
                
                <FormInput
                  label="Rua"
                  value={street}
                  onChangeText={setStreet}
                  placeholder="Digite o nome da rua"
                  icon="map"
                  isFocused={streetFocused}
                  onFocus={() => setStreetFocused(true)}
                  onBlur={() => setStreetFocused(false)}
                  disabled={!isOwner}
                  required={true}
                />
                
                <View style={styles.rowContainer}>
                  <View style={styles.rowItem}>
                    <FormInput
                      label="Número"
                      value={number}
                      onChangeText={setNumber}
                      placeholder="Número"
                      icon="business"
                      isFocused={numberFocused}
                      onFocus={() => setNumberFocused(true)}
                      onBlur={() => setNumberFocused(false)}
                      disabled={!isOwner}
                      keyboardType="number-pad"
                      required={true}
                    />
                  </View>
                  
                  <View style={styles.rowItem}>
                    <FormInput
                      label="Complemento"
                      value={complement}
                      onChangeText={setComplement}
                      placeholder="Complemento"
                      icon="ellipsis-horizontal"
                      isFocused={complementFocused}
                      onFocus={() => setComplementFocused(true)}
                      onBlur={() => setComplementFocused(false)}
                      disabled={!isOwner}
                    />
                  </View>
                </View>
                
                <FormInput
                  label="Bairro"
                  value={neighborhood}
                  onChangeText={setNeighborhood}
                  placeholder="Digite o bairro"
                  icon="location"
                  isFocused={neighborhoodFocused}
                  onFocus={() => setNeighborhoodFocused(true)}
                  onBlur={() => setNeighborhoodFocused(false)}
                  disabled={!isOwner}
                  required={true}
                />
                
                <View style={styles.rowContainer}>
                  <View style={styles.rowItem}>
                    <FormInput
                      label="Cidade"
                      value={city}
                      onChangeText={setCity}
                      placeholder="Cidade"
                      icon="business"
                      isFocused={cityFocused}
                      onFocus={() => setCityFocused(true)}
                      onBlur={() => setCityFocused(false)}
                      disabled={!isOwner}
                      required={true}
                    />
                  </View>
                  
                  <View style={styles.rowItem}>
                    <FormInput
                      label="Estado"
                      value={state}
                      onChangeText={setState}
                      placeholder="UF"
                      icon="flag"
                      isFocused={stateFocused}
                      onFocus={() => setStateFocused(true)}
                      onBlur={() => setStateFocused(false)}
                      disabled={!isOwner}
                      maxLength={2}
                      required={true}
                    />
                  </View>
                </View>
                
                <FormInput
                  label="CEP"
                  value={zipCode}
                  onChangeText={setZipCode}
                  placeholder="Digite o CEP"
                  icon="mail"
                  isFocused={zipCodeFocused}
                  onFocus={() => setZipCodeFocused(true)}
                  onBlur={() => setZipCodeFocused(false)}
                  disabled={!isOwner}
                  keyboardType="number-pad"
                  maxLength={9}
                  required={true}
                />
              </View>
            </View>
            
            {/* Botão de salvar */}
            {isOwner && (
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.buttonDisabled]}
                onPress={handleSaveChanges}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="save" size={20} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.saveButtonText}>Salvar Alterações</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
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
  },
  customCodeContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  customCodeLabel: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 8,
  },
  customCodeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#444',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
  },
  customCodeInput: {
    flex: 1,
    paddingVertical: 12,
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  customCodeActions: {
    marginTop: 12,
  },
  customCodeButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  confirmButton: {
    backgroundColor: '#7B68EE',
  },
  disabledButton: {
    backgroundColor: '#555',
    opacity: 0.5,
  },
  customCodeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default RepublicSettingsScreen;