// app/(panel)/finances/incomes/create.tsx
import React, { useState, useEffect } from 'react';
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
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinances } from '../../../../src/hooks/useFinances';
import { useAuth } from '../../../../src/context/AuthContext';
import { CreateIncomeRequest } from '../../../../src/models/income.model';

const incomeSources = [
  'Contribuição',
  'Reembolso',
  'Evento',
  'Outros'
];

const CreateIncomeScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const { createIncome, updateIncome, getIncomeById } = useFinances();
  
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState(incomeSources[0]);
  const [incomeDate, setIncomeDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [loadingIncome, setLoadingIncome] = useState(false);
  const [showSourcePicker, setShowSourcePicker] = useState(false);

  // Se existir um ID, então estamos editando
  useEffect(() => {
    const fetchIncomeDetails = async () => {
      if (params.id) {
        setIsEditing(true);
        setLoadingIncome(true);
        
        try {
          // Buscar os detalhes da receita pelo ID
          const income = await getIncomeById(Number(params.id));
          
          // Preencher o formulário com os dados da receita
          setDescription(income.description);
          // Multiplicar por 100 para exibir em centavos (formatação da moeda)
          setAmount((income.amount * 100).toString());
          setSource(income.source || incomeSources[0]);
          setIncomeDate(parseISO(income.incomeDate));
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
  }, [params.id, getIncomeById]);

  // Formatar valor monetário para exibição
  const formatCurrency = (value: string) => {
    // Remove tudo que não for número
    let numberValue = value.replace(/\D/g, '');
    
    // Converte para float (dividindo por 100 para tratar como centavos)
    const floatValue = parseInt(numberValue || '0', 10) / 100;
    
    // Formata como moeda brasileira
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(floatValue);
  };

  // Manipular a entrada de valor
  const handleAmountChange = (text: string) => {
    // Mantém apenas os números
    const numericValue = text.replace(/\D/g, '');
    setAmount(numericValue);
  };

  // Mostrar o valor formatado
  const getFormattedAmount = () => {
    if (!amount) return '';
    
    const numericValue = parseInt(amount, 10) / 100;
    return formatCurrency(numericValue.toString());
  };

  // Validar formulário
  const validateForm = () => {
    if (!description.trim()) {
      Alert.alert('Erro', 'Por favor, informe uma descrição para a receita.');
      return false;
    }
    
    if (!amount || parseInt(amount, 10) === 0) {
      Alert.alert('Erro', 'Por favor, informe um valor válido para a receita.');
      return false;
    }
    
    if (!source) {
      Alert.alert('Erro', 'Por favor, selecione uma fonte para a receita.');
      return false;
    }
    
    return true;
  };

  // Salvar receita
  const handleSaveIncome = async () => {
    if (!validateForm() || !user?.currentRepublicId) return;
    
    setLoading(true);
    
    try {
      const incomeData: CreateIncomeRequest = {
        description,
        amount: parseInt(amount, 10) / 100,
        incomeDate: incomeDate.toISOString(),
        source,
        republicId: user.currentRepublicId
      };
      
      if (isEditing && params.id) {
        await updateIncome(Number(params.id), incomeData);
        Alert.alert('Sucesso', 'Receita atualizada com sucesso!');
      } else {
        await createIncome(incomeData);
        Alert.alert('Sucesso', 'Receita cadastrada com sucesso!');
      }
      
      router.back();
    } catch (error) {
      console.error('Erro ao salvar receita:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar a receita. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Lidar com a mudança de data
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    
    if (selectedDate) {
      setIncomeDate(selectedDate);
    }
  };

  // Renderizar o seletor de fonte
  const renderSourcePicker = () => {
    if (!showSourcePicker) return null;
    
    return (
      <View style={styles.sourcePicker}>
        {incomeSources.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.sourceOption,
              source === item && styles.selectedSourceOption
            ]}
            onPress={() => {
              setSource(item);
              setShowSourcePicker(false);
            }}
          >
            <Text style={[
              styles.sourceOptionText,
              source === item && styles.selectedSourceOptionText
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

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
          {/* Descrição */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Descrição</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Descreva a receita"
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={100}
            />
          </View>
          
          {/* Valor */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Valor</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>R$</Text>
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
          
          {/* Data */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Data</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#7B68EE" />
              <Text style={styles.dateText}>
                {format(incomeDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={incomeDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>
          
          {/* Fonte */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Fonte</Text>
            <TouchableOpacity
              style={styles.sourceButton}
              onPress={() => setShowSourcePicker(!showSourcePicker)}
            >
              <Text style={styles.sourceText}>{source}</Text>
              <Ionicons
                name={showSourcePicker ? "chevron-up" : "chevron-down"}
                size={20}
                color="#7B68EE"
              />
            </TouchableOpacity>
            
            {renderSourcePicker()}
          </View>
          
          {/* Botão de salvar */}
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