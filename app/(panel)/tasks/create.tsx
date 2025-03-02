// app/(panel)/tasks/create.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../../src/services/api';
import { ErrorHandler } from '../../../src/utils/errorHandling';
import { useAuth } from '../../../src/context/AuthContext';
import { useTasks } from '../../../src/hooks/useTasks';

// Common categories that users might want to use
const COMMON_CATEGORIES = [
  'Limpeza', 
  'Compras', 
  'Manutenção', 
  'Contas', 
  'Alimentação',
  'Outros'
];

// Enhanced schema to match backend expectations
const taskSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  category: z.string().optional(),
});

const CreateTaskScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<{uid: string, name: string, email: string, profilePictureUrl?: string}[]>([]);
  const [isUserModalVisible, setUserModalVisible] = useState(false);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { createTask, assignMultipleUsers } = useTasks();

  const { 
    control, 
    handleSubmit, 
    formState: { errors }, 
    setValue, 
    watch,
    reset
  } = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: undefined,
      category: ''
    }
  });
  useEffect(() => {
    return () => {
      // Limpar o formulário quando a tela for desmontada
      reset({
        title: '',
        description: '',
        dueDate: undefined,
        category: ''
      });
      setSelectedUsers([]);
      // Limpar quaisquer outros estados relevantes
    };
  }, [reset]);
  // Fetch republic users
  useEffect(() => {
    const fetchRepublicUsers = async () => {
      try {
        if (user?.currentRepublicId) {
          const republicId = user.currentRepublicId;
          const response = await api.get(`/api/v1/republics/${republicId}/members`);
          setAvailableUsers(response.data);
          
          // Auto-select current user
          if (user.uid) {
            setSelectedUsers([user.uid]);
          }
        } else {
          console.warn("current_republic_id não encontrado para o usuário.");
        }
      } catch (error) {
        ErrorHandler.handle(error);
      }
    };

    fetchRepublicUsers();
  }, []);

  const toggleUserSelection = (userId: string) => {
    // Verificar se o usuário está atualmente selecionado
    const isSelected = selectedUsers.includes(userId);
    
    if (isSelected) {
      // Se já estiver selecionado, remova-o da lista
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    } else {
      // Se não estiver selecionado, adicione-o à lista
      setSelectedUsers(prev => [...prev, userId]);
    }
  };

  const selectCategory = (category: string) => {
    setValue('category', category);
    setCategoryModalVisible(false);
  };

  const handleCustomCategory = () => {
    if (customCategory.trim()) {
      setValue('category', customCategory.trim());
      setCustomCategory('');
      setCategoryModalVisible(false);
    }
  };

  const handleDatePickerChange = (event: any, selectedDate?: Date) => {
    setDatePickerVisibility(Platform.OS === 'ios');
    
    if (selectedDate) {
      const currentDate = watch('dueDate') || new Date();
      
      if (datePickerMode === 'date') {
        // Keep time part from current selection or current time
        const mergedDate = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          currentDate.getHours(),
          currentDate.getMinutes()
        );
        setValue('dueDate', mergedDate);
        
        // If it's iOS, we'll now show the time picker
        if (Platform.OS === 'ios') {
          setDatePickerMode('time');
          setDatePickerVisibility(true);
        }
      } else { // time mode
        // Keep date part from current selection but update time
        const mergedDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          selectedDate.getHours(),
          selectedDate.getMinutes()
        );
        setValue('dueDate', mergedDate);
      }
    }
  };

  const showDatePicker = () => {
    setDatePickerMode('date');
    setDatePickerVisibility(true);
  };

  const showTimePicker = () => {
    setDatePickerMode('time');
    setDatePickerVisibility(true);
  };

  const onSubmit = async (data: z.infer<typeof taskSchema>) => {
    try {
      if (selectedUsers.length === 0) {
        Alert.alert('Atenção', 'Selecione pelo menos um responsável para a tarefa.');
        return;
      }
      
      setIsLoading(true);
      
      const taskData = {
        title: data.title,
        description: data.description || '',
        republicId: user?.currentRepublicId || '',
        dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
        category: data.category
      };
  
      const createdTask = await createTask(taskData);
      
      if (createdTask && createdTask.id) {
        // Assign all selected users at once
        await assignMultipleUsers(createdTask.id, selectedUsers);
        
        Alert.alert(
          'Sucesso', 
          'Tarefa criada com sucesso!', 
          [{ 
            text: 'OK', 
            onPress: () => router.replace('/(panel)/tasks') // Isso vai direto para a lista de tarefas
          }]
        );
      }
    } catch (error) {
      ErrorHandler.handle(error);
    } finally {
      setIsLoading(false);
    }
  };
  const renderUserSelectionModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isUserModalVisible}
      onRequestClose={() => setUserModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar Responsáveis</Text>
            <Text style={styles.modalSubtitle}>
              Selecione os usuários responsáveis pela tarefa
            </Text>
          </View>
          
          <ScrollView style={styles.modalScrollView}>
            {availableUsers.map(availableUser => (
              <TouchableOpacity
                key={availableUser.uid}
                style={[
                  styles.userSelectItem,
                  selectedUsers.includes(availableUser.uid) && styles.selectedUserItem,
                  availableUser.uid === user?.uid && styles.currentUserItem
                ]}
                onPress={() => toggleUserSelection(availableUser.uid)}
              >
                <View style={styles.userSelectLeftContent}>
                  {availableUser.profilePictureUrl ? (
                    <Image 
                      source={{ uri: availableUser.profilePictureUrl }} 
                      style={styles.userAvatar}
                    />
                  ) : (
                    <View style={[
                      styles.userAvatarPlaceholder,
                      availableUser.uid === user?.uid && styles.currentUserAvatarPlaceholder
                    ]}>
                      <Text style={styles.userInitials}>
                        {availableUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </Text>
                    </View>
                  )}
                  {availableUser.uid === user?.uid && (
                    <View style={styles.currentUserIndicator} />
                  )}
                  <View style={styles.userInfo}>
                    <Text style={[
                      styles.userName,
                      availableUser.uid === user?.uid && styles.currentUserName
                    ]}>
                      {availableUser.name} {availableUser.uid === user?.uid ? ' (Você)' : ''}
                    </Text>
                    <Text style={styles.userEmail}>{availableUser.email}</Text>
                  </View>
                </View>
                
                {selectedUsers.includes(availableUser.uid) ? (
                  <View style={styles.userSelectedCheckmark}>
                    <Ionicons name="checkmark-circle" size={24} color="#7B68EE" />
                  </View>
                ) : (
                  <View style={styles.userUnselectedCheckmark}>
                    <Ionicons name="ellipse-outline" size={24} color="#aaa" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setUserModalVisible(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={() => setUserModalVisible(false)}
            >
              <Text style={styles.modalConfirmButtonText}>
                Confirmar ({selectedUsers.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  const renderCategoryModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isCategoryModalVisible}
      onRequestClose={() => setCategoryModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar Categoria</Text>
            <Text style={styles.modalSubtitle}>
              Escolha uma categoria para sua tarefa
            </Text>
          </View>
          
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.categoryGrid}>
              {COMMON_CATEGORIES.map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    watch('category') === category && styles.selectedCategoryChip
                  ]}
                  onPress={() => selectCategory(category)}
                >
                  <Text 
                    style={[
                      styles.categoryChipText,
                      watch('category') === category && styles.selectedCategoryChipText
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.customCategoryContainer}>
              <Text style={styles.customCategoryLabel}>Categoria Personalizada</Text>
              <View style={styles.customCategoryInputRow}>
                <TextInput
                  style={styles.customCategoryInput}
                  value={customCategory}
                  onChangeText={setCustomCategory}
                  placeholder="Digite uma categoria..."
                  placeholderTextColor="#aaa"
                />
                <TouchableOpacity
                  style={[
                    styles.customCategoryButton,
                    !customCategory.trim() && styles.disabledButton
                  ]}
                  onPress={handleCustomCategory}
                  disabled={!customCategory.trim()}
                >
                  <Text style={styles.customCategoryButtonText}>Aplicar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
          
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setCategoryModalVisible(false)}
          >
            <Text style={styles.modalCloseButtonText}>Concluir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const formatDate = (date?: Date) => {
    if (!date) return null;
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (date?: Date) => {
    if (!date) return null;
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() =>{router.replace('/(panel)/tasks');}} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#7B68EE" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Criar Tarefa</Text>
        </View>

        <ScrollView 
          style={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Título da Tarefa</Text>
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Digite o título da tarefa"
                  placeholderTextColor="#aaa"
                />
                {errors.title && (
                  <Text style={styles.errorText}>
                    {errors.title.message}
                  </Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Descrição (opcional)</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Descrição detalhada da tarefa"
                  placeholderTextColor="#aaa"
                  multiline
                  numberOfLines={4}
                />
              </View>
            )}
          />

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Responsáveis</Text>
            <TouchableOpacity 
              style={styles.selectButton}
              onPress={() => setUserModalVisible(true)}
            >
              <View style={styles.selectButtonContent}>
                <View style={styles.selectButtonTextContainer}>
                  <Text style={styles.selectButtonLabel}>Responsáveis</Text>
                  <Text style={styles.selectButtonValue}>
                    {selectedUsers.length > 0 
                      ? `${selectedUsers.length} pessoa(s) selecionada(s)` 
                      : 'Selecione os responsáveis'}
                  </Text>
                </View>
                <Ionicons name="people" size={24} color="#7B68EE" />
              </View>
              
              {selectedUsers.length > 0 && (
                <View style={styles.selectedUsersPreview}>
                  {availableUsers
                    .filter(user => selectedUsers.includes(user.uid))
                    .slice(0, 3)
                    .map((user, index) => (
                      <View 
                        key={user.uid} 
                        style={[
                          styles.userAvatarSmall, 
                          { marginLeft: index > 0 ? -10 : 0, zIndex: 10 - index }
                        ]}
                      >
                        {user.profilePictureUrl ? (
                          <Image 
                            source={{ uri: user.profilePictureUrl }} 
                            style={styles.userAvatarSmallImage}
                          />
                        ) : (
                          <Text style={styles.userAvatarSmallInitials}>
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </Text>
                        )}
                      </View>
                    ))}
                    
                  {selectedUsers.length > 3 && (
                    <View style={[styles.userAvatarSmall, styles.moreBadge]}>
                      <Text style={styles.moreBadgeText}>+{selectedUsers.length - 3}</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Prazo (opcional)</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={showDatePicker}
              >
                <View style={styles.dateButtonContent}>
                  <Ionicons name="calendar" size={20} color="#7B68EE" />
                  <Text style={styles.dateTimeText}>
                    {watch('dueDate') ? formatDate(watch('dueDate')) : 'Selecionar data'}
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.timeButton}
                onPress={showTimePicker}
              >
                <View style={styles.dateButtonContent}>
                  <Ionicons name="time" size={20} color="#7B68EE" />
                  <Text style={styles.dateTimeText}>
                    {watch('dueDate') ? formatTime(watch('dueDate')) : 'Hora'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {isDatePickerVisible && (
              <DateTimePicker
                value={watch('dueDate') || new Date()}
                mode={datePickerMode}
                display="default"
                onChange={handleDatePickerChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          <Controller
            control={control}
            name="category"
            render={({ field: { value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Categoria (opcional)</Text>
                <TouchableOpacity 
                  style={styles.selectButton}
                  onPress={() => setCategoryModalVisible(true)}
                >
                  <View style={styles.selectButtonContent}>
                    <View style={styles.selectButtonTextContainer}>
                      <Text style={styles.selectButtonLabel}>Categoria</Text>
                      <Text style={styles.selectButtonValue}>
                        {value || 'Selecione uma categoria'}
                      </Text>
                    </View>
                    <FontAwesome5 name="tag" size={20} color="#7B68EE" />
                  </View>
                  
                  {value && (
                    <View style={styles.categoryPreview}>
                      <View style={styles.categoryPreviewBadge}>
                        <Text style={styles.categoryPreviewText}>{value}</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}
          />

          <TouchableOpacity 
            style={[
              styles.submitButton, 
              (isLoading) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color="#fff" style={styles.submitButtonIcon} />
                <Text style={styles.submitButtonText}>Criar Tarefa</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {renderUserSelectionModal()}
      {renderCategoryModal()}
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#222',
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginTop: 20,
  },
  inputLabel: {
    color: '#fff',
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  multilineInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#FF6347',
    fontSize: 12,
    marginTop: 5,
  },
  selectButton: {
    backgroundColor: '#333',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444',
    overflow: 'hidden',
  },
  selectButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 16,
  },
  selectButtonTextContainer: {
    flex: 1,
  },
  selectButtonLabel: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 4,
  },
  selectButtonValue: {
    color: '#fff',
    fontSize: 16,
  },
  selectedUsersPreview: {
    flexDirection: 'row',
    padding: 12,
    paddingTop: 0,
    paddingLeft: 15,
  },
  userAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  userAvatarSmallImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  userAvatarSmallInitials: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  moreBadge: {
    backgroundColor: 'rgba(123, 104, 238, 0.3)',
  },
  moreBadgeText: {
    color: '#7B68EE',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateButton: {
    flex: 0.65,
    backgroundColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#444',
    marginRight: 8,
  },
  timeButton: {
    flex: 0.35,
    backgroundColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  categoryPreview: {
    padding: 12,
    paddingTop: 0,
    paddingLeft: 15,
  },
  categoryPreviewBadge: {
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  categoryPreviewText: {
    color: '#7B68EE',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#7B68EE',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
    shadowColor: "#7B68EE",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#5a5a5a',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  submitButtonIcon: {
    marginRight: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#333',
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  modalSubtitle: {
    color: '#aaa',
    fontSize: 14,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  userSelectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  userSelectLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInitials: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  userEmail: {
    color: '#aaa',
    fontSize: 14,
  },
  selectedUserItem: {
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
  },
  userSelectedCheckmark: {
    marginLeft: 12,
  },
  userUnselectedCheckmark: {
    marginLeft: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  modalCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#666',
  },
  modalCancelButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalConfirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#7B68EE',
  },
  modalConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  categoryChip: {
    backgroundColor: '#444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    margin: 6,
  },
  selectedCategoryChip: {
    backgroundColor: '#7B68EE',
  },
  categoryChipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCategoryChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  customCategoryContainer: {
    margin: 16,
    marginTop: 24,
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    padding: 16,
  },
  customCategoryLabel: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
  },
  customCategoryInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customCategoryInput: {
    flex: 1,
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
    marginRight: 10,
  },
  customCategoryButton: {
    backgroundColor: '#7B68EE',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#555',
  },
  customCategoryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    margin: 16,
    backgroundColor: '#7B68EE',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentUserItem: {
    backgroundColor: 'rgba(123, 104, 238, 0.1)',
  },
  currentUserAvatarPlaceholder: {
    backgroundColor: '#7B68EE',
  },
  currentUserName: {
    color: '#7B68EE',
    fontWeight: 'bold',
  },
  currentUserIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7B68EE',
    borderWidth: 2,
    borderColor: '#333',
  },
});

export default CreateTaskScreen;