// src/hooks/useTasks.ts - Fixed to prevent infinite loops
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ErrorHandler } from '../utils/errorHandling';
import { useAuth } from '../context/AuthContext';
import { Task, RecurrenceType } from '../models/task.model';
import { TaskFilterRequest } from '../models/taskFilter.model';
import { PagedResponse } from '../models/pagedResponse.model';
import useTaskRecurrence from './useTaskRecurrence';
import * as taskService from '../services/taskService';

interface UseTasksOptions {
  republicId?: string;
  initialFilterStatus?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED' | 'all' | 'my-tasks' | 'recurring';
  pageSize?: number;
  initialSortBy?: string;
  initialSortDirection?: 'ASC' | 'DESC';
}

export const useTasks = (options: UseTasksOptions = {}) => {
  const { user } = useAuth();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]); // Tarefas atribuídas ao usuário
  const [loading, setLoading] = useState(true);
  const [loadingMyTasks, setLoadingMyTasks] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(
    options.initialFilterStatus
  );
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(options.pageSize || 20);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [isLastPage, setIsLastPage] = useState<boolean>(false);
  
  // Estados para ordenação
  const [sortBy, setSortBy] = useState<string>(options.initialSortBy || 'dueDate');
  const [sortDirection, setSortDirection] = useState<string>(options.initialSortDirection || 'ASC');
  
  // Estado para filtros avançados
  const [activeFilter, setActiveFilter] = useState<TaskFilterRequest>({});
  
  const { handleRecurringTaskCompletion } = useTaskRecurrence();
  
  // Referências para controlar requisições simultâneas
  const isFetchingTasks = useRef(false);
  const isFetchingMyTasks = useRef(false);
  const pendingRefresh = useRef(false);
  
  // ⚠️ NEW: Use refs to track current page to break dependency cycle
  const currentPageRef = useRef(0);
  
  // ⚠️ NEW: Track initialization state
  const isInitialized = useRef(false);

  // Cache de tarefas para atualização otimista
  const tasksCache = useRef<Map<number, Task>>(new Map());

  // Filtra as tarefas localmente baseado no status atual
  const tasks = useMemo(() => {
    // Se o filtro for "my-tasks", retorna o array de myTasks já filtrado do servidor
    if (filterStatus === 'my-tasks') {
      // Aplicar filtro de status adicional se especificado
      if (options.initialFilterStatus && options.initialFilterStatus !== 'all' && options.initialFilterStatus !== 'my-tasks') {
        return myTasks.filter(task => task.status === options.initialFilterStatus);
      }
      return myTasks;
    }
    
    // Se o filtro for "recurring", retorna apenas tarefas recorrentes
    if (filterStatus === 'recurring') {
      return allTasks.filter(task => task.is_recurring);
    }

    // Para outros filtros, filtra o array de todas as tarefas
    if (!filterStatus || filterStatus === 'all') {
      return allTasks;
    }
    
    return allTasks.filter(task => task.status === filterStatus);
  }, [allTasks, myTasks, filterStatus, options.initialFilterStatus]);

  // ⚠️ FIXED: Removed currentPage from dependency array and use ref instead
  const fetchTasks = useCallback(async (force = false, page?: number, filter?: TaskFilterRequest) => {
    // Evita múltiplas requisições simultâneas
    if (isFetchingTasks.current && !force) {
      pendingRefresh.current = true;
      return;
    }

    try {
      isFetchingTasks.current = true;
      setLoading(true);
      setError(null);

      // Usar o filtro fornecido ou o filtro ativo atual
      const taskFilter = filter || activeFilter;
      
      // ⚠️ FIXED: Use pageRef or provided page
      const pageToFetch = page !== undefined ? page : currentPageRef.current;
      
      // Buscar tarefas com filtros e paginação
      const response = await taskService.getTasksWithFilters(
        taskFilter,
        options.republicId,
        pageToFetch,
        pageSize,
        sortBy,
        sortDirection
      );
      
      // Atualizar o cache de tarefas
      response.content.forEach((task: Task) => {
        tasksCache.current.set(task.id, task);
      });
      
      
      currentPageRef.current = response.page;
      
      // Atualizar estados de paginação (agora é seguro porque o ref já foi atualizado)
      setCurrentPage(response.page);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setIsLastPage(response.last);
      
      // Se for a primeira página ou uma nova busca, substituir as tarefas
      // Caso contrário, adicionar às tarefas existentes (para "carregar mais")
      if (pageToFetch === 0 || force) {
        setAllTasks(response.content);
      } else {
        setAllTasks(prev => [...prev, ...response.content]);
      }
    } catch (err) {
      const parsedError = await ErrorHandler.parseError(err);
      setError(parsedError.message);
      ErrorHandler.logError(parsedError);
    } finally {
      setLoading(false);
      isFetchingTasks.current = false;
      
      // Se houver uma atualização pendente, execute-a
      if (pendingRefresh.current) {
        pendingRefresh.current = false;
        setTimeout(() => fetchTasks(true), 100);
      }
    }
  }, [options.republicId, pageSize, sortBy, sortDirection, activeFilter]); // ⚠️ FIXED: Removed currentPage
  
  // ⚠️ FIXED: Same changes for fetchMyTasks - removed currentPage from deps & use ref
  const fetchMyTasks = useCallback(async (force = false, page?: number, filter?: TaskFilterRequest) => {
    // Evita múltiplas requisições simultâneas
    if (isFetchingMyTasks.current && !force) {
      return;
    }

    try {
      isFetchingMyTasks.current = true;
      setLoadingMyTasks(true);
      
      // Usar o filtro fornecido ou o filtro ativo atual
      const taskFilter = filter || activeFilter;
      
      // ⚠️ FIXED: Use pageRef or provided page
      const pageToFetch = page !== undefined ? page : currentPageRef.current;
      
      // Buscar tarefas atribuídas com filtros e paginação
      const response = await taskService.getAssignedTasksWithFilters(
        taskFilter,
        pageToFetch,
        pageSize,
        sortBy,
        sortDirection
      );
      
      // Atualizar o cache de tarefas
      response.content.forEach((task: Task) => {
        tasksCache.current.set(task.id, task);
      });
      
      
      currentPageRef.current = response.page;
      
      // Atualizar estados de paginação
      setCurrentPage(response.page);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setIsLastPage(response.last);
      
      // Se for a primeira página ou uma nova busca, substituir as tarefas
      // Caso contrário, adicionar às tarefas existentes (para "carregar mais")
      if (pageToFetch === 0 || force) {
        setMyTasks(response.content);
      } else {
        setMyTasks(prev => [...prev, ...response.content]);
      }
    } catch (err) {
      console.error('Erro ao buscar tarefas atribuídas:', err);
      // Não redefinimos o erro principal, apenas logamos
    } finally {
      setLoadingMyTasks(false);
      isFetchingMyTasks.current = false;
    }
  }, [pageSize, sortBy, sortDirection, activeFilter]); // ⚠️ FIXED: Removed currentPage

  // ⚠️ FIXED: Improved initialization to prevent multiple loads
  useEffect(() => {
    if (isInitialized.current) return;
    
    const loadInitialData = async () => {
      // Preparar filtro inicial baseado no status, se houver
      let initialFilter: TaskFilterRequest = {};
      
      if (options.initialFilterStatus && 
          !['all', 'my-tasks', 'recurring'].includes(options.initialFilterStatus)) {
        initialFilter.status = options.initialFilterStatus;
      }
      
      if (options.initialFilterStatus === 'recurring') {
        initialFilter.isRecurring = true;
      }
      
      // Atualizar o filtro ativo
      setActiveFilter(initialFilter);
      
      // Carrega todas as tarefas primeiro
      try {
        if (options.initialFilterStatus === 'my-tasks') {
          await fetchMyTasks(true, 0, initialFilter);
        } else {
          await fetchTasks(true, 0, initialFilter);
        }
      } catch (error) {
        console.error("Erro ao carregar tarefas iniciais:", error);
      } finally {
        isInitialized.current = true;
      }
    };
    
    loadInitialData();
    
    // Limpa o cache quando o componente é desmontado
    return () => {
      tasksCache.current.clear();
      isInitialized.current = false;
    };
  }, []);

  // Função para aplicar filtro
  const applyFilter = useCallback((status?: string, additionalFilters?: TaskFilterRequest) => {
    // Preparar novo filtro
    let newFilter: TaskFilterRequest = { ...additionalFilters };
    
    // Adicionar status ao filtro, se não for especial
    if (status && !['all', 'my-tasks', 'recurring'].includes(status)) {
      newFilter.status = status;
    }
    
    // Tratar filtros especiais
    if (status === 'recurring') {
      newFilter.isRecurring = true;
    }
    
    // Atualizar o filtro ativo
    setActiveFilter(newFilter);
    setFilterStatus(status);
    
    // Resetar para a primeira página
    currentPageRef.current = 0; 
    setCurrentPage(0);
    
    // Buscar tarefas com o novo filtro
    if (status === 'my-tasks') {
      fetchMyTasks(true, 0, newFilter);
    } else {
      fetchTasks(true, 0, newFilter);
    }
  }, [fetchTasks, fetchMyTasks]);
  
  // ⚠️ FIXED: Use ref in loadMoreTasks
  const loadMoreTasks = useCallback(() => {
    if (isLastPage || loading) return;
    
    const nextPage = currentPageRef.current + 1;
    currentPageRef.current = nextPage;  
    setCurrentPage(nextPage);
    
    if (filterStatus === 'my-tasks') {
      fetchMyTasks(false, nextPage);
    } else {
      fetchTasks(false, nextPage);
    }
  }, [isLastPage, loading, filterStatus, fetchTasks, fetchMyTasks]); 
  
  // ⚠️ FIXED: Use ref in changeSorting
  const changeSorting = useCallback((newSortBy: string, newSortDirection: 'ASC' | 'DESC' = 'ASC') => {
    setSortBy(newSortBy);
    setSortDirection(newSortDirection);
    
    // Resetar para a primeira página
    currentPageRef.current = 0; 
    setCurrentPage(0);
    
    // Buscar tarefas com a nova ordenação
    if (filterStatus === 'my-tasks') {
      fetchMyTasks(true, 0);
    } else {
      fetchTasks(true, 0);
    }
  }, [fetchTasks, fetchMyTasks, filterStatus]);
  
  // ⚠️ FIXED: Use ref in changePageSize
  const changePageSize = useCallback((newSize: number) => {
    setPageSize(newSize);
    
    // Resetar para a primeira página
    currentPageRef.current = 0; 
    setCurrentPage(0);
    
    // Buscar tarefas com o novo tamanho de página
    if (filterStatus === 'my-tasks') {
      fetchMyTasks(true, 0);
    } else {
      fetchTasks(true, 0);
    }
  }, [fetchTasks, fetchMyTasks, filterStatus]);

  // Função otimizada para criar tarefa
  const createTask = async (taskData: {
    title: string;
    description?: string;
    dueDate?: string;
    category?: string;
    republicId: string;
    is_recurring?: boolean;
    recurrenceType?: RecurrenceType;
    recurrenceInterval?: number;
    recurrenceEndDate?: string;
  }) => {
    try {
      const newTask = await taskService.createTask(taskData);
      
      // Atualiza o cache e as listas localmente (otimista)
      tasksCache.current.set(newTask.id, newTask);
      setAllTasks(prev => [newTask, ...prev]);
      
      // Recarrega as listas para garantir consistência
      setTimeout(() => {
        fetchTasks(true, 0);
        if (filterStatus === 'my-tasks') {
          fetchMyTasks(true, 0);
        }
      }, 500);
      
      return newTask;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  // Função otimizada para atualizar tarefa
  const updateTask = async (taskId: number, updateData: {
    title?: string;
    description?: string;
    dueDate?: string;
    category?: string;
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
    is_recurring?: boolean;
    recurrence_type?: RecurrenceType;
    recurrence_interval?: number;
    recurrence_end_date?: string;
  }) => {
    try {
      // Atualização otimista
      const currentTask = tasksCache.current.get(taskId) || 
                         allTasks.find(t => t.id === taskId) || 
                         myTasks.find(t => t.id === taskId);
      
      if (currentTask) {
        const updatedTask = { ...currentTask, ...updateData };
        
        // Atualiza o cache
        tasksCache.current.set(taskId, updatedTask);
        
        // Atualiza as listas localmente
        setAllTasks(prev => prev.map(task => 
          task.id === taskId ? updatedTask : task
        ));
        
        setMyTasks(prev => prev.map(task => 
          task.id === taskId ? updatedTask : task
        ));
      }
      
      // Faz a requisição para o backend
      const updatedTask = await taskService.updateTask(taskId, updateData);
      
      // Recarrega as listas para garantir consistência
      setTimeout(() => {
        fetchTasks(true, currentPage);
        if (filterStatus === 'my-tasks') {
          fetchMyTasks(true, currentPage);
        }
      }, 500);
      
      return updatedTask;
    } catch (err) {
      // Se falhar, recarrega os dados para garantir consistência
      fetchTasks(true, currentPage);
      if (filterStatus === 'my-tasks') {
        fetchMyTasks(true, currentPage);
      }
      
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };
  
  // Função otimizada para atribuir múltiplos usuários
  const assignMultipleUsers = async (taskId: number, userIds: string[]) => {
    try {
      // Atualização otimista
      const currentTask = tasksCache.current.get(taskId) || 
                         allTasks.find(t => t.id === taskId) || 
                         myTasks.find(t => t.id === taskId);
      
      if (currentTask) {
        const updatedTask = { ...currentTask, assigned_users: userIds };
        
        // Atualiza o cache
        tasksCache.current.set(taskId, updatedTask);
        
        // Atualiza as listas localmente
        setAllTasks(prev => prev.map(task => 
          task.id === taskId ? updatedTask : task
        ));
        
        // Se o usuário atual está entre os atribuídos, adiciona à lista de myTasks
        if (userIds.includes(user?.uid || '')) {
          const taskInMyTasks = myTasks.some(t => t.id === taskId);
          if (!taskInMyTasks) {
            setMyTasks(prev => [...prev, updatedTask]);
          } else {
            setMyTasks(prev => prev.map(task => 
              task.id === taskId ? updatedTask : task
            ));
          }
        } else {
          // Se o usuário atual não está entre os atribuídos, remove da lista de myTasks
          setMyTasks(prev => prev.filter(task => task.id !== taskId));
        }
      }
      
      // Faz as requisições para o backend em paralelo
      await taskService.assignMultipleUsers(taskId, userIds);
      
      // Recarrega as listas para garantir consistência
      setTimeout(() => {
        fetchTasks(true, currentPage);
        if (filterStatus === 'my-tasks') {
          fetchMyTasks(true, currentPage);
        }
      }, 500);
      
      return true;
    } catch (err) {
      // Se falhar, recarrega os dados para garantir consistência
      fetchTasks(true, currentPage);
      if (filterStatus === 'my-tasks') {
        fetchMyTasks(true, currentPage);
      }
      
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };
  
  // Função otimizada para excluir tarefa
  const deleteTask = async (taskId: number) => {
    try {
      // Atualização otimista
      tasksCache.current.delete(taskId);
      setAllTasks(prev => prev.filter(task => task.id !== taskId));
      setMyTasks(prev => prev.filter(task => task.id !== taskId));
      
      // Faz a requisição para o backend
      await taskService.deleteTask(taskId);
      
      return true;
    } catch (err) {
      // Se falhar, recarrega os dados para garantir consistência
      fetchTasks(true, currentPage);
      if (filterStatus === 'my-tasks') {
        fetchMyTasks(true, currentPage);
      }
      
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  // Função otimizada para completar tarefa
  const completeTask = async (taskId: number) => {
    try {
      // Primeiro, obtenha a tarefa atual para verificar se é recorrente
      const taskToComplete = tasksCache.current.get(taskId) || 
                            allTasks.find(task => task.id === taskId) || 
                            myTasks.find(task => task.id === taskId);
      
      if (!taskToComplete) {
        throw new Error('Tarefa não encontrada');
      }
      
      // Atualização otimista
      const updatedTask: Task = { ...taskToComplete, status: 'COMPLETED' };
      tasksCache.current.set(taskId, updatedTask);
      
      setAllTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
      
      setMyTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
      
      // Completa a tarefa no backend
      const completedTask = await taskService.completeTask(taskId);
      
      // Se a tarefa for recorrente, cria a próxima instância
      if (taskToComplete.is_recurring) {
        const newTask = await handleRecurringTaskCompletion(taskToComplete);
        
        // Se uma nova tarefa foi criada, adiciona-a às listas
        if (newTask) {
          tasksCache.current.set(newTask.id, newTask);
          setAllTasks(prev => [newTask, ...prev]);
          
          // Se o usuário atual está entre os atribuídos, adiciona à lista de myTasks
          if (newTask.assigned_users?.includes(user?.uid || '')) {
            setMyTasks(prev => [newTask, ...prev]);
          }
        }
      }
      
      // Recarrega as listas para garantir consistência
      setTimeout(() => {
        fetchTasks(true, currentPage);
        if (filterStatus === 'my-tasks') {
          fetchMyTasks(true, currentPage);
        }
      }, 500);
      
      return completedTask;
    } catch (err) {
      // Se falhar, recarrega os dados para garantir consistência
      fetchTasks(true, currentPage);
      if (filterStatus === 'my-tasks') {
        fetchMyTasks(true, currentPage);
      }
      
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  // Função otimizada para cancelar tarefa
  const cancelTask = async (taskId: number) => {
    try {
      // Atualização otimista
      const currentTask = tasksCache.current.get(taskId) || 
                         allTasks.find(t => t.id === taskId) || 
                         myTasks.find(t => t.id === taskId);
      
      if (currentTask) {
        const updatedTask: Task = { ...currentTask, status: 'CANCELLED' };
        
        // Atualiza o cache
        tasksCache.current.set(taskId, updatedTask);
        
        // Atualiza as listas localmente
        setAllTasks(prev => prev.map(task => 
          task.id === taskId ? updatedTask : task
        ));
        
        setMyTasks(prev => prev.map(task => 
          task.id === taskId ? updatedTask : task
        ));
      }
      
      // Faz a requisição para o backend
      const canceledTask = await taskService.cancelTask(taskId);
      
      // Recarrega as listas para garantir consistência
      setTimeout(() => {
        fetchTasks(true, currentPage);
        if (filterStatus === 'my-tasks') {
          fetchMyTasks(true, currentPage);
        }
      }, 500);
      
      return canceledTask;
    } catch (err) {
      // Se falhar, recarrega os dados para garantir consistência
      fetchTasks(true, currentPage);
      if (filterStatus === 'my-tasks') {
        fetchMyTasks(true, currentPage);
      }
      
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  // Função otimizada para atribuir tarefa
  const assignTask = async (taskId: number, userId: string) => {
    try {
      // Atualização otimista
      const currentTask = tasksCache.current.get(taskId) || 
                         allTasks.find(t => t.id === taskId) || 
                         myTasks.find(t => t.id === taskId);
      
      if (currentTask) {
        const updatedTask = { 
          ...currentTask, 
          assigned_users: [...(currentTask.assigned_users || []), userId]
        };
        
        // Atualiza o cache
        tasksCache.current.set(taskId, updatedTask);
        
        // Atualiza as listas localmente
        setAllTasks(prev => prev.map(task => 
          task.id === taskId ? updatedTask : task
        ));
        
        // Se o usuário atual está sendo atribuído, adiciona à lista de myTasks
        if (userId === user?.uid) {
          const taskInMyTasks = myTasks.some(t => t.id === taskId);
          if (!taskInMyTasks) {
            setMyTasks(prev => [...prev, updatedTask]);
          } else {
            setMyTasks(prev => prev.map(task => 
              task.id === taskId ? updatedTask : task
            ));
          }
        }
      }
      
      // Faz a requisição para o backend
      const assignedTask = await taskService.assignTask(taskId, userId);
      
      // Recarrega as listas para garantir consistência
      setTimeout(() => {
        fetchTasks(true, currentPage);
        if (filterStatus === 'my-tasks') {
          fetchMyTasks(true, currentPage);
        }
      }, 500);
      
      return assignedTask;
    } catch (err) {
      // Se falhar, recarrega os dados para garantir consistência
      fetchTasks(true, currentPage);
      if (filterStatus === 'my-tasks') {
        fetchMyTasks(true, currentPage);
      }
      
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  // Função otimizada para desatribuir tarefa
  const unassignTask = async (taskId: number, userId: string) => {
    try {
      // Atualização otimista
      const currentTask = tasksCache.current.get(taskId) || 
                         allTasks.find(t => t.id === taskId) || 
                         myTasks.find(t => t.id === taskId);
      
      if (currentTask) {
        const updatedTask = { 
          ...currentTask, 
          assigned_users: (currentTask.assigned_users || []).filter(id => id !== userId)
        };
        
        // Atualiza o cache
        tasksCache.current.set(taskId, updatedTask);
        
        // Atualiza as listas localmente
        setAllTasks(prev => prev.map(task => 
          task.id === taskId ? updatedTask : task
        ));
        
        // Se o usuário atual está sendo desatribuído, remove da lista de myTasks
        if (userId === user?.uid) {
          setMyTasks(prev => prev.filter(task => task.id !== taskId));
        }
      }
      
      // Faz a requisição para o backend
      const unassignedTask = await taskService.unassignTask(taskId, userId);
      
      // Recarrega as listas para garantir consistência
      setTimeout(() => {
        fetchTasks(true, currentPage);
        if (filterStatus === 'my-tasks') {
          fetchMyTasks(true, currentPage);
        }
      }, 500);
      
      return unassignedTask;
    } catch (err) {
      // Se falhar, recarrega os dados para garantir consistência
      fetchTasks(true, currentPage);
      if (filterStatus === 'my-tasks') {
        fetchMyTasks(true, currentPage);
      }
      
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  // Função otimizada para parar recorrência
  const stopRecurrence = async (taskId: number) => {
    try {
      // Atualização otimista
      const currentTask = tasksCache.current.get(taskId) || 
                         allTasks.find(t => t.id === taskId) || 
                         myTasks.find(t => t.id === taskId);
      
      if (currentTask) {
        const updatedTask = { ...currentTask, is_recurring: false };
        
        // Atualiza o cache
        tasksCache.current.set(taskId, updatedTask);
        
        // Atualiza as listas localmente
        setAllTasks(prev => prev.map(task => 
          task.id === taskId ? updatedTask : task
        ));
        
        setMyTasks(prev => prev.map(task => 
          task.id === taskId ? updatedTask : task
        ));
      }
      
      // Faz a requisição para o backend
      const updatedTask = await taskService.stopRecurrence(taskId);
      
      // Recarrega as listas para garantir consistência
      setTimeout(() => {
        fetchTasks(true, currentPage);
        if (filterStatus === 'my-tasks') {
          fetchMyTasks(true, currentPage);
        }
      }, 500);
      
      return updatedTask;
    } catch (err) {
      // Se falhar, recarrega os dados para garantir consistência
      fetchTasks(true, currentPage);
      if (filterStatus === 'my-tasks') {
        fetchMyTasks(true, currentPage);
      }
      
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  return {
    tasks,
    allTasks,
    myTasks,
    loading,
    loadingMyTasks,
    error,
    
    // Paginação
    currentPage,
    pageSize,
    totalPages,
    totalElements,
    isLastPage,
    loadMoreTasks,
    changePageSize,
    
    // Ordenação
    sortBy,
    sortDirection,
    changeSorting,
    
    // Filtros
    activeFilter,
    setActiveFilter,
    
    // Funções de busca
    fetchTasks,
    fetchMyTasks,
    applyFilter,
    
    // Funções de manipulação
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    cancelTask,
    assignTask,
    unassignTask,
    assignMultipleUsers,
    stopRecurrence
  };
};