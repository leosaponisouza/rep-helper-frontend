// app/(panel)/tasks/tasks-list.tsx
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
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import TaskFilter, { FilterOption } from '../../../components/TaskFilter';
import { useTasks } from '../../../src/hooks/useTasks';
import { useAuth } from '../../../src/context/AuthContext';
import EnhancedTaskItem from '../../../components/TaskItem';

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
  const handleToggleTaskStatus = useCallback(async (task: any) => {
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
      } else {
        fetchTasks();
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

  // Função para navegar para os detalhes da tarefa
  const navigateToTaskDetails = (taskId: number) => {
    router.push(`/(panel)/tasks/${taskId}`);
  };

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
          <EnhancedTaskItem 
            item={item}
            onToggleStatus={handleToggleTaskStatus}
            currentUserId={user?.uid}
            pendingTaskIds={pendingTaskIds}
            onPress={navigateToTaskDetails}
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