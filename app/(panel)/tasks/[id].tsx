// app/(panel)/tasks/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Animated
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../../src/services/api';
import { ErrorHandler } from '../../../src/utils/errorHandling';
import { Task, useTasks } from '../../../src/hooks/useTasks';
import { useAuth } from '../../../src/context/AuthContext';
import { format, formatDistance, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componente de crachá de status animado
const AnimatedStatusBadge = ({ status }: { status: string }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const statusColors = {
    PENDING: '#FFC107',
    IN_PROGRESS: '#2196F3',
    COMPLETED: '#4CAF50',
    OVERDUE: '#F44336',
    CANCELLED: '#9E9E9E'
  };

  const statusLabels = {
    PENDING: 'Pendente',
    IN_PROGRESS: 'Em andamento',
    COMPLETED: 'Concluída',
    OVERDUE: 'Atrasada',
    CANCELLED: 'Cancelada'
  };

  const color = statusColors[status as keyof typeof statusColors] || '#9E9E9E';
  const label = statusLabels[status as keyof typeof statusLabels] || status;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View
      style={[
        styles.statusBadge,
        {
          backgroundColor: `${color}20`,
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0]
            })
          }]
        }
      ]}
    >
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </Animated.View>
  );
};

// Banner de tarefas atribuídas ao usuário
const UserAssignmentBanner = ({ isAssignedToCurrentUser }: { isAssignedToCurrentUser: boolean }) => {
  if (!isAssignedToCurrentUser) return null;

  return (
    <View style={styles.userAssignmentBanner}>
      <Ionicons name="person" size={18} color="#fff" />
      <Text style={styles.userAssignmentText}>Você está atribuído a esta tarefa</Text>
    </View>
  );
};

const TaskDetailsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const { completeTask, cancelTask, deleteTask, updateTask } = useTasks();
  const [isStatusChanging, setIsStatusChanging] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Busca detalhes da tarefa
  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/v1/tasks/${id}`);
        setTask(response.data);
      } catch (error) {
        ErrorHandler.handle(error);
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [id]);

  // Verificar se usuário atual está atribuído à tarefa
  const isAssignedToCurrentUser = task?.assignedUsers?.some(user => user.id === user?.id);

  // Verificar se usuário atual pode editar
  const canEditTask = isAssignedToCurrentUser;
  const isUserAdmin = user?.isAdmin === true;
  const canModifyTask = canEditTask || isUserAdmin;

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
      
      const newCompletedAt = newStatus === 'COMPLETED' ? new Date().toISOString() : null;
  
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
        await completeTask(task.id);
      }
    } catch (error) {
      // Se falhar, reverte a mudança
      ErrorHandler.handle(error);
      setTask(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: task.status,
          completedAt: task.completedAt
        };
      });
    } finally {
      setIsStatusChanging(false);
    }
  };

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

  // Atualização para o método de exclusão
  const handleDeleteTask = async () => {
    if (!task || isDeleting) return;

    try {
      setIsDeleting(true);
      await deleteTask(task.id);

      Alert.alert(
        'Tarefa Excluída',
        'A tarefa foi removida com sucesso.',
        [{
          text: 'OK',
          onPress: () => router.back()
        }]
      );
    } catch (error) {
      ErrorHandler.handle(error);
      setIsDeleting(false);
    }
    // Não precisamos de finally aqui, pois navegamos para fora da tela em caso de sucesso
  };

  const confirmDeleteTask = () => {
    Alert.alert(
      'Excluir Tarefa',
      'Tem certeza que deseja excluir esta tarefa?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: handleDeleteTask
        }
      ]
    );
  };

  const confirmCancelTask = () => {
    Alert.alert(
      'Cancelar Tarefa',
      'Tem certeza que deseja cancelar esta tarefa?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Cancelar Tarefa',
          onPress: handleCancelTask
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B68EE" />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Tarefa não encontrada</Text>
      </View>
    );
  }

  const isTaskActive = ['PENDING', 'IN_PROGRESS', 'OVERDUE'].includes(task.status);
  const isTaskOverdue = task.status === 'OVERDUE';
  const isTaskCompleted = task.status === 'COMPLETED';
  const isTaskCancelled = task.status === 'CANCELLED';

  const formatDateWithTime = (dateString?: string | null) => {
    if (!dateString) return '--';
    try {
      return format(parseISO(dateString), "dd MMM yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  const getTimeAgo = (dateString?: string | null) => {
    if (!dateString) return '';
    try {
      return formatDistance(parseISO(dateString), new Date(), {
        addSuffix: true,
        locale: ptBR
      });
    } catch (error) {
      return '';
    }
  };

  const getDueStatusText = () => {
    if (!task.dueDate) return null;

    const dueDate = parseISO(task.dueDate);
    const now = new Date();

    if (isTaskCompleted) {
      if (task.completedAt) {
        const completedAt = parseISO(task.completedAt);
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
  };

  const dueStatus = getDueStatusText();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />

      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#7B68EE" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Detalhes da Tarefa
        </Text>
        {canModifyTask && (
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={confirmDeleteTask}
              style={styles.deleteButton}
            >
              <Ionicons name="trash" size={20} color="#FF6347" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Banner de tarefa atribuída ao usuário corrente */}
      <UserAssignmentBanner isAssignedToCurrentUser={isAssignedToCurrentUser || false} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Task Header with Status */}
        <View style={styles.taskHeaderSection}>
          <View style={styles.taskStatusRow}>
            <AnimatedStatusBadge status={task.status} />
            <Text style={styles.taskUpdatedTime}>
              Atualizada {getTimeAgo(task.updatedAt)}
            </Text>
          </View>

          <Text style={styles.taskTitle}>{task.title}</Text>

          {task.republicName && (
            <View style={styles.republicRow}>
              <Ionicons name="home" size={16} color="#7B68EE" />
              <Text style={styles.republicText}>
                {task.republicName}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {isTaskActive && canModifyTask && (
          <View style={styles.actionButtonsContainer}>
            {task.status === 'PENDING' && (
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
            
            {task.status === 'IN_PROGRESS' && (
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
              onPress={confirmCancelTask}
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
        {isTaskCompleted && canModifyTask && (
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

        {/* Description */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Descrição</Text>
          </View>

          <Text style={styles.descriptionText}>
            {task.description || 'Nenhuma descrição fornecida.'}
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
                {formatDateWithTime(task.createdAt)}
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
                  {task.dueDate ? formatDateWithTime(task.dueDate) : 'Sem prazo'}
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

          {task.completedAt && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Concluída em</Text>
                <Text style={styles.detailValue}>
                  {formatDateWithTime(task.completedAt)}
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
                {task.category || 'Sem categoria'}
              </Text>
            </View>
          </View>
        </View>

        {/* Assignees Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Responsáveis</Text>
          </View>

          {task.assignedUsers && task.assignedUsers.length > 0 ? (
            task.assignedUsers.map(assignee => (
              <View
                key={assignee.id}
                style={[
                  styles.assigneeRow,
                  assignee.id === user?.uid && styles.currentUserAssigneeRow
                ]}
              >
                <View style={styles.assigneeAvatarContainer}>
                  {assignee.profilePictureUrl ? (
                    <Image
                      source={{ uri: assignee.profilePictureUrl }}
                      style={styles.assigneeAvatar}
                    />
                  ) : (
                    <View style={[
                      styles.assigneeAvatarPlaceholder,
                      assignee.id === user?.uid && styles.currentUserAvatarPlaceholder
                    ]}>
                      <Text style={styles.assigneeInitials}>
                        {assignee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </Text>
                    </View>
                  )}

                  {assignee.id === user?.uid && (
                    <View style={styles.currentUserIndicator} />
                  )}
                </View>

                <View style={styles.assigneeInfo}>
                  <Text style={[
                    styles.assigneeName,
                    assignee.id === user?.uid && styles.currentUserName
                  ]}>
                    {assignee.nickname || assignee.name} {assignee.id === user?.uid ? '(Você)' : ''}
                  </Text>
                  <Text style={styles.assigneeEmail}>
                    {assignee.email}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noAssigneesText}>
              Nenhum responsável atribuído.
            </Text>
          )}
        </View>
      </ScrollView>

      {canModifyTask && (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push(`/tasks/edit?id=${task.id}`)}
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
  errorText: {
    color: '#fff',
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
  },
  headerActions: {
    flexDirection: 'row',
  },
  deleteButton: {
    marginLeft: 15,
    padding: 5,
  },
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  contentContainer: {
    paddingBottom: 40,
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
  taskHeaderSection: {
    backgroundColor: '#333',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
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
  republicRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  republicText: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 6,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#2A2A2A',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#7B68EE',
    maxWidth: '60%', // Limita a largura para não ficar muito próximo do outro botão
  },
  secondaryButton: {
    backgroundColor: '#555',
    maxWidth: '35%', // Menor que o botão principal
  },
  buttonSpacer: {
    width: 12, // Espaço entre os botões
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
  actionButtonDisabled: {
    opacity: 0.7,
  },
  sectionContainer: {
    backgroundColor: '#333',
    margin: 12,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7B68EE',
  },
  sectionAction: {
    color: '#7B68EE',
    fontSize: 14,
  },
  descriptionText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
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
    borderBottomColor: '#444',
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
    borderColor: '#333',
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