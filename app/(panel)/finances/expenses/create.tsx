// app/(panel)/finances/expenses/create.tsx
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
  Platform,
  Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as ImagePicker from 'expo-image-picker';
import { useFinances } from '../../../../src/hooks/useFinances';
import { useAuth } from '../../../../src/context/AuthContext';
import { CreateExpenseRequest } from '../../../../src/models/expense.model';

const expenseCategories = [
  'Alimentação',
  'Aluguel',
  'Contas',
  'Manutenção',
  'Limpeza',
  'Eventos',
  'Outros'
];

const CreateExpenseScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const { createExpense, updateExpense, getExpenseById } = useFinances();
  
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(expenseCategories[0]);
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(undefined);
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingExpense, setLoadingExpense] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Se existir um ID, então estamos editando
  useEffect(() => {
    const fetchExpenseDetails = async () => {
      if (params.id) {
        setIsEditing(true);
        setLoadingExpense(true);
        
        try {
          const expense = await getExpenseById(Number(params.id));
          
          setDescription(expense.description);
          setAmount((expense.amount * 100).toString());
          setCategory(expense.category || expenseCategories[0]);
          setExpenseDate(parseISO(expense.expenseDate));
          setReceiptUrl(expense.receiptUrl);
          
        } catch (error) {
          console.error('Erro ao carregar detalhes da despesa:', error);
          Alert.alert('Erro', 'Não foi possível carregar os detalhes da despesa.');
          router.back();
        } finally {
          setLoadingExpense(false);
        }
      }
    };

    fetchExpenseDetails();
  }, [params.id]);

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
      Alert.alert('Erro', 'Por favor, informe uma descrição para a despesa.');
      return false;
    }
    
    if (!amount || parseInt(amount, 10) === 0) {
      Alert.alert('Erro', 'Por favor, informe um valor válido para a despesa.');
      return false;
    }
    
    if (!category) {
      Alert.alert('Erro', 'Por favor, selecione uma categoria para a despesa.');
      return false;
    }
    
    return true;
  };

  // Selecionar imagem da galeria
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permissão Negada', 'Precisamos de permissão para acessar suas fotos.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setReceiptImage(result.assets[0].uri);
        // Aqui você implementaria o upload da imagem para seu servidor
        // e então atualizaria o receiptUrl com a URL retornada
        
        // Simulando upload
        setUploadingImage(true);
        setTimeout(() => {
          setReceiptUrl(result.assets[0].uri);
          setUploadingImage(false);
        }, 1500);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  // Tirar foto
  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permissão Negada', 'Precisamos de permissão para acessar sua câmera.');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setReceiptImage(result.assets[0].uri);
        // Aqui você implementaria o upload da imagem para seu servidor
        // e então atualizaria o receiptUrl com a URL retornada
        
        // Simulando upload
        setUploadingImage(true);
        setTimeout(() => {
          setReceiptUrl(result.assets[0].uri);
          setUploadingImage(false);
        }, 1500);
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto.');
    }
  };

  // Remover imagem
  const removeImage = () => {
    Alert.alert(
      'Remover Comprovante',
      'Tem certeza que deseja remover o comprovante?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: () => {
            setReceiptImage(undefined);
            setReceiptUrl(undefined);
          }
        }
      ]
    );
  };

  // Salvar despesa
  const handleSaveExpense = async () => {
    if (!validateForm() || !user?.currentRepublicId) return;
    
    setLoading(true);
    
    try {
      const expenseData: CreateExpenseRequest = {
        description,
        amount: parseInt(amount, 10) / 100,
        expenseDate: expenseDate.toISOString(),
        category,
        receiptUrl,
        republicId: user.currentRepublicId
      };
      
      if (isEditing && params.id) {
        await updateExpense(Number(params.id), expenseData);
        Alert.alert('Sucesso', 'Despesa atualizada com sucesso!');
      } else {
        await createExpense(expenseData);
        Alert.alert('Sucesso', 'Despesa cadastrada com sucesso!');
      }
      
      router.back();
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar a despesa. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Lidar com a mudança de data
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    
    if (selectedDate) {
      setExpenseDate(selectedDate);
    }
  };

  // Renderizar o seletor de categoria
  const renderCategoryPicker = () => {
    if (!showCategoryPicker) return null;
    
    return (
      <View style={styles.categoryPicker}>
        {expenseCategories.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.categoryOption,
              category === item && styles.selectedCategoryOption
            ]}
            onPress={() => {
              setCategory(item);
              setShowCategoryPicker(false);
            }}
          >
            <Text style={[
              styles.categoryOptionText,
              category === item && styles.selectedCategoryOptionText
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loadingExpense) {
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
            {isEditing ? 'Editar Despesa' : 'Nova Despesa'}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        
        <ScrollView style={styles.formContainer}>
          {/* Descrição */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Descrição</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Descreva a despesa"
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
                {format(expenseDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={expenseDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>
          
          {/* Categoria */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Categoria</Text>
            <TouchableOpacity
              style={styles.categoryButton}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text style={styles.categoryText}>{category}</Text>
              <Ionicons
                name={showCategoryPicker ? "chevron-up" : "chevron-down"}
                size={20}
                color="#7B68EE"
              />
            </TouchableOpacity>
            
            {renderCategoryPicker()}
          </View>
          
          {/* Comprovante */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Comprovante</Text>
            
            {receiptUrl ? (
              <View style={styles.receiptContainer}>
                <Image
                  source={{ uri: receiptUrl }}
                  style={styles.receiptImage}
                  resizeMode="cover"
                />
                
                <TouchableOpacity
                  style={styles.removeReceiptButton}
                  onPress={removeImage}
                >
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.receiptActions}>
                <TouchableOpacity
                  style={styles.receiptActionButton}
                  onPress={pickImage}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="image-outline" size={20} color="#fff" style={styles.receiptActionIcon} />
                      <Text style={styles.receiptActionText}>Galeria</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.receiptActionButton}
                  onPress={takePhoto}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={20} color="#fff" style={styles.receiptActionIcon} />
                      <Text style={styles.receiptActionText}>Câmera</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* Botão de salvar */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={handleSaveExpense}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" style={styles.saveButtonIcon} />
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Atualizar Despesa' : 'Registrar Despesa'}
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
    color: '#FF6347',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 5,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    color: '#FF6347',
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
  categoryButton: {
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
  categoryText: {
    color: '#fff',
    fontSize: 16,
  },
  categoryPicker: {
    backgroundColor: '#333',
    borderRadius: 8,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#444',
  },
  categoryOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  selectedCategoryOption: {
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
  },
  categoryOptionText: {
    color: '#fff',
    fontSize: 16,
  },
  selectedCategoryOptionText: {
    color: '#7B68EE',
    fontWeight: 'bold',
  },
  receiptContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    height: 200,
    backgroundColor: '#333',
  },
  receiptImage: {
    width: '100%',
    height: '100%',
  },
  removeReceiptButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 99, 71, 0.8)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  receiptActionButton: {
    flex: 1,
    backgroundColor: '#7B68EE',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  receiptActionIcon: {
    marginRight: 8,
  },
  receiptActionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#FF6347',
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

export default CreateExpenseScreen;