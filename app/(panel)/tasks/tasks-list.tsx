// app/(panel)/tasks/tasks-list.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Dimensions,
  Animated,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTasks } from '@/src/hooks/useTasks';
import { useAuth } from '@/src/context/AuthContext';
import TaskItem from '@/components/TaskItem';
import { Task } from '@/src/models/task.model';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32; // Ajustado para melhor visualização
const CARD_HEIGHT = 180;

// Componente para o estado vazio
const EmptyState = React.memo(({ 
  isLoading, 
  filter 
}: { 
  isLoading: boolean; 
  filter: string 
}) => (
  <View style={styles.emptyStateContainer}>
    <MaterialCommunityIcons 
      name="checkbox-marked-outline" 
      size={80} 
      color="#7B68EE" 
    />
    <Text style={styles.emptyStateText}>
      {isLoading ? 'Carregando tarefas...' : 
       filter === 'my-tasks' ? 'Nenhuma tarefa atribuída a você' : 
       filter === 'recurring' ? 'Nenhuma tarefa recorrente encontrada' :
       'Nenhuma tarefa encontrada'}
    </Text>
    <Text style={styles.emptyStateSubtext}>
      {!isLoading && filter !== 'my-tasks' && filter !== 'recurring' && 'Crie sua primeira tarefa clicando no botão "+"'}
      {!isLoading && filter === 'my-tasks' && 'As tarefas atribuídas a você aparecerão aqui'}
      {!isLoading && filter === 'recurring' && 'Crie tarefas recorrentes para visualizá-las aqui'}
    </Text>
  </View>
));

// Componente para o filtro de tarefas
const TaskFilter = React.memo(({ 
  filter, 
  onFilterChange,
  stats
}: { 
  filter: string;
  onFilterChange: (newFilter: string) => void;
  stats: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    recurring: number;
  } | null;
}) => {
  const filters = [
    { key: 'my-tasks', label: 'Minhas Tarefas', icon: 'account-check', count: stats?.total || 0 },
    { key: 'PENDING', label: 'Pendentes', icon: 'clock-outline', count: stats?.pending || 0 },
    { key: 'IN_PROGRESS', label: 'Em Andamento', icon: 'progress-clock', count: stats?.inProgress || 0 },
    { key: 'COMPLETED', label: 'Concluídas', icon: 'check-circle', count: stats?.completed || 0 },
    { key: 'OVERDUE', label: 'Atrasadas', icon: 'alert-circle', count: stats?.overdue || 0 },
    { key: 'recurring', label: 'Recorrentes', icon: 'repeat', count: stats?.recurring || 0 }
  ];

  return (
    <View style={styles.filterWrapper}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterButton,
              filter === f.key && styles.filterButtonActive
            ]}
            onPress={() => onFilterChange(f.key)}
          >
            <View style={styles.filterIconContainer}>
              <MaterialCommunityIcons 
                name={f.icon as any} 
                size={18} 
                color={filter === f.key ? '#fff' : '#aaa'} 
              />
            </View>
            <Text 
              style={[
                styles.filterButtonText,
                filter === f.key && styles.filterButtonTextActive
              ]}
            >
              {f.label}
            </Text>
            <View style={[
              styles.filterCount,
              filter === f.key && styles.filterCountActive
            ]}>
              <Text style={[
                styles.filterCountText,
                filter === f.key && styles.filterCountTextActive
              ]}>
                {f.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
});

// Componente para checkbox moderno
const ModernCheckbox = React.memo(({ 
  isCompleted, 
  isPending, 
  onPress 
}: { 
  isCompleted: boolean, 
  isPending: boolean, 
  onPress: () => void 
}) => (
  <TouchableOpacity
    style={[
      styles.modernCheckbox,
      isCompleted && styles.modernCheckboxCompleted
    ]}
    onPress={onPress}
    disabled={isPending}
    activeOpacity={0.7}
  >
    {isPending ? (
      <ActivityIndicator size="small" color="#fff" />
    ) : isCompleted ? (
      <MaterialCommunityIcons name="check" size={18} color="#fff" />
    ) : null}
  </TouchableOpacity>
));

const TasksListScreen = () => {
  const router = useRouter();
  const { filter: urlFilter } = useLocalSearchParams<{ filter?: string }>();
  const { user } = useAuth();
  
  const [filter, setFilter] = useState<string>(() => urlFilter || 'my-tasks');
  const [pendingTaskIds, setPendingTaskIds] = useState<number[]>([]);
  const scrollY = useRef(new Animated.Value(0)).current;
  const sortingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const taskOptionsRef = useRef({
    initialFilterStatus: urlFilter as any || 'my-tasks',
    pageSize: 20
  });

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
    updateTask,
    currentPage,
    pageSize,
    totalPages,
    totalElements,
    isLastPage,
    loadMoreTasks,
    changePageSize,
    sortBy,
    sortDirection,
    changeSorting
  } = useTasks(taskOptionsRef.current);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const tasksToCount = filter === 'my-tasks' ? myTasks : allTasks;
    if (!tasksToCount) return null;

    return {
      total: tasksToCount.length,
      pending: tasksToCount.filter(t => t.status === 'PENDING').length,
      inProgress: tasksToCount.filter(t => t.status === 'IN_PROGRESS').length,
      completed: tasksToCount.filter(t => t.status === 'COMPLETED').length,
      overdue: tasksToCount.filter(t => t.status === 'OVERDUE').length,
      recurring: tasksToCount.filter(t => t.recurring).length
    };
  }, [filter, myTasks, allTasks]);

  useEffect(() => {
    if (filter) {
      applyFilter(filter);
    }
  }, []);
    
  const handleFilterChange = useCallback((newFilter: string) => {
    if (filter === newFilter) return;
    
    console.log(`Changing filter to: ${newFilter}`);
    setFilter(newFilter);
    applyFilter(newFilter);
  }, [applyFilter, filter]);

  const handleToggleTaskStatus = useCallback(async (task: Task) => {
    if (pendingTaskIds.includes(task.id)) return;
    
    try {
      setPendingTaskIds(prev => [...prev, task.id]);
      
      if (task.status === 'COMPLETED') {
        await updateTask(task.id, { status: 'PENDING' });
      } else {
        await completeTask(task.id);
      }
    } catch (error) {
      console.error('Erro ao alterar status da tarefa:', error);
    } finally {
      setTimeout(() => {
        setPendingTaskIds(prev => prev.filter(id => id !== task.id));
      }, 300);
    }
  }, [pendingTaskIds, updateTask, completeTask]);

  const handleStopRecurrence = useCallback((taskId: number) => {
    Alert.alert(
      "Interromper recorrência",
      "Deseja interromper a recorrência desta tarefa?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Interromper",
          style: "destructive",
          onPress: async () => {
            try {
              setPendingTaskIds(prev => [...prev, taskId]);
              await updateTask(taskId, { recurring: false });
              
              Alert.alert(
                "Sucesso",
                "A recorrência da tarefa foi interrompida com sucesso."
              );
            } catch (error) {
              Alert.alert(
                "Erro",
                "Não foi possível interromper a recorrência da tarefa."
              );
            } finally {
              setTimeout(() => {
                setPendingTaskIds(prev => prev.filter(id => id !== taskId));
              }, 300);
            }
          }
        }
      ]
    );
  }, [updateTask]);

  const navigateToTaskDetails = useCallback((taskId: number) => {
    router.push(`/(panel)/tasks/${taskId}`);
  }, [router]);

  const displayTasks = useMemo((): Task[] => {
    if (!tasks && !myTasks) return [];
    return tasks || [];
  }, [tasks, myTasks]);
  
  const isLoading = useMemo(() => 
    filter === 'my-tasks' ? loadingMyTasks : loading,
    [filter, loadingMyTasks, loading]
  );

  const refreshTasks = useCallback(() => {
    if (isLoading) return;
    
    if (filter === 'my-tasks') {
      fetchMyTasks(true, 0);
    } else {
      fetchTasks(true, 0);
    }
  }, [fetchMyTasks, fetchTasks, filter, isLoading]);

  const handleDeleteTask = useCallback((taskId: number) => {
    Alert.alert(
      "Excluir tarefa",
      "Tem certeza que deseja excluir esta tarefa?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              setPendingTaskIds(prev => [...prev, taskId]);
              await deleteTask(taskId);
              Alert.alert(
                "Sucesso",
                "Tarefa excluída com sucesso."
              );
            } catch (error) {
              Alert.alert(
                "Erro",
                "Não foi possível excluir a tarefa."
              );
            } finally {
              setTimeout(() => {
                setPendingTaskIds(prev => prev.filter(id => id !== taskId));
              }, 300);
            }
          }
        }
      ]
    );
  }, [deleteTask]);

  const renderTaskItem = useCallback(({ item, index }: { item: Task; index: number }) => {
    const inputRange = [
      -1,
      0,
      (CARD_HEIGHT + 20) * index,
      (CARD_HEIGHT + 20) * (index + 1),
    ];

    const opacity = scrollY.interpolate({
      inputRange,
      outputRange: [1, 1, 1, 0],
    });

    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [1, 1, 1, 0.8],
    });

    const isPending = pendingTaskIds.includes(item.id);
    const isCompleted = item.status === 'COMPLETED';

    return (
      <Animated.View style={[
        styles.taskCardContainer,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}>
        <View style={styles.taskItemWithCheckbox}>
          {/* Checkbox moderno */}
          <ModernCheckbox 
            isCompleted={isCompleted}
            isPending={isPending}
            onPress={() => handleToggleTaskStatus(item)}
          />
          
          {/* TaskItem */}
          <View style={styles.taskItemContainer}>
            <TaskItem
              item={item}
              onPress={navigateToTaskDetails}
              onToggleStatus={handleToggleTaskStatus}
              pendingTaskIds={pendingTaskIds}
              currentUserId={user?.uid}
              onStopRecurrence={item.recurring ? handleStopRecurrence : undefined}
              variant="detailed"
            />
          </View>
        </View>
      </Animated.View>
    );
  }, [scrollY, handleToggleTaskStatus, user?.uid, pendingTaskIds, navigateToTaskDetails, handleStopRecurrence]);
  
  const keyExtractor = useCallback((item: Task) => item.id?.toString() || '', []);
  
  const renderEmptyComponent = useCallback(() => (
    <EmptyState isLoading={isLoading} filter={filter} />
  ), [isLoading, filter]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      {/* Header com título e botão de adicionar */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Tarefas</Text>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => router.push('/(panel)/tasks/create')}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtros de tarefas */}
      <TaskFilter 
        filter={filter}
        onFilterChange={handleFilterChange}
        stats={stats}
      />

      {/* Lista de tarefas com animações */}
      <Animated.FlatList<Task>
        data={displayTasks}
        keyExtractor={keyExtractor}
        renderItem={renderTaskItem}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && pendingTaskIds.length === 0 && currentPage === 0}
            onRefresh={refreshTasks}
            colors={['#7B68EE']}
            tintColor={'#7B68EE'}
          />
        }
        contentContainerStyle={styles.listContainer}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={5}
        initialNumToRender={5}
        onEndReached={() => {
          if (!isLoading && !isLastPage && !loading) {
            loadMoreTasks();
          }
        }}
        onEndReachedThreshold={0.5}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#222',
  },
  // Header
  headerContainer: {
    backgroundColor: '#333',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Filtros
  filterWrapper: {
    backgroundColor: '#222',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    height: 36,
  },
  filterButtonActive: {
    backgroundColor: '#7B68EE',
  },
  filterIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonText: {
    color: '#aaa',
    fontSize: 13,
    marginHorizontal: 4,
    textAlign: 'center',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  filterCount: {
    backgroundColor: '#444',
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  filterCountActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterCountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  filterCountTextActive: {
    color: '#fff',
  },
  // Lista
  listContainer: {
    padding: 16,
  },
  taskCardContainer: {
    width: '100%',
    marginBottom: 16,
  },
  taskItemWithCheckbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  taskItemContainer: {
    flex: 1,
    paddingLeft: 4,
  },
  modernCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#7B68EE',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginLeft: 4,
    marginTop: 24,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  modernCheckboxCompleted: {
    backgroundColor: '#7B68EE',
    borderColor: '#7B68EE',
  },
  // Estado vazio
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyStateText: {
    fontSize: 20,
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  // Botão de adicionar
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7B68EE',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#7B68EE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
  
export default TasksListScreen;