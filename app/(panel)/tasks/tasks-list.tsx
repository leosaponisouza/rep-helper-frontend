// app/(panel)/tasks/tasks-list.tsx - Atualizado para usar o endpoint específico
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import TaskFilter, { FilterOption } from '../../../components/TaskFilter';
import { useTasks, Task } from '../../../src/hooks/useTasks';
import { useAuth } from '../../../src/context/AuthContext';

// Interface de tipos para as propriedades do TaskItem
interface TaskItemProps {
  item: Task;
  onToggleStatus: (task: Task) => Promise<void>;
  onDeleteTask: (task: Task) => Promise<void>;
  currentUserId?: string;
  pendingTaskIds: number[];
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  item, 
  onToggleStatus, 
  currentUserId,
  pendingTaskIds
}) => {
  const router = useRouter();
  const isAssignedToCurrentUser = item.assignedUsers?.some(user => user.id === currentUserId);
  const isPending = pendingTaskIds.includes(item.id);
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'COMPLETED': return '#4CAF50';
      case 'IN_PROGRESS': return '#2196F3';
      case 'PENDING': return '#FFC107';
      case 'OVERDUE': return '#F44336';
      case 'CANCELLED': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    const isOverdue = date < today && !isToday;
    
    const formattedDate = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
    
    if (isToday) return { text: 'Hoje', isSpecial: true, isOverdue: false };
    if (isTomorrow) return { text: 'Amanhã', isSpecial: true, isOverdue: false };
    
    return { 
      text: formattedDate, 
      isSpecial: false, 
      isOverdue: isOverdue 
    };
  };
  
  // Formata a data para exibição
  const formattedDate = formatDate(item.dueDate);
  
  // Verificar se há descrição para exibir
  const hasDescription = item.description && item.description.trim().length > 0;

  return (
    <TouchableOpacity
      style={[
        styles.taskItem, 
        item.status === 'COMPLETED' && styles.completedTask,
        isPending && styles.pendingTaskItem,
        isAssignedToCurrentUser && styles.myTaskItem // Destaque para tarefas do usuário
      ]}
      onPress={() => router.push(`/tasks/${item.id}`)}
      disabled={isPending}
    >
      {/* Status indicator */}
      <View style={[styles.statusBar, { backgroundColor: getStatusColor(item.status) }]} />
      
      <View style={styles.taskContent}>
        <TouchableOpacity 
          onPress={() => onToggleStatus(item)}
          style={styles.checkboxContainer}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#7B68EE" />
          ) : (
            <Ionicons 
              name={item.status === 'COMPLETED' ? 'checkbox' : 'checkbox-outline'} 
              size={24} 
              color={item.status === 'COMPLETED' ? '#7B68EE' : '#aaa'} 
            />
          )}
        </TouchableOpacity>
        
        <View style={styles.taskMainContent}>
          <View style={styles.taskTextContainer}>
            <Text 
              style={[
                styles.taskTitle, 
                item.status === 'COMPLETED' && styles.completedTaskText
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            
            {/* Descrição da tarefa */}
            {hasDescription && (
              <Text 
                style={[
                  styles.taskDescription,
                  item.status === 'COMPLETED' && styles.completedTaskText
                ]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.description}
              </Text>
            )}
            
            {/* Category & User tags */}
            <View style={styles.taskMetaContainer}>
              {item.category && (
                <View style={styles.categoryChip}>
                  <FontAwesome5 name="tag" size={12} color="#7B68EE" />
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              )}
              
              {/* Indicador de tarefa atribuída ao usuário atual */}
              {isAssignedToCurrentUser && (
                <View style={styles.assignedToMeChip}>
                  <Ionicons name="person" size={12} color="#7B68EE" />
                  <Text style={styles.assignedToMeText}>Você</Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Right side info */}
          <View style={styles.taskRightContainer}>
            {/* Due date - Agora claramente identificado como prazo */}
            {formattedDate && (
              <View style={styles.dueDateContainer}>
                <Ionicons 
                  name="calendar" 
                  size={14} 
                  color={formattedDate.isOverdue ? '#F44336' : '#7B68EE'} 
                />
                <Text style={styles.prazoLabel}>Prazo:</Text>
                <Text 
                  style={[
                    styles.taskDueDate, 
                    formattedDate.isOverdue && styles.overdueDateText,
                    formattedDate.isSpecial && styles.specialDateText
                  ]}
                >
                  {formattedDate.text}
                </Text>
              </View>
            )}
            
            {/* Status badge */}
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}30` }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status === 'PENDING' ? 'Pendente' : 
                 item.status === 'COMPLETED' ? 'Concluída' : 
                 item.status === 'IN_PROGRESS' ? 'Em andamento' :
                 item.status === 'OVERDUE' ? 'Atrasada' : 'Cancelada'}
              </Text>
            </View>
            
            {/* Assignees */}
            {item.assignedUsers && item.assignedUsers.length > 0 && (
              <View style={styles.assigneesContainer}>
                {item.assignedUsers.slice(0, 3).map((assignee, index) => (
                  <View 
                    key={assignee.id} 
                    style={[
                      styles.assigneeAvatar, 
                      { zIndex: 10 - index, marginLeft: index > 0 ? -10 : 0 },
                      assignee.id === currentUserId && styles.currentUserAvatar
                    ]}
                  >
                    {assignee.profilePictureUrl ? (
                      <Image 
                        source={{ uri: assignee.profilePictureUrl }} 
                        style={styles.avatarImage}
                      />
                    ) : (
                      <Text style={styles.avatarInitial}>
                        {assignee.name?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    )}
                    {assignee.id === currentUserId && (
                      <View style={styles.currentUserIndicator} />
                    )}
                  </View>
                ))}
                
                {item.assignedUsers.length > 3 && (
                  <View style={[styles.assigneeAvatar, styles.moreAssigneesAvatar]}>
                    <Text style={styles.moreAssigneesText}>
                      +{item.assignedUsers.length - 3}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const TasksListScreen = () => {
  const router = useRouter();
  const { filter: urlFilter } = useLocalSearchParams<{ filter?: string }>();
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>(urlFilter || 'all');
  const [pendingTaskIds, setPendingTaskIds] = useState<number[]>([]);

  const taskFilters: FilterOption[] = [
    { key: 'all', label: 'Todas' },
    { key: 'my-tasks', label: 'Minhas Tarefas' },
    { key: 'PENDING', label: 'Pendentes' },
    { key: 'IN_PROGRESS', label: 'Em Andamento' },
    { key: 'COMPLETED', label: 'Concluídas' },
    { key: 'OVERDUE', label: 'Atrasadas' }
  ];

  const {
    tasks,
    allTasks,
    myTasks,
    loading,
    loadingMyTasks,
    fetchTasks,
    fetchMyTasks,
    applyFilter,
    completeTask,
    deleteTask,
    updateTask
  } = useTasks();

  // Inicializar o filtro a partir da URL, se fornecido
  useEffect(() => {
    if (urlFilter) {
      handleFilterChange(urlFilter);
    }
  }, [urlFilter]);

  // Função para mudar filtro localmente
  const handleFilterChange = useCallback((newFilter: string) => {
    setFilter(newFilter);
    applyFilter(newFilter);
    
    // Se o filtro for "my-tasks", certifique-se de que temos os últimos dados
    if (newFilter === 'my-tasks') {
      fetchMyTasks();
    }
  }, [applyFilter, fetchMyTasks]);

  // Implementação da atualização otimista
  const handleToggleTaskStatus = useCallback(async (task: Task) => {
    // Evita operações duplas
    if (pendingTaskIds.includes(task.id)) return;
    
    try {
      // Adiciona o ID da tarefa à lista de pendentes
      setPendingTaskIds(prev => [...prev, task.id]);
      
      // Atualiza otimisticamente o estado local primeiro
      const updatedStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      
      // Faz a requisição para o backend
      if (task.status === 'COMPLETED') {
        await updateTask(task.id, { status: 'PENDING' });
      } else {
        await completeTask(task.id);
      }
      
      // Se o filtro atual for "my-tasks", recarregue as tarefas do usuário
      if (filter === 'my-tasks') {
        fetchMyTasks();
      }
    } catch (error) {
      // Se falhar, recarrega os dados
      if (filter === 'my-tasks') {
        fetchMyTasks();
      } else {
        fetchTasks();
      }
    } finally {
      // Remove o ID da tarefa da lista de pendentes após um pequeno delay
      // para evitar uma transição abrupta
      setTimeout(() => {
        setPendingTaskIds(prev => prev.filter(id => id !== task.id));
      }, 300);
    }
  }, [pendingTaskIds, updateTask, completeTask, fetchTasks, fetchMyTasks, filter]);

  const handleDeleteTask = useCallback(async (task: Task) => {
    // Evita operações duplas
    if (pendingTaskIds.includes(task.id)) return;
    
    try {
      setPendingTaskIds(prev => [...prev, task.id]);
      await deleteTask(task.id);
      
      // Se o filtro atual for "my-tasks", recarregue as tarefas do usuário
      if (filter === 'my-tasks') {
        fetchMyTasks();
      }
    } catch (error) {
      // Se falhar, recarrega os dados
      if (filter === 'my-tasks') {
        fetchMyTasks();
      } else {
        fetchTasks();
      }
    } finally {
      setPendingTaskIds(prev => prev.filter(id => id !== task.id));
    }
  }, [pendingTaskIds, deleteTask, fetchTasks, fetchMyTasks, filter]);

  // Função para contar as tarefas do usuário atual
  const getUserTasksCount = useCallback(() => {
    return myTasks.length;
  }, [myTasks]);

  const myTasksCount = getUserTasksCount();

  // Determina qual conjunto de tarefas exibir com base no filtro
  const displayTasks = filter === 'my-tasks' ? myTasks : tasks;
  const isLoading = filter === 'my-tasks' ? loadingMyTasks : loading;

  // Função de atualização para o componente
  const refreshTasks = useCallback(() => {
    if (filter === 'my-tasks') {
      fetchMyTasks();
    } else {
      fetchTasks();
    }
  }, [fetchMyTasks, fetchTasks, filter]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Tarefas</Text>
        
        {/* Contador de minhas tarefas */}
        {myTasksCount > 0 && (
          <View style={styles.myTasksCountContainer}>
            <Text style={styles.myTasksCountText}>
              Você tem {myTasksCount} tarefa{myTasksCount !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
        
        <TaskFilter 
          filters={taskFilters}
          activeFilter={filter}
          onFilterChange={handleFilterChange}
        />
      </View>

      <FlatList
        data={displayTasks}
        keyExtractor={(item) => item.id?.toString() || ''}
        renderItem={({ item }) => (
          <TaskItem 
            item={item}
            onToggleStatus={handleToggleTaskStatus}
            onDeleteTask={handleDeleteTask}
            currentUserId={user?.uid}
            pendingTaskIds={pendingTaskIds}
          />
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyStateContainer}>
            <MaterialCommunityIcons 
              name="checkbox-marked-outline" 
              size={64} 
              color="#7B68EE" 
            />
            <Text style={styles.emptyStateText}>
              {isLoading ? 'Carregando tarefas...' : 
               filter === 'my-tasks' ? 'Nenhuma tarefa atribuída a você' : 
               'Nenhuma tarefa encontrada'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {!isLoading && filter !== 'my-tasks' && 'Crie sua primeira tarefa clicando no botão "+"'}
              {!isLoading && filter === 'my-tasks' && 'As tarefas atribuídas a você aparecerão aqui'}
            </Text>
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && pendingTaskIds.length === 0}
            onRefresh={refreshTasks}
            colors={['#7B68EE']}
            tintColor={'#7B68EE'}
          />
        }
        contentContainerStyle={[
          styles.listContainer,
          displayTasks.length === 0 && { flex: 1, justifyContent: 'center' }
        ]}
      />

      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => router.push('/(panel)/tasks/create')}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#222',
  },
  headerContainer: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  myTasksCountContainer: {
    marginBottom: 12,
  },
  myTasksCountText: {
    color: '#7B68EE',
    fontSize: 16,
    fontWeight: '500',
  },
  listContainer: {
    flexGrow: 1,
    backgroundColor: '#222',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  taskItem: {
    backgroundColor: '#333',
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  pendingTaskItem: {
    opacity: 0.8,
  },
  myTaskItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#7B68EE',
  },
  statusBar: {
    width: 5,
    height: '100%',
  },
  completedTask: {
    opacity: 0.7,
  },
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 15,
  },
  checkboxContainer: {
    marginRight: 12,
    alignSelf: 'flex-start',
    paddingTop: 2,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskMainContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  taskTitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
    fontWeight: '600',
  },
  taskDescription: {
    fontSize: 14,
    color: '#bbb',
    marginBottom: 6,
    lineHeight: 18,
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  taskMetaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 4, // Espaço após a descrição/título
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4, // Espaço entre linhas de tags
  },
  categoryText: {
    color: '#7B68EE',
    fontSize: 12,
    marginLeft: 4,
  },
  assignedToMeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  assignedToMeText: {
    color: '#7B68EE',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  prazoLabel: {
    fontSize: 12,
    color: '#aaa',
    marginLeft: 4,
    marginRight: 2,
  },
  republicName: {
    color: '#aaa',
    fontSize: 12,
    maxWidth: 120,
  },
  taskRightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: 90,
    marginLeft: 8, // Mais espaço entre o conteúdo e o lado direito
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskDueDate: {
    fontSize: 12,
    color: '#7B68EE',
    marginLeft: 4,
  },
  overdueDateText: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  specialDateText: {
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  assigneesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assigneeAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  currentUserAvatar: {
    borderColor: '#7B68EE',
    backgroundColor: '#444',
  },
  avatarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  currentUserIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7B68EE',
    borderWidth: 1,
    borderColor: '#333',
  },
  moreAssigneesAvatar: {
    backgroundColor: 'rgba(123, 104, 238, 0.3)',
  },
  moreAssigneesText: {
    color: '#7B68EE',
    fontSize: 10,
    fontWeight: 'bold',
  },
  taskActions: {
    marginLeft: 8,
    justifyContent: 'center',
  },
  deleteButton: {
    padding: 5,
    marginLeft: 8,
    alignSelf: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7B68EE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7B68EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 10,
    textAlign: 'center',
  },
});
  
export default TasksListScreen;