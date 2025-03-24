// app/(panel)/tasks/[id].tsx - Com suporte aprimorado para recorrência
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
  Platform,
  Animated,
  Share
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { useTasks } from '../../../src/hooks/useTasks';
import { useAuth } from '../../../src/context/AuthContext';
import { format, formatDistance, parseISO, isToday, isTomorrow, isPast, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';
import { Task, RecurrenceType } from '../../../src/models/task.model';
import api from '../../../src/services/api';
import { ErrorHandler } from '../../../src/utils/errorHandling';
import {
  formatToBackendDateTime,
  parseISOPreservingTime,
  formatLocalDate,
  formatTime
} from '../../../src/utils/dateUtils';
import RecurrenceInfo from '@/components/RecorrenceInfo';

const { width } = Dimensions.get('window');

// Componente otimizado para detalhes da tarefa
const TaskDetailsScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { completeTask, cancelTask, deleteTask, updateTask, stopRecurrence } = useTasks();

  // Estados
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
  const [isStatusChanging, setIsStatusChanging] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStoppingRecurrence, setIsStoppingRecurrence] = useState(false);

  // Animações
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.95))[0];
  const scrollY = useState(new Animated.Value(0))[0];

  // Efeito de entrada com animação
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Carregar detalhes da tarefa
  const loadTaskDetails = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/api/v1/tasks/${id}`);
      if (response.data) {
        setTask(response.data);
        console.log('Resposta do API:', JSON.stringify(response.data, null, 2));
      } else {
        setError('Tarefa não encontrada');
      }
    } catch (error) {
      console.error('Error loading task details:', error);
      ErrorHandler.handle(error);
      setError('Não foi possível carregar os detalhes da tarefa');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  // Carregar tarefa ao montar o componente
  useEffect(() => {
    loadTaskDetails();
  }, [loadTaskDetails]);

  // Verificar se o usuário está atribuído à tarefa
  const isAssignedToCurrentUser = useMemo(() => {
    if (!task || !user) return false;
    return task.assignedUsers?.some(u => u.uid === user.uid) || false;
  }, [task, user]);

  // Verificar se usuário atual pode editar
  const canEditTask = isAssignedToCurrentUser;
  const isUserAdmin = user?.isAdmin === true;
  const canModifyTask = canEditTask || isUserAdmin;

  const formatTaskDate = useCallback((dateString?: string): string => {
    if (!dateString) return '';

    try {
      const date = parseISOPreservingTime(dateString);

      if (isToday(date)) {
        return `Hoje, ${formatTime(date)}`;
      } else if (isTomorrow(date)) {
        return `Amanhã, ${formatTime(date)}`;
      } else {
        return formatLocalDate(date, "EEEE, dd 'de' MMMM 'às' HH:mm");
      }
    } catch (error) {
      return dateString;
    }
  }, []);

  const getTimeAgo = useCallback((dateString?: string | null): string => {
    if (!dateString) return '';
    try {
      const date = parseISOPreservingTime(dateString);
      const now = new Date();

      const diffMinutes = differenceInMinutes(now, date);

      if (diffMinutes < 1) return 'agora mesmo';
      if (diffMinutes < 60) return `há ${diffMinutes} minutos`;
      if (diffMinutes < 120) return 'há 1 hora';
      if (diffMinutes < 1440) return `há ${Math.floor(diffMinutes / 60)} horas`;
      if (diffMinutes < 2880) return 'há 1 dia';

      return formatLocalDate(date, "dd 'de' MMM");
    } catch (error) {
      return '';
    }
  }, []);
  
  // Converter campos do modelo para camelCase para consistência na UI
  const adaptedTask = useMemo(() => {
    if (!task) return null;
    console.log(task);
    return {
      ...task, 
      assignedUsers: task.assignedUsers || [],
      completedAt: task.status === 'COMPLETED' ? task.updated_at : null,
      createdAt: task.createdAt,
      updatedAt: task.updated_at,
      republicId: task.republic_id,
    };
  }, [task]);

  // Handler para alternar status da tarefa
  const handleToggleStatus = async () => {
    if (!task || isStatusChanging) return;

    try {
      setIsStatusChanging(true);

      // Determinamos o novo status com base no status atual
      let newStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | "CANCELLED";

      if (task.status === 'COMPLETED') {
        newStatus = 'PENDING';
      } else if (task.status === 'PENDING') {
        newStatus = 'IN_PROGRESS';
      } else if (task.status === 'IN_PROGRESS') {
        newStatus = 'COMPLETED';
      } else {
        newStatus = task.status; // Mantém o status atual se for um dos outros tipos
      }

      const completedDate = new Date();
      const newCompletedAt = newStatus === 'COMPLETED' ? formatToBackendDateTime(completedDate) : null;

      // Atualiza o estado local imediatamente
      setTask(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: newStatus,
          completedAt: newCompletedAt
        };
      });

      // Requisição ao backend
      if (task.status === 'COMPLETED') {
        await updateTask(task.id, { ...task, status: 'PENDING' });
      } else if (task.status === 'PENDING') {
        await updateTask(task.id, { ...task, status: 'IN_PROGRESS' });
      } else if (task.status === 'IN_PROGRESS') {
        // Se a tarefa for recorrente, alertar o usuário sobre isso
        if (task.recurring) {
          const result = await completeTask(task.id);
          
          // Se o backend retornou a próxima instância, mostre uma mensagem informativa
          if (result && result.nextRecurringTaskId) {
            setTimeout(() => {
              Alert.alert(
                "Tarefa Recorrente",
                "Esta tarefa foi concluída com sucesso e uma nova instância foi criada automaticamente.",
                [{ text: "OK" }]
              );
            }, 500);
          }
        } else {
          await completeTask(task.id);
        }
      }
    } catch (error) {
      // Se falhar, reverte a mudança
      ErrorHandler.handle(error);
      setTask(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: task.status,
          completedAt: task.completed_at
        };
      });
    } finally {
      setIsStatusChanging(false);
    }
  };

  // Handler para cancelar tarefa
  const handleCancelTask = async () => {
    if (!task || isCancelling) return;

    try {
      setIsCancelling(true);

      // Atualização otimista
      setTask(prev => prev ? { ...prev, status: 'CANCELLED' } : null);

      // Requisição ao backend
      await cancelTask(task.id);
    } catch (error) {
      ErrorHandler.handle(error);
      setTask(prev => prev ? { ...prev, status: task.status } : null);
    } finally {
      setIsCancelling(false);
    }
  };

  // Handler para parar recorrência
  const handleStopRecurrence = async () => {
    if (!task || !task.recurring || isStoppingRecurrence) return;

    try {
      setIsStoppingRecurrence(true);

      // Confirmar com o usuário
      Alert.alert(
        "Interromper Recorrência",
        "Deseja interromper a recorrência desta tarefa? As próximas instâncias não serão mais criadas automaticamente.",
        [
          { text: "Cancelar", style: "cancel", onPress: () => setIsStoppingRecurrence(false) },
          { 
            text: "Interromper", 
            style: "destructive",
            onPress: async () => {
              try {
                // Atualização otimista
                setTask(prev => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    recurring: false
                  };
                });
                
                // Requisição ao backend
                await stopRecurrence(task.id);
                
                Alert.alert(
                  "Recorrência Interrompida",
                  "A tarefa não será mais recriada automaticamente após a conclusão."
                );
              } catch (error) {
                ErrorHandler.handle(error);
                // Reverter atualização otimista
                setTask(prev => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    recurring: true
                  };
                });
              } finally {
                setIsStoppingRecurrence(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      ErrorHandler.handle(error);
      setIsStoppingRecurrence(false);
    }
  };

  // Handler para navegar para tarefa pai
  const handleNavigateToParent = useCallback((parentTaskId: number) => {
    router.push(`/(panel)/tasks/${parentTaskId}`);
  }, [router]);

  // Handler para excluir tarefa
  const handleDeleteTask = async () => {
    if (!task || isDeleting) return;

    if (!showConfirmDelete) {
      setShowConfirmDelete(true);
      return;
    }

    try {
      setIsDeleting(true);

      // Animação de saída
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(async () => {
        await deleteTask(task.id);

        Alert.alert(
          'Sucesso',
          'Tarefa excluída com sucesso!',
          [{
            text: 'OK',
            onPress: () => router.back()
          }]
        );
      });
    } catch (error) {
      ErrorHandler.handle(error);
      setShowConfirmDelete(false);
      setIsDeleting(false);
    }
  };

  // Handler para cancelar exclusão
  const handleCancelDelete = useCallback(() => {
    setShowConfirmDelete(false);
  }, []);

  // Compartilhar tarefa
  const handleShareTask = useCallback(async () => {
    if (!task) return;

    try {
      let message = `Tarefa: ${task.title}\n` +
        `Status: ${task.status === 'PENDING' ? 'Pendente' :
          task.status === 'IN_PROGRESS' ? 'Em andamento' :
            task.status === 'COMPLETED' ? 'Concluída' :
              task.status === 'OVERDUE' ? 'Atrasada' : 'Cancelada'
        }\n` +
        (task.dueDate ? `Prazo: ${formatTaskDate(task.dueDate)}\n` : '');
        
      // Adicionar informações de recorrência se for uma tarefa recorrente
      if (task.recurring) {
        const recurrenceType = task.recurrenceType === 'DAILY' ? 'Diária' :
                              task.recurrenceType === 'WEEKLY' ? 'Semanal' :
                              task.recurrenceType === 'MONTHLY' ? 'Mensal' : 'Anual';
        
        const interval = task.recurrenceInterval && task.recurrenceInterval > 1 
          ? ` (a cada ${task.recurrenceInterval} ${
              task.recurrenceType === 'DAILY' ? 'dias' :
              task.recurrenceType === 'WEEKLY' ? 'semanas' :
              task.recurrenceType === 'MONTHLY' ? 'meses' : 'anos'
            })`
          : '';
        
        message += `Recorrência: ${recurrenceType}${interval}\n`;
      }
      
      // Adicionar descrição
      if (task.description) {
        message += `\n${task.description}`;
      }

      await Share.share({
        message,
        title: task.title,
      });
    } catch (error) {
      console.error('Error sharing task:', error);
      Alert.alert('Erro', 'Não foi possível compartilhar a tarefa');
    }
  }, [task, formatTaskDate]);

  // Verificar se a tarefa está vencida
  const isTaskOverdue = useMemo(() => {
    if (!adaptedTask || !adaptedTask.dueDate) return false;

    try {
      const dueDate = parseISOPreservingTime(adaptedTask.dueDate);
      return isPast(dueDate) && adaptedTask.status !== 'COMPLETED' && adaptedTask.status !== 'CANCELLED';
    } catch (error) {
      return false;
    }
  }, [adaptedTask]);
  
  // Verificar se a tarefa está completa
  const isTaskCompleted = useMemo(() => {
    return adaptedTask?.status === 'COMPLETED';
  }, [adaptedTask]);

  // Verificar se a tarefa está cancelada
  const isTaskCancelled = useMemo(() => {
    return adaptedTask?.status === 'CANCELLED';
  }, [adaptedTask]);

  // Verificar se a tarefa está em andamento
  const isTaskInProgress = useMemo(() => {
    return adaptedTask?.status === 'IN_PROGRESS';
  }, [adaptedTask]);

  // Animação do header com base no scroll
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 60],
    extrapolate: 'clamp'
  });

  // Obter status de prazo da tarefa
  const getDueStatusText = useCallback(() => {
    if (!adaptedTask || !adaptedTask.dueDate) return null;

    const dueDate = parseISOPreservingTime(adaptedTask.dueDate);
    const now = new Date();

    if (isTaskCompleted) {
      if (adaptedTask.completedAt) {
        const completedAt = parseISOPreservingTime(adaptedTask.completedAt);
        return completedAt <= dueDate
          ? { text: 'Concluída dentro do prazo', color: '#4CAF50' }
          : { text: 'Concluída com atraso', color: '#FF9800' };
      }
      return { text: 'Concluída', color: '#4CAF50' };
    }

    if (isTaskCancelled) {
      return { text: 'Cancelada', color: '#9E9E9E' };
    }

    if (dueDate < now) {
      return { text: 'Atrasada', color: '#F44336' };
    }

    // Calculate days until due
    const diffTime = Math.abs(dueDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { text: 'Vence hoje', color: '#FF9800' };
    } else if (diffDays === 1) {
      return { text: 'Vence amanhã', color: '#FF9800' };
    } else if (diffDays <= 3) {
      return { text: `Vence em ${diffDays} dias`, color: '#FF9800' };
    } else {
      return { text: `Vence em ${diffDays} dias`, color: '#4CAF50' };
    }
  }, [adaptedTask, isTaskCompleted, isTaskCancelled]);

  // Formato da data para exibição
  const formatDateWithTime = useCallback((dateString?: string | null) => {
    if (!dateString) return '--';
    try {
      // Verificar se é uma data válida
      const parsedDate = parseISOPreservingTime(dateString);
      if (isNaN(parsedDate.getTime())) {
        return dateString; // Retorna o original se for inválido
      }

      // Formatar a data usando o formatLocalDate
      return formatLocalDate(parsedDate, "dd 'de' MMM 'de' yyyy 'às' HH:mm");
    } catch (error) {
      console.error('Erro ao formatar data:', error, dateString);
      return dateString;
    }
  }, []);
  
  // Caso esteja carregando ou tenha erro, mostrar tela adequada
  if (loading && !task) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#222" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B68EE" />
          <Text style={styles.loadingText}>Carregando detalhes da tarefa...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#222" />
        <Ionicons name="alert-circle" size={64} color="#FF6347" />
        <Text style={styles.errorTitle}>Erro</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadTaskDetails}
        >
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!task || !adaptedTask) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#222" />
        <Ionicons name="checkmark-circle" size={64} color="#7B68EE" />
        <Text style={styles.errorTitle}>Tarefa não encontrada</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(panel)/tasks')}
        >
          <Text style={styles.backButtonText}>Voltar para Tarefas</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const dueStatus = getDueStatusText();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />

      {/* Header animado */}
      <Animated.View
        style={[
          styles.animatedHeader,
          {
            opacity: headerOpacity,
            height: headerHeight
          }
        ]}
      >
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#7B68EE" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {adaptedTask.title}
        </Text>
        <View style={styles.headerRight}>
          {canModifyTask && (
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => router.push(`/(panel)/tasks/edit?id=${task.id}`)}
            >
              <Ionicons name="create-outline" size={24} color="#7B68EE" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Banner de tarefa atribuída ao usuário */}
      {isAssignedToCurrentUser && (
        <View style={styles.userAssignmentBanner}>
          <Ionicons name="person" size={18} color="#fff" />
          <Text style={styles.userAssignmentText}>Você está atribuído a esta tarefa</Text>
        </View>
      )}

      <Animated.ScrollView
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Cabeçalho */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#7B68EE" />
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShareTask}
            >
              <Ionicons name="share-outline" size={24} color="#7B68EE" />
            </TouchableOpacity>

            {canModifyTask && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push(`/(panel)/tasks/edit?id=${task.id}`)}
              >
                <Ionicons name="create-outline" size={24} color="#7B68EE" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Conteúdo principal */}
        <Animated.View
          style={[
            styles.taskContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Status da tarefa */}
          <View style={styles.taskStatusRow}>
            <View style={[
              styles.statusBadge,
              adaptedTask.status === 'PENDING' ? styles.pendingBadge :
                adaptedTask.status === 'IN_PROGRESS' ? styles.inProgressBadge :
                  adaptedTask.status === 'COMPLETED' ? styles.completedBadge :
                    adaptedTask.status === 'OVERDUE' ? styles.overdueBadge :
                      styles.cancelledBadge
            ]}>
              <Text style={[
                styles.statusText,
                adaptedTask.status === 'PENDING' ? styles.pendingText :
                  adaptedTask.status === 'IN_PROGRESS' ? styles.inProgressText :
                    adaptedTask.status === 'COMPLETED' ? styles.completedText :
                      adaptedTask.status === 'OVERDUE' ? styles.overdueText :
                        styles.cancelledText
              ]}>
                {adaptedTask.status === 'PENDING' ? 'Pendente' :
                  adaptedTask.status === 'IN_PROGRESS' ? 'Em andamento' :
                    adaptedTask.status === 'COMPLETED' ? 'Concluída' :
                      adaptedTask.status === 'OVERDUE' ? 'Atrasada' :
                        'Cancelada'}
              </Text>
            </View>
            <Text style={styles.taskUpdatedTime}>
              Atualizada {getTimeAgo(adaptedTask.updatedAt)}
            </Text>
          </View>

          {/* Título */}
          <Text style={styles.taskTitle}>
            {adaptedTask.title}
            {adaptedTask.recurring && (
              <Text style={styles.recurringIndicator}> <Ionicons name="repeat" size={18} color="#4CAF50" /></Text>
            )}
          </Text>

          {/* República */}
          {adaptedTask.republic_id && (
            <View style={styles.republicRow}>
              <Ionicons name="home" size={16} color="#7B68EE" />
              <Text style={styles.republicText}>
                República ID: {adaptedTask.republic_id}
              </Text>
            </View>
          )}

          {/* Informações de recorrência */}
          {(adaptedTask.recurring || adaptedTask.parentTaskId) && (
            <View style={styles.recurrenceContainer}>
              {/* Usar o componente RecurrenceInfo ou implementar aqui */}
              <View style={styles.recurrenceBanner}>
                <Ionicons name="repeat" size={20} color="#4CAF50" />
                <Text style={styles.recurrenceBannerText}>
                  {adaptedTask.recurring ? 'Tarefa Recorrente' : 'Gerada por Recorrência'}
                </Text>
              </View>
              
              <View style={styles.recurrenceContent}>
                {/* Para tarefas recorrentes, mostrar configuração */}
                {adaptedTask.recurring && (
                  <>
                    <View style={styles.recurrenceRow}>
                      <Text style={styles.recurrenceLabel}>Tipo:</Text>
                      <Text style={styles.recurrenceValue}>
                        {adaptedTask.recurrenceType === 'DAILY' ? 'Diária' :
                          adaptedTask.recurrenceType === 'WEEKLY' ? 'Semanal' :
                            adaptedTask.recurrenceType === 'MONTHLY' ? 'Mensal' : 'Anual'}
                        {adaptedTask.recurrenceInterval && adaptedTask.recurrenceInterval > 1 ?
                          ` (a cada ${adaptedTask.recurrenceInterval} ${adaptedTask.recurrenceType === 'DAILY' ? 'dias' :
                            adaptedTask.recurrenceType === 'WEEKLY' ? 'semanas' :
                              adaptedTask.recurrenceType === 'MONTHLY' ? 'meses' : 'anos'
                          })` : ''
                        }
                      </Text>
                    </View>
                    
                    {adaptedTask.recurrenceEndDate && (
                      <View style={styles.recurrenceRow}>
                        <Text style={styles.recurrenceLabel}>Término:</Text>
                        <Text style={styles.recurrenceValue}>
                          {formatDateWithTime(adaptedTask.recurrenceEndDate)}
                        </Text>
                      </View>
                    )}
                  </>
                )}
                
                {/* Para tarefas geradas por recorrência, mostrar info da tarefa pai */}
                {adaptedTask.parentTaskId && (
                  <View style={styles.recurrenceRow}>
                    <Text style={styles.recurrenceLabel}>Origem:</Text>
                    <TouchableOpacity 
                      style={styles.parentTaskLink}
                      onPress={() => handleNavigateToParent(adaptedTask.parentTaskId!)}
                    >
                      <Text style={styles.parentTaskLinkText}>
                        Ver tarefa original
                      </Text>
                      <Ionicons name="arrow-forward" size={16} color="#7B68EE" />
                    </TouchableOpacity>
                  </View>
                )}
                
                {/* Explicação sobre recorrência */}
                <View style={styles.recurrenceInfoBox}>
                  <Ionicons name="information-circle" size={16} color="#aaa" />
                  <Text style={styles.recurrenceInfoText}>
                    {adaptedTask.recurring
                      ? 'Quando concluída, uma nova instância será criada automaticamente.'
                      : 'Esta tarefa foi gerada automaticamente por uma recorrência.'}
                  </Text>
                </View>
              </View>
              
              {/* Botão para interromper recorrência */}
              {canModifyTask && adaptedTask.recurring && (
                <TouchableOpacity 
                  style={styles.stopRecurrenceButton}
                  onPress={handleStopRecurrence}
                  disabled={isStoppingRecurrence}
                >
                  {isStoppingRecurrence ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="stop-circle" size={18} color="#FF6347" />
                      <Text style={styles.stopRecurrenceText}>
                        Interromper Recorrência
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Action Buttons */}
          {['PENDING', 'IN_PROGRESS', 'OVERDUE'].includes(adaptedTask.status) && canModifyTask && (
            <View style={styles.actionButtonsContainer}>
              {adaptedTask.status === 'PENDING' && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.primaryButton,
                    isStatusChanging && styles.actionButtonDisabled
                  ]}
                  onPress={handleToggleStatus}
                  disabled={isStatusChanging}
                >
                  {isStatusChanging ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="play-circle" size={18} color="#fff" />
                      <Text style={styles.primaryButtonText}>Iniciar Tarefa</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {adaptedTask.status === 'IN_PROGRESS' && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.primaryButton,
                    isStatusChanging && styles.actionButtonDisabled
                  ]}
                  onPress={handleToggleStatus}
                  disabled={isStatusChanging}
                >
                  {isStatusChanging ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={18} color="#fff" />
                      <Text style={styles.primaryButtonText}>Concluir Tarefa</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <View style={styles.buttonSpacer} />

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.secondaryButton,
                  isCancelling && styles.actionButtonDisabled
                ]}
                onPress={() => {
                  Alert.alert(
                    "Cancelar Tarefa",
                    "Tem certeza que deseja cancelar esta tarefa?",
                    [
                      { text: "Não", style: "cancel" },
                      {
                        text: "Cancelar Tarefa",
                        onPress: handleCancelTask
                      }
                    ]
                  );
                }}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={18} color="#fff" />
                    <Text style={styles.secondaryButtonText}>Cancelar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Botão para reabrir tarefas concluídas */}
          {adaptedTask.status === 'COMPLETED' && !adaptedTask.recurring && canModifyTask && (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.secondaryButton,
                  isStatusChanging && styles.actionButtonDisabled
                ]}
                onPress={handleToggleStatus}
                disabled={isStatusChanging}
              >
                {isStatusChanging ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="refresh-circle" size={18} color="#fff" />
                    <Text style={styles.secondaryButtonText}>Reabrir Tarefa</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Descrição */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Descrição</Text>
            <Text style={styles.descriptionText}>
              {adaptedTask.description || 'Nenhuma descrição fornecida.'}
            </Text>
          </View>

          {/* Task Details */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Detalhes</Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="calendar-outline" size={20} color="#7B68EE" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Data de Criação</Text>
                <Text style={styles.detailValue}>
                  {formatDateWithTime(adaptedTask.createdAt)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="alarm-outline" size={20} color="#7B68EE" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Prazo</Text>
                <View style={styles.dueDateContainer}>
                  <Text style={styles.detailValue}>
                    {adaptedTask.dueDate ? formatDateWithTime(adaptedTask.dueDate) : 'Sem prazo'}
                  </Text>
                  {dueStatus && (
                    <View style={[styles.dueStatusBadge, { backgroundColor: `${dueStatus.color}20` }]}>
                      <Text style={[styles.dueStatusText, { color: dueStatus.color }]}>
                        {dueStatus.text}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {adaptedTask.completedAt && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Concluída em</Text>
                  <Text style={styles.detailValue}>
                    {formatDateWithTime(adaptedTask.completedAt)}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <FontAwesome5 name="tag" size={18} color="#7B68EE" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Categoria</Text>
                <Text style={styles.detailValue}>
                  {adaptedTask.category || 'Sem categoria'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Responsáveis</Text>
            </View>

            {adaptedTask.assignedUsers && adaptedTask.assignedUsers.length > 0 ? (
              adaptedTask.assignedUsers.map((assignedUser, index) => {
                // Verificar se é o usuário atual
                const isCurrentUser = user && assignedUser.uid === user.uid;

                // Chave única para o usuário
                const userKey = assignedUser.uid || `user-${index}`;

                return (
                  <View
                    key={userKey}
                    style={[
                      styles.assigneeRow,
                      isCurrentUser && styles.currentUserAssigneeRow
                    ]}
                  >
                    <View style={styles.assigneeAvatarContainer}>
                      <View style={[
                        styles.assigneeAvatarPlaceholder,
                        isCurrentUser && styles.currentUserAvatarPlaceholder
                      ]}>
                        <Text style={styles.assigneeInitials}>
                          {assignedUser.nickname 
                            ? assignedUser.nickname.substring(0, 2).toUpperCase() 
                            : assignedUser.name 
                              ? assignedUser.name.substring(0, 2).toUpperCase()
                              : 'NA'}
                        </Text>
                      </View>

                      {isCurrentUser && (
                        <View style={styles.currentUserIndicator} />
                      )}
                    </View>

                    <View style={styles.assigneeInfo}>
                      <Text style={[
                        styles.assigneeName,
                        isCurrentUser && styles.currentUserName
                      ]}>
                        {assignedUser.nickname || assignedUser.name || assignedUser.email || assignedUser.uid}
                        {isCurrentUser ? ' (Você)' : ''}
                      </Text>
                      {assignedUser.email && (
                        <Text style={styles.assigneeEmail}>{assignedUser.email}</Text>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.noAssigneesText}>
                Nenhum responsável atribuído.
              </Text>
            )}
          </View>

          {/* Ações do Administrador (Exclusão) */}
          {canModifyTask && (
            <View style={styles.creatorActionsContainer}>
              <Text style={styles.creatorActionsTitle}>Ações Administrativas</Text>

              <View style={styles.creatorButtonsContainer}>
                <TouchableOpacity
                  style={[styles.creatorButton, styles.deleteButton]}
                  onPress={handleDeleteTask}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons
                        name={showConfirmDelete ? "alert-circle" : "trash"}
                        size={20}
                        color="#fff"
                        style={styles.buttonIcon}
                      />
                      <Text style={styles.deleteButtonText}>
                        {showConfirmDelete ? "Confirmar exclusão" : "Excluir tarefa"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {showConfirmDelete && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelDelete}
                  >
                    <Ionicons name="close-circle" size={20} color="#aaa" style={styles.buttonIcon} />
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </Animated.View>
      </Animated.ScrollView>

      {canModifyTask && !isDeleting && !showConfirmDelete && (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push(`/(panel)/tasks/edit?id=${task.id}`)}
        >
          <Feather name="edit-2" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#222',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
    padding: 20,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: 'rgba(123, 104, 238, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  retryButtonText: {
    color: '#7B68EE',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(34, 34, 34, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 1000,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerActionButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#222',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  userAssignmentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7B68EE',
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  userAssignmentText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  taskContainer: {
    backgroundColor: '#333',
    borderRadius: 16,
    margin: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  taskStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  pendingBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
  },
  pendingText: {
    color: '#FFC107',
  },
  inProgressBadge: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
  },
  inProgressText: {
    color: '#2196F3',
  },
  completedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  completedText: {
    color: '#4CAF50',
  },
  overdueBadge: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  overdueText: {
    color: '#F44336',
  },
  cancelledBadge: {
    backgroundColor: 'rgba(158, 158, 158, 0.2)',
  },
  cancelledText: {
    color: '#9E9E9E',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  taskUpdatedTime: {
    color: '#aaa',
    fontSize: 12,
  },
  taskTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  recurringIndicator: {
    color: '#4CAF50',
  },
  republicRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  republicText: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 6,
  },
  // Estilos para a seção de recorrência
  recurrenceContainer: {
    backgroundColor: '#444',
    borderRadius: 12,
    marginTop: 16,
    overflow: 'hidden',
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  recurrenceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  recurrenceBannerText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  recurrenceContent: {
    padding: 16,
  },
  recurrenceRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  recurrenceLabel: {
    color: '#aaa',
    fontSize: 14,
    width: 70,
  },
  recurrenceValue: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  recurrenceInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  recurrenceInfoText: {
    color: '#ccc',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  parentTaskLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  parentTaskLinkText: {
    color: '#7B68EE',
    fontSize: 14,
    marginRight: 4,
  },
  stopRecurrenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 99, 71, 0.15)',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#555',
  },
  stopRecurrenceText: {
    color: '#FF6347',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#444',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B68EE',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    maxWidth: '60%',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#555',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    maxWidth: '35%',
  },
  buttonSpacer: {
    width: 12,
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  descriptionContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#444',
    borderRadius: 12,
  },
  descriptionLabel: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 8,
  },
  descriptionText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  sectionContainer: {
    marginTop: 20,
    backgroundColor: '#444',
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#555',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7B68EE',
  },
  detailRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#555',
  },
  detailIcon: {
    width: 35,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 4,
  },
  detailValue: {
    color: '#fff',
    fontSize: 16,
  },
  detailSecondaryValue: {
    color: '#ddd',
    fontSize: 14,
    marginTop: 4,
  },
  dueDateContainer: {
    flexDirection: 'column',
  },
  dueStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  dueStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  assigneeRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#555',
    alignItems: 'center',
  },
  currentUserAssigneeRow: {
    backgroundColor: 'rgba(123, 104, 238, 0.1)',
  },
  assigneeAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  assigneeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  assigneeAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentUserAvatarPlaceholder: {
    backgroundColor: '#7B68EE',
  },
  assigneeInitials: {
    color: '#fff',
    fontSize: 16,
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
    borderColor: '#444',
  },
  assigneeInfo: {
    flex: 1,
  },
  assigneeName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  currentUserName: {
    color: '#7B68EE',
    fontWeight: 'bold',
  },
  assigneeEmail: {
    color: '#aaa',
    fontSize: 14,
  },
  noAssigneesText: {
    color: '#aaa',
    padding: 16,
    fontStyle: 'italic',
  },
  creatorActionsContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#444',
    borderRadius: 12,
  },
  creatorActionsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  creatorButtonsContainer: {
    marginTop: 8,
  },
  creatorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: 'rgba(123, 104, 238, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(123, 104, 238, 0.3)',
  },
  deleteButton: {
    backgroundColor: '#FF6347',
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#FF6347',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#444',
  },
  cancelButtonText: {
    color: '#aaa',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  editButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#7B68EE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7B68EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});

export default TaskDetailsScreen;