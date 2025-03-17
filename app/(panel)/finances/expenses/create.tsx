// app/(panel)/finances/expenses/create.tsx
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
  Platform,
  Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as ImagePicker from 'expo-image-picker';
import { useFinances } from '../../../../src/hooks/useFinances';
import { useAuth } from '../../../../src/context/AuthContext';
import { CreateExpenseRequest, ExpenseFormData } from '../../../../src/models/finances.model';

// Expense categories
const expenseCategories = [
  'Alimentação',
  'Aluguel',
  'Contas',
  'Manutenção',
  'Limpeza',
  'Eventos',
  'Outros'
];

// Category selector component
const CategorySelector = ({ 
  categories,
  selectedCategory,
  onSelectCategory,
  visible,
  onClose
}: {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  visible: boolean;
  onClose: () => void;
}) => {
  if (!visible) return null;
  
  return (
    <View style={styles.categoryPicker}>
      {categories.map((category) => (
        <TouchableOpacity
          key={category}
          style={[
            styles.categoryOption,
            selectedCategory === category && styles.selectedCategoryOption
          ]}
          onPress={() => {
            onSelectCategory(category);
            onClose();
          }}
        >
          <Text style={[
            styles.categoryOptionText,
            selectedCategory === category && styles.selectedCategoryOptionText
          ]}>
            {category}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Receipt selector component
const ReceiptSelector = ({
  receiptUrl,
  onSelectImage,
  onTakePhoto,
  onRemoveImage,
  uploading
}: {
  receiptUrl?: string;
  onSelectImage: () => void;
  onTakePhoto: () => void;
  onRemoveImage: () => void;
  uploading: boolean;
}) => {
  if (receiptUrl) {
    return (
      <View style={styles.receiptContainer}>
        <Image
          source={{ uri: receiptUrl }}
          style={styles.receiptImage}
          resizeMode="cover"
        />
        
        <TouchableOpacity
          style={styles.removeReceiptButton}
          onPress={onRemoveImage}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.receiptActions}>
      <TouchableOpacity
        style={styles.receiptActionButton}
        onPress={onSelectImage}
        disabled={uploading}
      >
        {uploading ? (
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
        onPress={onTakePhoto}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="camera-outline" size={20} color="#fff" style={styles.receiptActionIcon} />
            <Text style={styles.receiptActionText}>Câmera</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const CreateExpenseScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const { createExpense, updateExpense, getExpenseById } = useFinances();
  
  // Form state
  const [formData, setFormData] = useState<ExpenseFormData>({
    description: '',
    amount: '',
    date: new Date().toISOString(),
    category: expenseCategories[0],
    notes: ''
  });
  
  // UI state
  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(undefined);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingExpense, setLoadingExpense] = useState(false);

  // Fetch expense details if editing
  useEffect(() => {
    const fetchExpenseDetails = async () => {
      if (params.id) {
        setIsEditing(true);
        setLoadingExpense(true);
        
        try {
          const expense = await getExpenseById(Number(params.id));
          
          setFormData({
            description: expense.description,
            amount: expense.amount.toString(),
            date: expense.expenseDate,
            category: expense.category || expenseCategories[0],
            notes: expense.notes || ''
          });
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
  }, [params.id, getExpenseById, router]);
  
  // Handle form field changes
  const handleChange = (field: keyof ExpenseFormData, value: string | number | Date) => {
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

  // Image handling functions
  const checkPermission = async (permissionType: 'camera' | 'mediaLibrary'): Promise<boolean> => {
    try {
      let permissionResult;
      
      if (permissionType === 'camera') {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permissão Negada', 
          `Precisamos de permissão para acessar sua ${permissionType === 'camera' ? 'câmera' : 'galeria'}.`,
          [{ text: 'OK' }]
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Erro ao solicitar permissão de ${permissionType}:`, error);
      return false;
    }
  };

  const uploadImage = async (uri: string) => {
    // In a real app, you would implement an actual upload to your server/storage
    // For now, we'll simulate an upload
    setUploadingImage(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set the receipt URL to the local URI
      // In a real app, this would be the URL returned by your server
      setReceiptUrl(uri);
      
      return uri;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      Alert.alert('Erro', 'Falha ao fazer upload da imagem. Tente novamente.');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const pickImage = async () => {
    const hasPermission = await checkPermission('mediaLibrary');
    if (!hasPermission) return;
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0].uri) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const takePhoto = async () => {
    const hasPermission = await checkPermission('camera');
    if (!hasPermission) return;
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0].uri) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto.');
    }
  };

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
            setReceiptUrl(undefined);
          }
        }
      ]
    );
  };

  // Form validation
  const validateForm = (): boolean => {
    if (!formData.description.trim()) {
      Alert.alert('Erro', 'Por favor, informe uma descrição para a despesa.');
      return false;
    }
    
    const amountValue = parseInt(formData.amount.toString(), 10);
    if (!formData.amount || amountValue === 0) {
      Alert.alert('Erro', 'Por favor, informe um valor válido para a despesa.');
      return false;
    }
    
    if (!formData.category) {
      Alert.alert('Erro', 'Por favor, selecione uma categoria para a despesa.');
      return false;
    }
    
    return true;
  };

  // Save expense
  const handleSaveExpense = async () => {
    if (!validateForm() || !user?.currentRepublicId) return;
    
    setLoading(true);
    
    try {
      const expenseData: CreateExpenseRequest = {
        description: formData.description,
        amount: parseInt(formData.amount.toString(), 10) / 100,
        expenseDate: formData.date,
        category: formData.category,
        receiptUrl,
        republicId: user.currentRepublicId,
        notes: formData.notes
      };
      
      if (isEditing && params.id) {
        await updateExpense(Number(params.id), expenseData);
        Alert.alert(
          'Sucesso', 
          'Despesa atualizada com sucesso!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        await createExpense(expenseData);
        Alert.alert(
          'Sucesso', 
          'Despesa cadastrada com sucesso!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      Alert.alert(
        'Erro', 
        'Ocorreu um erro ao salvar a despesa. Por favor, tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Loading state
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
          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Descrição</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Descreva a despesa"
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
          
          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Categoria</Text>
            <TouchableOpacity
              style={styles.categoryButton}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text style={styles.categoryText}>{formData.category}</Text>
              <Ionicons
                name={showCategoryPicker ? "chevron-up" : "chevron-down"}
                size={20}
                color="#7B68EE"
              />
            </TouchableOpacity>
            
            <CategorySelector
              categories={expenseCategories}
              selectedCategory={formData.category}
              onSelectCategory={(category) => handleChange('category', category)}
              visible={showCategoryPicker}
              onClose={() => setShowCategoryPicker(false)}
            />
          </View>
          
          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Observações (opcional)</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              placeholder="Adicione informações adicionais sobre a despesa"
              placeholderTextColor="#999"
              value={formData.notes}
              onChangeText={(text) => handleChange('notes', text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          {/* Receipt */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Comprovante (opcional)</Text>
            
            <ReceiptSelector
              receiptUrl={receiptUrl}
              onSelectImage={pickImage}
              onTakePhoto={takePhoto}
              onRemoveImage={removeImage}
              uploading={uploadingImage}
            />
          </View>
          
          {/* Save button */}
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