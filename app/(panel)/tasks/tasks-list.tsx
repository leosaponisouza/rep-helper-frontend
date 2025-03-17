// app/(panel)/tasks/tasks-list.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  SafeAreaView,
  StatusBar,
  ScrollView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTasks } from '../../../src/hooks/useTasks';
import { useAuth } from '../../../src/context/AuthContext';
import EnhancedTaskItem from '../../../components/TaskItem';

const TasksListScreen = () => {
  const router = useRouter();
  const { filter: urlFilter } = useLocalSearchParams<{ filter?: string }>();
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>(urlFilter || 'all');
  const [pendingTaskIds, setPendingTaskIds] = useState<number[]>([]);
  const scrollViewRef = useRef(null);

  const taskFilters = [
    { key: 'all', label: 'Todas' },
    { key: 'my-tasks', label: 'Minhas' },
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
      
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Tarefas</Text>
      </View>
      
      {/* Filtros no estilo das outras telas */}
      <View style={styles.filtersSection}>
        <ScrollView 
          ref={scrollViewRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {taskFilters.map((filterItem) => (
            <TouchableOpacity
              key={filterItem.key}
              style={[
                styles.filterButton,
                filter === filterItem.key && styles.activeFilterButton
              ]}
              onPress={() => handleFilterChange(filterItem.key)}
            >
              <Text style={[
                styles.filterText,
                filter === filterItem.key && styles.activeFilterText
              ]}>
                {filterItem.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista de tarefas */}
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

      {/* Botão de adicionar */}
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
  // Header
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Filtros
  filtersSection: {
    backgroundColor: '#2A2A2A',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#444',
  },
  activeFilterButton: {
    backgroundColor: '#7B68EE',
    borderColor: '#7B68EE',
  },
  filterText: {
    color: '#aaa',
    fontSize: 14,
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Lista
  listContainer: {
    flexGrow: 1,
    backgroundColor: '#222',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  // Estado vazio
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
  // Botão de adicionar
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
});
  
export default TasksListScreen;