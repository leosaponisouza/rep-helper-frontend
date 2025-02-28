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
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../../src/services/api';
import { ErrorHandler } from '../../../src/utils/errorHandling';
import { useAuth } from '../../../src/context/AuthContext';
import { CreateTaskDTO } from '../../../src/models/task.model';

// Definição do esquema de validação
const taskSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  due_date: z.date().optional(),
  category: z.string().optional(),
});

const CreateTaskScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<{uid: string, name: string}[]>([]);
  const [isUserModalVisible, setUserModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { 
    control, 
    handleSubmit, 
    formState: { errors }, 
    setValue, 
    watch 
  } = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      due_date: undefined,
      category: ''
    }
  });

  // Buscar usuários da república
  useEffect(() => {
    const fetchRepublicUsers = async () => {
      try {
        const response = await api.get('/republics/users');
        setAvailableUsers(response.data.data);
      } catch (error) {
        ErrorHandler.handle(error);
      }
    };

    fetchRepublicUsers();
  }, []);

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const onSubmit = async (data: z.infer<typeof taskSchema>) => {
    try {
      setIsLoading(true);
      
      const taskData: CreateTaskDTO = {
        ...data,
        assigned_users: selectedUsers,
        due_date: data.due_date ? data.due_date.toISOString() : undefined
      };

      await api.post('/tasks', taskData);
      
      Alert.alert(
        'Sucesso', 
        'Tarefa criada com sucesso!', 
        [{ 
          text: 'OK', 
          onPress: () => router.back() 
        }]
      );
    } catch (error) {
      ErrorHandler.handle(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setDatePickerVisibility(Platform.OS === 'ios');
    if (selectedDate) {
      setValue('due_date', selectedDate);
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
          <Text style={styles.modalTitle}>Selecionar Responsáveis</Text>
          <ScrollView>
            {availableUsers.map(user => (
              <TouchableOpacity
                key={user.uid}
                style={[
                  styles.userSelectItem,
                  selectedUsers.includes(user.uid) && styles.selectedUserItem
                ]}
                onPress={() => toggleUserSelection(user.uid)}
              >
                <Text style={styles.userSelectText}>{user.name}</Text>
                {selectedUsers.includes(user.uid) && (
                  <Ionicons name="checkmark" size={20} color="#7B68EE" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setUserModalVisible(false)}
          >
            <Text style={styles.modalCloseButtonText}>Concluir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
              style={styles.selectUsersButton}
              onPress={() => setUserModalVisible(true)}
            >
              <Text style={styles.selectUsersButtonText}>
                {selectedUsers.length > 0 
                  ? `${selectedUsers.length} pessoa(s) selecionada(s)` 
                  : 'Selecionar responsáveis'}
              </Text>
              <Ionicons name="people" size={20} color="#7B68EE" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Data de Vencimento (opcional)</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setDatePickerVisibility(true)}
            >
              <Text style={styles.dateButtonText}>
                {watch('due_date') 
                  ? watch('due_date')?.toLocaleDateString() 
                  : 'Selecionar data'}
              </Text>
              <Ionicons name="calendar" size={20} color="#7B68EE" />
            </TouchableOpacity>

            {isDatePickerVisible && (
              <DateTimePicker
                value={watch('due_date') || new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>

          <Controller
            control={control}
            name="category"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Categoria (opcional)</Text>
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Ex: Limpeza, Compras, Manutenção"
                  placeholderTextColor="#aaa"
                />
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
    fontSize: 14,
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
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#FF6347',
    fontSize: 12,
    marginTop: 5,
  },
  selectUsersButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  selectUsersButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  dateButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#7B68EE',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  userSelectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  selectedUserItem: {
    backgroundColor: 'rgba(123, 104, 238, 0.2)',
  },
  userSelectText: {
    color: '#fff',
    fontSize: 16,
  },
  modalCloseButton: {
    marginTop: 15,
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
});

export default CreateTaskScreen;