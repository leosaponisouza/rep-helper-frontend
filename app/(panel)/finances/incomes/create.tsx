// app/(panel)/finances/incomes/create.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinances } from '../../../../src/hooks/useFinances';
import { useAuth } from '../../../../src/context/AuthContext';
import { CreateIncomeRequest, IncomeFormData } from '../../../../src/models/finances.model';

// Income source options
const incomeSources = [
  'Contribuição',
  'Reembolso',
  'Evento',
  'Outros'
];

// Source selector component
const SourceSelector = ({ 
  sources,
  selectedSource,
  onSelectSource,
  visible,
  onClose
}: {
  sources: string[];
  selectedSource: string;
  onSelectSource: (source: string) => void;
  visible: boolean;
  onClose: () => void;
}) => {
  if (!visible) return null;
  
  return (
    <View style={styles.sourcePicker}>
      {sources.map((source) => (
        <TouchableOpacity
          key={source}
          style={[
            styles.sourceOption,
            selectedSource === source && styles.selectedSourceOption
          ]}
          onPress={() => {
            onSelectSource(source);
            onClose();
          }}
        >
          <Text style={[
            styles.sourceOptionText,
            selectedSource === source && styles.selectedSourceOptionText
          ]}>
            {source}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const CreateIncomeScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const { createIncome, updateIncome, getIncomeById } = useFinances();
  
  // Form state
  const [formData, setFormData] = useState<IncomeFormData>({
    description: '',
    amount: '',
    date: new Date().toISOString(),
    source: incomeSources[0],
    notes: ''
  });
  
  // UI state
  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingIncome, setLoadingIncome] = useState(false);

  // Fetch income details if editing
  useEffect(() => {
    const fetchIncomeDetails = async () => {
      if (params.id) {
        setIsEditing(true);
        setLoadingIncome(true);
        
        try {
          // Get income details by ID
          const income = await getIncomeById(Number(params.id));
          
          // Set form data from income
          setFormData({
            description: income.description,
            amount: income.amount.toString(),
            date: income.incomeDate,
            source: income.source || incomeSources[0],
            notes: income.notes || ''
          });
        } catch (error) {
          console.error('Erro ao carregar detalhes da receita:', error);
          Alert.alert('Erro', 'Não foi possível carregar os detalhes da receita.');
          router.back();
        } finally {
          setLoadingIncome(false);
        }
      }
    };

    fetchIncomeDetails();
  }, [params.id, getIncomeById, router]);
  
  // Handle form field changes
  const handleChange = (field: keyof IncomeFormData, value: string | number | Date) => {
    if (field === 'date' && value instanceof Date) {
      setFormData(prev => ({ ...prev, [field]: value.toISOString() }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Handle amount input
  const handleAmountChange = (text: string) => {
    // Keep only numbers
    const numericValue = text.replace(/\D/g, '');
    handleChange('amount', numericValue);
  };

  // Format amount for display
  const getFormattedAmount = () => {
    if (!formData.amount) return '';
    
    // Convert to number
    const numericValue = parseInt(formData.amount.toString(), 10) / 100;
    
    // Format as BRL currency
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numericValue);
  };

  // Date handling
  const getFormattedDate = () => {
    try {
      const date = new Date(formData.date);
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    
    if (selectedDate) {
      handleChange('date', selectedDate);
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    if (!formData.description.trim()) {
      Alert.alert('Erro', 'Por favor, informe uma descrição para a receita.');
      return false;
    }
    
    const amountValue = parseInt(formData.amount.toString(), 10);
    if (!formData.amount || amountValue === 0) {
      Alert.alert('Erro', 'Por favor, informe um valor válido para a receita.');
      return false;
    }
    
    if (!formData.source) {
      Alert.alert('Erro', 'Por favor, selecione uma fonte para a receita.');
      return false;
    }
    
    return true;
  };

  // Save income
  const handleSaveIncome = async () => {
    if (!validateForm() || !user?.currentRepublicId) return;
    
    setLoading(true);
    
    try {
      const incomeData: CreateIncomeRequest = {
        description: formData.description,
        amount: parseInt(formData.amount.toString(), 10) / 100,
        incomeDate: formData.date,
        source: formData.source,
        republicId: user.currentRepublicId,
        notes: formData.notes
      };
      
      if (isEditing && params.id) {
        await updateIncome(Number(params.id), incomeData);
        Alert.alert(
          'Sucesso', 
          'Receita atualizada com sucesso!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        await createIncome(incomeData);
        Alert.alert(
          'Sucesso', 
          'Receita cadastrada com sucesso!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('Erro ao salvar receita:', error);
      Alert.alert(
        'Erro', 
        'Ocorreu um erro ao salvar a receita. Por favor, tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loadingIncome) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#222" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B68EE" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#7B68EE" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Editar Receita' : 'Nova Receita'}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        
        <ScrollView style={styles.formContainer}>
          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Descrição</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Descreva a receita"
              placeholderTextColor="#999"
              value={formData.description}
              onChangeText={(text) => handleChange('description', text)}
              multiline
              maxLength={100}
            />
          </View>
          
          {/* Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Valor</Text>
            <View style={styles.amountInputContainer}>
              <TextInput
                style={styles.amountInput}
                placeholder="0,00"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={getFormattedAmount()}
                onChangeText={handleAmountChange}
              />
            </View>
          </View>
          
          {/* Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Data</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#7B68EE" />
              <Text style={styles.dateText}>{getFormattedDate()}</Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={new Date(formData.date)}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>
          
          {/* Source */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Fonte</Text>
            <TouchableOpacity
              style={styles.sourceButton}
              onPress={() => setShowSourcePicker(!showSourcePicker)}
            >
              <Text style={styles.sourceText}>{formData.source}</Text>
              <Ionicons
                name={showSourcePicker ? "chevron-up" : "chevron-down"}
                size={20}
                color="#7B68EE"
              />
            </TouchableOpacity>
            
            <SourceSelector
              sources={incomeSources}
              selectedSource={formData.source}
              onSelectSource={(source) => handleChange('source', source)}
              visible={showSourcePicker}
              onClose={() => setShowSourcePicker(false)}
            />
          </View>
          
          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Observações (opcional)</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              placeholder="Adicione informações adicionais sobre a receita"
              placeholderTextColor="#999"
              value={formData.notes}
              onChangeText={(text) => handleChange('notes', text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={handleSaveIncome}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" style={styles.saveButtonIcon} />
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Atualizar Receita' : 'Registrar Receita'}
                </Text>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#ccc',
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  notesInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#444',
  },
  currencySymbol: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 5,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  dateText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  sourceButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  sourceText: {
    color: '#fff',
    fontSize: 16,
  },
  sourcePicker: {
    backgroundColor: '#333',
    borderRadius: 8,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#444',
  },
  sourceOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  selectedSourceOption: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  sourceOptionText: {
    color: '#fff',
    fontSize: 16,
  },
  selectedSourceOptionText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 15,
    marginTop: 20,
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  saveButtonIcon: {
    marginRight: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default CreateIncomeScreen;