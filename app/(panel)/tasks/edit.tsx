// app/(panel)/tasks/edit.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../../src/services/api';
import { ErrorHandler } from '../../../src/utils/errorHandling';
import { useAuth } from '../../../src/context/AuthContext';
import { useTasks } from '../../../src/hooks/useTasks';

// Importação dos componentes modulares por meio do arquivo de índice
import {
  HeaderBar,
  TitleDescriptionInputs,
  UserAssignmentSection,
  DateTimePickerSection,
  CategorySection
} from '@/components/Task/TaskEdit';

// Schema de validação
const taskSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  category: z.string().optional(),
});

const EditTaskScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<{uid: string, name: string, nickname?: string, email: string, profilePictureUrl?: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingTask, setIsFetchingTask] = useState(true);
  const { updateTask, assignMultipleUsers } = useTasks();

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

  // Fetch task data
  useEffect(() => {
    const fetchTaskDetails = async () => {
      if (!id) return;
      
      try {
        setIsFetchingTask(true);
        const response = await api.get(`/api/v1/tasks/${id}`);
        const task = response.data;
        
        // Populate form with task data
        setValue('title', task.title);
        setValue('description', task.description || '');
        setValue('category', task.category || '');
        
        if (task.dueDate) {
          setValue('dueDate', new Date(task.dueDate));
        }
        
        // Set selected users
        if (task.assignedUsers && task.assignedUsers.length > 0) {
          const userIds = task.assignedUsers.map((user: { uid: string }) => String(user.uid));
          setSelectedUsers(userIds);
        }
      } catch (error) {
        ErrorHandler.handle(error);
        router.back();
      } finally {
        setIsFetchingTask(false);
      }
    };
  
    fetchTaskDetails();
  }, [id, setValue]);

  // Fetch republic users
  useEffect(() => {
    const fetchRepublicUsers = async () => {
      try {
        if (user?.currentRepublicId) {
          const republicId = user.currentRepublicId;
          const response = await api.get(`/api/v1/republics/${republicId}/members`);
          setAvailableUsers(response.data);
        } else {
          console.warn("current_republic_id não encontrado para o usuário.");
        }
      } catch (error) {
        ErrorHandler.handle(error);
      }
    };

    fetchRepublicUsers();
  }, [user?.currentRepublicId]);

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
        dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
        category: data.category
      };
  
      // Update the task
      await updateTask(Number(id), taskData);
      
      // Update assigned users
      await assignMultipleUsers(Number(id), selectedUsers);
      
      Alert.alert(
        'Sucesso', 
        'Tarefa atualizada com sucesso!', 
        [{ 
          text: 'OK', 
          onPress: () => router.replace('/(panel)/tasks') 
        }]
      );
    } catch (error) {
      ErrorHandler.handle(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingTask) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#222" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B68EE" />
          <Text style={styles.loadingText}>Carregando tarefa...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <HeaderBar title="Editar Tarefa" onBack={() => router.back()} />

        <ScrollView 
          style={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <TitleDescriptionInputs 
            control={control}
            errors={errors}
          />

          <UserAssignmentSection
            selectedUsers={selectedUsers}
            availableUsers={availableUsers}
            currentUserId={user?.uid}
            onChangeSelectedUsers={setSelectedUsers}
          />

          <DateTimePickerSection
            control={control}
            setValue={setValue}
            watch={watch}
            setDatePickerVisibility={setDatePickerVisibility}
            isDatePickerVisible={isDatePickerVisible}
            datePickerMode={datePickerMode}
            setDatePickerMode={setDatePickerMode}
          />

          <CategorySection
            control={control}
            setValue={setValue}
            watch={watch}
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
                <Ionicons name="save-outline" size={20} color="#fff" style={styles.submitButtonIcon} />
                <Text style={styles.submitButtonText}>Salvar Alterações</Text>
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
  scrollContainer: {
    flex: 1,
    backgroundColor: '#222',
    paddingHorizontal: 20,
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
});

export default EditTaskScreen;