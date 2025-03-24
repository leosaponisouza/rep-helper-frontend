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
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTasks } from '../../../src/hooks/useTasks';
import { useAuth } from '../../../src/context/AuthContext';
import TaskItem from '../../../components/TaskItem';
import { Task } from '../../../src/models/task.model';

// Componente otimizado para o filtro
const FilterButton = React.memo(({ 
  label, 
  isActive, 
  onPress 
}: { 
  label: string; 
  isActive: boolean; 
  onPress: () => void 
}) => (
  <TouchableOpacity
    style={[
      styles.filterButton,
      isActive && styles.activeFilterButton
    ]}
    onPress={onPress}
  >
    <Text style={[
      styles.filterText,
      isActive && styles.activeFilterText
    ]}>
      {label}
    </Text>
  </TouchableOpacity>
));

// Componente para ordenação
const SortButton = React.memo(({ 
  field, 
  label, 
  currentSortBy, 
  currentDirection,
  onSort 
}: { 
  field: string;
  label: string; 
  currentSortBy: string;
  currentDirection: string;
  onSort: (field: string, direction: 'ASC' | 'DESC') => void;
}) => {
  const isActive = currentSortBy === field;
  const nextDirection = isActive && currentDirection === 'ASC' ? 'DESC' : 'ASC';
  
  const handleSort = useCallback(() => {
    onSort(field, nextDirection);
  }, [field, nextDirection, onSort]);
  
  return (
    <TouchableOpacity
      style={[
        styles.sortButton,
        isActive && styles.activeSortButton
      ]}
      onPress={handleSort}
    >
      <Text style={[
        styles.sortText,
        isActive && styles.activeSortText
      ]}>
        {label} {isActive && (currentDirection === 'ASC' ? '↑' : '↓')}
      </Text>
    </TouchableOpacity>
  );
});

// Componente otimizado para o estado vazio
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
      size={64} 
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

const TasksListScreen = () => {
  const router = useRouter();
  const { filter: urlFilter } = useLocalSearchParams<{ filter?: string }>();
  const { user } = useAuth();
  
  // Inicializa o estado do filtro apenas uma vez
  const [filter, setFilter] = useState<string>(() => urlFilter || 'all');
  const [pendingTaskIds, setPendingTaskIds] = useState<number[]>([]);
  const scrollViewRef = useRef(null);
  
  // Referência para controlar debounce de ordenação
  const sortingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Evita re-renderizações desnecessárias
  const taskFilters = useMemo(() => [
    { key: 'all', label: 'Todas' },
    { key: 'my-tasks', label: 'Minhas' },
    { key: 'PENDING', label: 'Pendentes' },
    { key: 'IN_PROGRESS', label: 'Em Andamento' },
    { key: 'COMPLETED', label: 'Concluídas' },
    { key: 'OVERDUE', label: 'Atrasadas' },
    { key: 'recurring', label: 'Recorrentes' }
  ], []);

  // Usando useRef para garantir que o objeto de opções não mude entre renderizações
  const taskOptionsRef = useRef({
    initialFilterStatus: urlFilter as any || 'all',
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
    // Novos estados e funções de paginação
    currentPage,
    pageSize,
    totalPages,
    totalElements,
    isLastPage,
    loadMoreTasks,
    changePageSize,
    // Novos estados e funções de ordenação
    sortBy,
    sortDirection,
    changeSorting
  } = useTasks(taskOptionsRef.current);

  // Efeito para aplicar o filtro inicial apenas uma vez na montagem
  useEffect(() => {
    // Aplica o filtro quando o componente é montado
    if (filter) {
      applyFilter(filter);
    }
  }, []); // Execute apenas uma vez na montagem
    
  // Função para mudar filtro localmente
  const handleFilterChange = useCallback((newFilter: string) => {
    // Evita aplicar o mesmo filtro novamente
    if (filter === newFilter) return;
    
    console.log(`Changing filter to: ${newFilter}`);
    setFilter(newFilter);
    
    // Aplica o filtro imediatamente
    applyFilter(newFilter);
  }, [applyFilter, filter]);

  // Implementação da atualização otimista
  const handleToggleTaskStatus = useCallback(async (task: Task) => {
    // Evita operações duplas
    if (pendingTaskIds.includes(task.id)) return;
    
    try {
      // Adiciona o ID da tarefa à lista de pendentes
      setPendingTaskIds(prev => [...prev, task.id]);
      
      // Faz a requisição para o backend
      if (task.status === 'COMPLETED') {
        await updateTask(task.id, { status: 'PENDING' });
      } else {
        await completeTask(task.id);
      }
    } catch (error) {
      console.error('Erro ao alterar status da tarefa:', error);
    } finally {
      // Remove o ID da tarefa da lista de pendentes após um pequeno delay
      // para evitar uma transição abrupta
      setTimeout(() => {
        setPendingTaskIds(prev => prev.filter(id => id !== task.id));
      }, 300);
    }
  }, [pendingTaskIds, updateTask, completeTask]);

  // Função para interromper a recorrência de uma tarefa
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

  // Função para navegar para os detalhes da tarefa
  const navigateToTaskDetails = useCallback((taskId: number) => {
    router.push(`/(panel)/tasks/${taskId}`);
  }, [router]);

  // Determina qual conjunto de tarefas exibir com base no filtro
  const displayTasks = useMemo((): Task[] => {
    // Se não há tarefas, retorna array vazio para evitar erros
    if (!tasks && !myTasks) return [];
    
    // Retorna diretamente as tarefas já filtradas pelo backend
    // O hook useTasks já aplica os filtros no servidor
    return tasks || [];
  }, [tasks, myTasks]);
  
  const isLoading = useMemo(() => 
    filter === 'my-tasks' ? loadingMyTasks : loading,
    [filter, loadingMyTasks, loading]
  );

  // Função de atualização para o componente com proteção contra múltiplas chamadas
  const refreshTasks = useCallback(() => {
    // Evita múltiplas chamadas simultâneas
    if (isLoading) return;
    
    if (filter === 'my-tasks') {
      fetchMyTasks(true, 0); // força atualização e reseta para a primeira página
    } else {
      fetchTasks(true, 0); // força atualização e reseta para a primeira página
    }
  }, [fetchMyTasks, fetchTasks, filter, isLoading]);
  
  // Otimização para o renderItem da FlatList
  const renderTaskItem = useCallback(({ item }: { item: Task }) => (
    <TaskItem 
      item={item}
      onToggleStatus={handleToggleTaskStatus}
      currentUserId={user?.uid}
      pendingTaskIds={pendingTaskIds}
      onPress={navigateToTaskDetails}
      onStopRecurrence={item.recurring ? handleStopRecurrence : undefined}
    />
  ), [handleToggleTaskStatus, user?.uid, pendingTaskIds, navigateToTaskDetails, handleStopRecurrence]);
  
  // Otimização para o keyExtractor da FlatList
  const keyExtractor = useCallback((item: Task) => item.id?.toString() || '', []);
  
  // Otimização para o ListEmptyComponent da FlatList
  const renderEmptyComponent = useCallback(() => (
    <EmptyState isLoading={isLoading} filter={filter} />
  ), [isLoading, filter]);
  
  // Otimização para o contentContainerStyle da FlatList
  const getContentContainerStyle = useCallback((isEmpty: boolean) => {
    if (isEmpty) {
      return {
        ...styles.listContainer,
        flex: 1,
        justifyContent: 'center' as const
      };
    }
    return styles.listContainer;
  }, []);
  
  // Otimização para o ListFooterComponent da FlatList
  const renderFooterComponent = useCallback(() => {
    // Se não há tarefas, não mostra footer
    if (displayTasks.length === 0) {
      return null;
    }
    
    // Se chegamos na última página e temos tarefas
    if (isLastPage && totalElements > 0) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            Fim da lista • {totalElements} tarefas encontradas
          </Text>
        </View>
      );
    }
    
    // Se estamos carregando mais tarefas
    if (loading && !isLoading && currentPage > 0) {
      return (
        <View style={styles.loadingFooter}>
          <Text style={styles.loadingText}>Carregando mais tarefas...</Text>
        </View>
      );
    }
    
    return null;
  }, [isLastPage, displayTasks.length, totalElements, loading, isLoading, currentPage]);
  
  // Função para alterar a ordenação - CORRIGIDA
  const handleChangeSorting = useCallback((field: string, direction: 'ASC' | 'DESC') => {
    // Limpa timeout anterior se existir para evitar múltiplas chamadas
    if (sortingTimeoutRef.current) {
      clearTimeout(sortingTimeoutRef.current);
    }
    
    // Converter campos com underscore para camelCase
    const fieldCamelCase = field === 'due_date' ? 'dueDate' : 
                           field === 'created_at' ? 'createdAt' : field;
    
    // Define novo timeout para evitar múltiplas requisições em rápida sucessão
    sortingTimeoutRef.current = setTimeout(() => {
      if (changeSorting && typeof changeSorting === 'function') {
        // Aplicar a mudança de ordenação
        changeSorting(fieldCamelCase, direction);
        
        // Força uma atualização imediata dos dados com a nova ordenação
        // Isto corrige o problema da lista não atualizando
        if (filter === 'my-tasks') {
          fetchMyTasks(true, currentPage);
        } else {
          fetchTasks(true, currentPage);
        }
      }
      
      sortingTimeoutRef.current = null;
    }, 300); // Delay de 300ms para debounce
  }, [changeSorting, filter, fetchMyTasks, fetchTasks, currentPage]);

  // Função para alterar o tamanho da página
  const handleChangePageSize = useCallback((newSize: number) => {
    if (changePageSize && typeof changePageSize === 'function') {
      changePageSize(newSize);
      
      // Força atualização dos dados após mudar o tamanho da página
      if (filter === 'my-tasks') {
        fetchMyTasks(true, 0); // Volta para a primeira página
      } else {
        fetchTasks(true, 0); // Volta para a primeira página
      }
    }
  }, [changePageSize, filter, fetchMyTasks, fetchTasks]);
  
  // Componente para seleção de tamanho de página
  const renderPageSizeSelector = useCallback(() => {
    const pageSizeOptions = [10, 20, 50, 100];
    
    return (
      <View style={styles.pageSizeSelectorContainer}>
        <Text style={styles.pageSizeSelectorLabel}>Itens por página:</Text>
        <View style={styles.pageSizeOptions}>
          {pageSizeOptions.map(size => (
            <TouchableOpacity
              key={size}
              style={[
                styles.pageSizeOption,
                pageSize === size && styles.activePageSizeOption
              ]}
              onPress={() => handleChangePageSize(size)}
            >
              <Text style={[
                styles.pageSizeOptionText,
                pageSize === size && styles.activePageSizeOptionText
              ]}>
                {size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }, [pageSize, handleChangePageSize]);

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
            <FilterButton
              key={filterItem.key}
              label={filterItem.label}
              isActive={filter === filterItem.key}
              onPress={() => handleFilterChange(filterItem.key)}
            />
          ))}
        </ScrollView>
      </View>
      
      {/* Ordenação */}
      <View style={styles.sortSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortContainer}
        >
          <SortButton
            field="dueDate"
            label="Data"
            currentSortBy={sortBy}
            currentDirection={sortDirection}
            onSort={handleChangeSorting}
          />
          <SortButton
            field="title"
            label="Título"
            currentSortBy={sortBy}
            currentDirection={sortDirection}
            onSort={handleChangeSorting}
          />
          <SortButton
            field="createdAt"
            label="Criação"
            currentSortBy={sortBy}
            currentDirection={sortDirection}
            onSort={handleChangeSorting}
          />
          <SortButton
            field="status"
            label="Status"
            currentSortBy={sortBy}
            currentDirection={sortDirection}
            onSort={handleChangeSorting}
          />
        </ScrollView>
        
        {totalElements > 0 && (
          <Text style={styles.paginationInfo}>
            Mostrando {Math.min(pageSize * (currentPage + 1), totalElements)} de {totalElements} tarefas
          </Text>
        )}
      </View>

      {/* Lista de tarefas */}
      <FlatList<Task>
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
        contentContainerStyle={getContentContainerStyle(displayTasks.length === 0)}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
        onEndReached={() => {
          // Evita múltiplas chamadas durante o carregamento
          if (!isLoading && !isLastPage && !loading) {
            loadMoreTasks();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooterComponent}
      />

      {/* Seletor de tamanho de página */}
      {!isLoading && displayTasks.length > 0 && totalElements > pageSize && renderPageSizeSelector()}

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
  // Ordenação
  sortSection: {
    backgroundColor: '#2A2A2A',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  sortContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#444',
  },
  activeSortButton: {
    backgroundColor: '#555',
    borderColor: '#7B68EE',
  },
  sortText: {
    color: '#aaa',
    fontSize: 12,
  },
  activeSortText: {
    color: '#fff',
  },
  paginationInfo: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
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
  // Footer de carregamento
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#aaa',
    fontSize: 14,
  },
  // Footer da lista
  footerContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginTop: 10,
  },
  footerText: {
    color: '#888',
    fontSize: 12,
  },
  // Seletor de tamanho de página
  pageSizeSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#2A2A2A',
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  pageSizeSelectorLabel: {
    color: '#aaa',
    fontSize: 12,
    marginRight: 10,
  },
  pageSizeOptions: {
    flexDirection: 'row',
  },
  pageSizeOption: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#444',
  },
  activePageSizeOption: {
    backgroundColor: '#555',
    borderColor: '#7B68EE',
  },
  pageSizeOptionText: {
    color: '#aaa',
    fontSize: 12,
  },
  activePageSizeOptionText: {
    color: '#fff',
  },
});
  
export default TasksListScreen;