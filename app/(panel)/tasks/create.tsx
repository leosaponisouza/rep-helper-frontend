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
  Image,
  Switch
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
import { RecurrenceType } from '../../../src/models/task.model';

// Common categories that users might want to use
const COMMON_CATEGORIES = [
  'Limpeza',
  'Compras',
  'Manutenção',
  'Contas',
  'Alimentação',
  'Outros'
];

// Recurrence types
const RECURRENCE_TYPES = [
  { key: 'DAILY', label: 'Diária', icon: 'calendar-outline' },
  { key: 'WEEKLY', label: 'Semanal', icon: 'calendar-number-outline' },
  { key: 'MONTHLY', label: 'Mensal', icon: 'calendar-clear-outline' },
  { key: 'YEARLY', label: 'Anual', icon: 'calendar' }
];

// Enhanced schema to match backend expectations
const taskSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  category: z.string().optional(),
  is_recurring: z.boolean().optional(),
  recurrence_type: z.string().optional(),
  recurrence_interval: z.number().min(1).optional(),
  recurrence_end_date: z.date().optional(),
}).refine(data => {
  // Se a tarefa for recorrente, a data de vencimento é obrigatória
  if (data.is_recurring && !data.dueDate) {
    return false;
  }
  return true;
}, {
  message: "Para tarefas recorrentes, a data da primeira ocorrência é obrigatória",
  path: ["dueDate"]
});

const CreateTaskScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisibility] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');
  const [endDatePickerMode, setEndDatePickerMode] = useState<'date' | 'time'>('date');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<{ uid: string, name: string, nickname: string, email: string, profilePictureUrl?: string }[]>([]);
  const [isUserModalVisible, setUserModalVisible] = useState(false);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isRecurrenceModalVisible, setRecurrenceModalVisible] = useState(false);
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
      category: '',
      is_recurring: false,
      recurrence_type: 'WEEKLY',
      recurrence_interval: 1,
      recurrence_end_date: undefined
    }
  });

  const isRecurring = watch('is_recurring');
  const recurrenceType = watch('recurrence_type');
  const recurrenceInterval = watch('recurrence_interval');
  const recurrenceEndDate = watch('recurrence_end_date');

  // Limpar o formulário quando a tela for desmontada
  useEffect(() => {
    // Inicialização única
    const initialValues = {
      title: '',
      description: '',
      dueDate: undefined,
      category: '',
      is_recurring: false,
      recurrence_type: 'WEEKLY',
      recurrence_interval: 1,
      recurrence_end_date: undefined
    };

    // Resetar o formulário com os valores iniciais
    reset(initialValues);

    return () => {
      // Limpar o formulário quando a tela for desmontada
      reset(initialValues);
      setSelectedUsers([]);
      // Limpar quaisquer outros estados relevantes
    };
  }, [reset]);

  // Fetch republic users
  useEffect(() => {
    // Referência para controlar se o componente está montado
    let isMounted = true;

    const fetchRepublicUsers = async () => {
      try {
        if (user?.currentRepublicId) {
          const republicId = user.currentRepublicId;
          const response = await api.get(`/api/v1/republics/${republicId}/members`);

          // Verifica se o componente ainda está montado antes de atualizar o estado
          if (isMounted) {
            setAvailableUsers(response.data);

            // Auto-select current user
            if (user.uid) {
              setSelectedUsers([user.uid]);
            }
          }
        } else {
          console.warn("current_republic_id não encontrado para o usuário.");
        }
      } catch (error) {
        if (isMounted) {
          ErrorHandler.handle(error);
        }
      }
    };

    fetchRepublicUsers();

    // Função de limpeza para evitar atualizações de estado após desmontagem
    return () => {
      isMounted = false;
    };
  }, [user?.currentRepublicId, user?.uid]);

  // Formatar o padrão de recorrência para texto legível
  const getRecurrencePattern = () => {
    if (!isRecurring) return '';

    const type = recurrenceType === 'DAILY' ? 'Diária' :
      recurrenceType === 'WEEKLY' ? 'Semanal' :
        recurrenceType === 'MONTHLY' ? 'Mensal' : 'Anual';

    if (recurrenceInterval === 1) {
      return type;
    }

    const unit = recurrenceType === 'DAILY' ? 'dias' :
      recurrenceType === 'WEEKLY' ? 'semanas' :
        recurrenceType === 'MONTHLY' ? 'meses' : 'anos';

    return `${type} (a cada ${recurrenceInterval} ${unit})`;
  };

  // Criar descrição do padrão de recorrência
  const getRecurrenceDescription = () => {
    if (!isRecurring) return '';

    let description = '';

    if (recurrenceInterval === 1) {
      description = recurrenceType === 'DAILY' ? 'A tarefa será recriada todos os dias' :
        recurrenceType === 'WEEKLY' ? 'A tarefa será recriada toda semana' :
          recurrenceType === 'MONTHLY' ? 'A tarefa será recriada todo mês' :
            'A tarefa será recriada todo ano';
    } else {
      description = recurrenceType === 'DAILY' ? `A tarefa será recriada a cada ${recurrenceInterval} dias` :
        recurrenceType === 'WEEKLY' ? `A tarefa será recriada a cada ${recurrenceInterval} semanas` :
          recurrenceType === 'MONTHLY' ? `A tarefa será recriada a cada ${recurrenceInterval} meses` :
            `A tarefa será recriada a cada ${recurrenceInterval} anos`;
    }

    if (recurrenceEndDate) {
      description += `, até ${formatDate(recurrenceEndDate)}`;
    }

    return description;
  };

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

  const selectRecurrenceType = (type: RecurrenceType) => {
    setValue('recurrence_type', type);
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

  const handleEndDatePickerChange = (event: any, selectedDate?: Date) => {
    setEndDatePickerVisibility(Platform.OS === 'ios');

    if (selectedDate) {
      const currentDate = watch('recurrence_end_date') || new Date();

      if (endDatePickerMode === 'date') {
        // Keep time part from current selection or current time
        const mergedDate = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          currentDate.getHours(),
          currentDate.getMinutes()
        );
        setValue('recurrence_end_date', mergedDate);

        // If it's iOS, we'll now show the time picker
        if (Platform.OS === 'ios') {
          setEndDatePickerMode('time');
          setEndDatePickerVisibility(true);
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
        setValue('recurrence_end_date', mergedDate);
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

  const showEndDatePicker = () => {
    setEndDatePickerMode('date');
    setEndDatePickerVisibility(true);
  };

  const showEndTimePicker = () => {
    setEndDatePickerMode('time');
    setEndDatePickerVisibility(true);
  };

  const onSubmit = async (data: z.infer<typeof taskSchema>) => {
    try {
      if (selectedUsers.length === 0) {
        Alert.alert('Atenção', 'Selecione pelo menos um responsável para a tarefa.');
        return;
      }

      // Verificar se a tarefa é recorrente e tem data de vencimento
      if (data.is_recurring && !data.dueDate) {
        Alert.alert('Atenção', 'Para tarefas recorrentes, é necessário definir a data da primeira ocorrência.');
        return;
      }

      setIsLoading(true);

      const taskData = {
        title: data.title,
        description: data.description || '',
        republicId: user?.currentRepublicId || '',
        dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
        category: data.category,
        isRecurring: data.is_recurring,
        recurrenceType: data.is_recurring ? data.recurrence_type as RecurrenceType : undefined,
        recurrenceInterval: data.is_recurring ? data.recurrence_interval : undefined,
        recurrenceEndDate: data.is_recurring && data.recurrence_end_date ? data.recurrence_end_date.toISOString() : undefined
      };

      const createdTask = await createTask(taskData);

      if (createdTask && createdTask.id) {
        // Assign all selected users at once
        await assignMultipleUsers(createdTask.id, selectedUsers);

        // Mostrar mensagem específica para tarefas recorrentes
        if (data.is_recurring) {
          Alert.alert(
            'Tarefa Recorrente Criada',
            `A tarefa recorrente foi criada com sucesso! Após ser concluída, uma nova instância será criada automaticamente ${getRecurrencePattern().toLowerCase()}.`,
            [{
              text: 'OK',
              onPress: () => router.replace('/(panel)/tasks')
            }]
          );
        } else {
          Alert.alert(
            'Sucesso',
            'Tarefa criada com sucesso!',
            [{
              text: 'OK',
              onPress: () => router.replace('/(panel)/tasks')
            }]
          );
        }
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
                      {availableUser.nickname || availableUser.name} {availableUser.uid === user?.uid ? '(Você)' : ''}
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

  const renderRecurrenceModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isRecurrenceModalVisible}
      onRequestClose={() => setRecurrenceModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Configurar Recorrência</Text>
            <Text style={styles.modalSubtitle}>
              Defina como esta tarefa deve se repetir após ser concluída
            </Text>
          </View>

          <ScrollView style={styles.modalScrollView}>
            <View style={styles.recurrenceTypeContainer}>
              <Text style={styles.recurrenceLabel}>Tipo de Recorrência</Text>
              <Text style={styles.recurrenceDescription}>
                Selecione com que frequência a tarefa deve se repetir
              </Text>
              <View style={styles.recurrenceTypeGrid}>
                {RECURRENCE_TYPES.map(type => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.recurrenceTypeChip,
                      recurrenceType === type.key && styles.selectedRecurrenceTypeChip
                    ]}
                    onPress={() => selectRecurrenceType(type.key as RecurrenceType)}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={18}
                      color={recurrenceType === type.key ? '#fff' : '#aaa'}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[
                        styles.recurrenceTypeText,
                        recurrenceType === type.key && styles.selectedRecurrenceTypeText
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.recurrenceIntervalContainer}>
              <Text style={styles.recurrenceLabel}>Intervalo</Text>
              <Text style={styles.recurrenceDescription}>
                Defina com que frequência a tarefa deve se repetir
              </Text>

              <View style={styles.recurrenceIntervalRow}>
                <TouchableOpacity
                  style={[
                    styles.intervalButton,
                    recurrenceInterval <= 1 && styles.intervalButtonDisabled
                  ]}
                  onPress={() => setValue('recurrence_interval', Math.max(1, recurrenceInterval - 1))}
                  disabled={recurrenceInterval <= 1}
                >
                  <Ionicons name="remove" size={20} color="#fff" />
                </TouchableOpacity>

                <View style={styles.intervalValueContainer}>
                  <Text style={styles.intervalValue}>{recurrenceInterval}</Text>
                </View>

                <TouchableOpacity
                  style={styles.intervalButton}
                  onPress={() => setValue('recurrence_interval', recurrenceInterval + 1)}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>

                <Text style={styles.intervalText}>
                  {recurrenceType === 'DAILY' ? 'dia(s)' :
                    recurrenceType === 'WEEKLY' ? 'semana(s)' :
                      recurrenceType === 'MONTHLY' ? 'mês(es)' : 'ano(s)'}
                </Text>
              </View>

              <Text style={styles.recurrenceHelperText}>
                {recurrenceInterval === 1 ? (
                  recurrenceType === 'DAILY' ? 'A tarefa será recriada todos os dias' :
                    recurrenceType === 'WEEKLY' ? 'A tarefa será recriada toda semana' :
                      recurrenceType === 'MONTHLY' ? 'A tarefa será recriada todo mês' :
                        'A tarefa será recriada todo ano'
                ) : (
                  recurrenceType === 'DAILY' ? `A tarefa será recriada a cada ${recurrenceInterval} dias` :
                    recurrenceType === 'WEEKLY' ? `A tarefa será recriada a cada ${recurrenceInterval} semanas` :
                      recurrenceType === 'MONTHLY' ? `A tarefa será recriada a cada ${recurrenceInterval} meses` :
                        `A tarefa será recriada a cada ${recurrenceInterval} anos`
                )}
              </Text>
            </View>

            <View style={styles.recurrenceEndDateContainer}>
              <Text style={styles.recurrenceLabel}>Data de Término (opcional)</Text>
              <Text style={styles.recurrenceDescription}>
                Opcionalmente, defina quando a recorrência deve parar
              </Text>

              <View style={styles.dateTimeContainer}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={showEndDatePicker}
                >
                  <View style={styles.dateButtonContent}>
                    <Ionicons name="calendar" size={20} color="#7B68EE" />
                    <Text style={styles.dateTimeText}>
                      {watch('recurrence_end_date') ? formatDate(watch('recurrence_end_date')) : 'Selecionar data'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={showEndTimePicker}
                >
                  <View style={styles.dateButtonContent}>
                    <Ionicons name="time" size={20} color="#7B68EE" />
                    <Text style={styles.dateTimeText}>
                      {watch('recurrence_end_date') ? formatTime(watch('recurrence_end_date')) : 'Hora'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {watch('recurrence_end_date') ? (
                <View>
                  <Text style={styles.recurrenceHelperText}>
                    A recorrência será interrompida após esta data
                  </Text>
                  <TouchableOpacity
                    style={styles.clearEndDateButton}
                    onPress={() => setValue('recurrence_end_date', undefined)}
                  >
                    <Text style={styles.clearEndDateText}>Remover data de término</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.recurrenceHelperText}>
                  Sem data de término definida, a tarefa continuará se repetindo indefinidamente
                </Text>
              )}
            </View>

            <View style={styles.recurrenceInfoContainer}>
              <Ionicons name="information-circle" size={20} color="#7B68EE" />
              <Text style={styles.recurrenceInfoText}>
                Quando você concluir uma tarefa recorrente, uma nova instância será
                automaticamente criada com a próxima data de vencimento.
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setRecurrenceModalVisible(false)}
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
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
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
            <Text style={styles.inputLabel}>
              {isRecurring ? 'Prazo da primeira ocorrência' : 'Prazo (opcional)'}
            </Text>
            {isRecurring && (
              <Text style={styles.recurrenceDescription}>
                Defina a data e hora da primeira ocorrência desta tarefa recorrente
              </Text>
            )}
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

          <Controller
            control={control}
            name="is_recurring"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputContainer}>
                <View style={styles.recurrenceToggleContainer}>
                  <View>
                    <Text style={styles.inputLabel}>Tarefa Recorrente</Text>
                    <Text style={styles.recurrenceDescription}>
                      Ative para criar uma tarefa que se repete automaticamente quando concluída
                    </Text>
                  </View>
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: '#444', true: 'rgba(76, 175, 80, 0.4)' }}
                    thumbColor={value ? '#4CAF50' : '#aaa'}
                  />
                </View>

                {value && (
                  <>
                    <TouchableOpacity
                      style={styles.recurrenceConfigButton}
                      onPress={() => setRecurrenceModalVisible(true)}
                    >
                      <View style={styles.recurrenceConfigContent}>
                        <View>
                          <Text style={styles.recurrenceConfigLabel}>Configurar Recorrência</Text>
                          <Text style={styles.recurrenceConfigValue}>
                            {getRecurrencePattern()}
                          </Text>
                          {recurrenceEndDate && (
                            <Text style={styles.recurrenceEndDateText}>
                              Término em: {formatDate(recurrenceEndDate)}
                            </Text>
                          )}
                        </View>
                        <Ionicons name="repeat" size={24} color="#4CAF50" />
                      </View>
                    </TouchableOpacity>

                    <View style={styles.recurrenceExplanationContainer}>
                      <Ionicons name="information-circle" size={18} color="#aaa" />
                      <Text style={styles.recurrenceExplanationText}>
                        {getRecurrenceDescription()}
                      </Text>
                    </View>
                  </>
                )}
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
      {renderRecurrenceModal()}

      {isEndDatePickerVisible && (
        <DateTimePicker
          value={watch('recurrence_end_date') || new Date()}
          mode={endDatePickerMode}
          display="default"
          onChange={handleEndDatePickerChange}
          minimumDate={new Date()}
        />
      )}
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
  recurrenceToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recurrenceDescription: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4,
  },
  recurrenceConfigButton: {
    backgroundColor: '#333',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444',
    overflow: 'hidden',
    marginBottom: 12,
  },
  recurrenceConfigContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 16,
  },
  recurrenceConfigLabel: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 4,
  },
  recurrenceConfigValue: {
    color: '#fff',
    fontSize: 16,
  },
  recurrenceEndDateText: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4,
  },
  recurrenceExplanationContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  recurrenceExplanationText: {
    color: '#aaa',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  recurrenceTypeContainer: {
    marginBottom: 20,
  },
  recurrenceLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
  },
  recurrenceTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  recurrenceTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    margin: 6,
  },
  selectedRecurrenceTypeChip: {
    backgroundColor: '#4CAF50',
  },
  recurrenceTypeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedRecurrenceTypeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  recurrenceIntervalContainer: {
    marginBottom: 20,
  },
  recurrenceIntervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  intervalButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  intervalButtonDisabled: {
    opacity: 0.5,
  },
  intervalValueContainer: {
    width: 60,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    marginHorizontal: 10,
  },
  intervalValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  intervalText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  recurrenceEndDateContainer: {
    marginBottom: 20,
  },
  recurrenceHelperText: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
  },
  clearEndDateButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  clearEndDateText: {
    color: '#FF6347',
    fontSize: 14,
  },
  recurrenceInfoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(123, 104, 238, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  recurrenceInfoText: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
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
    padding: 20,
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