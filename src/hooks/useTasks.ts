// src/hooks/useTasks.ts - Atualizado para usar o endpoint de tarefas atribuídas
import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { ErrorHandler } from '../utils/errorHandling';
import { useAuth } from '../context/AuthContext';

export interface Task {
  id: number;
  title: string;
  description: string;
  republicId: string;
  republicName: string;
  assignedUsers: {
    id: string;
    name: string;
    email: string;
    profilePictureUrl: string;
  }[];
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
  dueDate: string;
  completedAt: string | null;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface UseTasksOptions {
  republicId?: string;
  initialFilterStatus?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED' | 'all' | 'my-tasks';
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

  // Filtra as tarefas localmente baseado no status atual e se deve mostrar apenas as tarefas do usuário atual
  const tasks = useMemo(() => {
    // Se o filtro for "my-tasks", retorna o array de myTasks já filtrado do servidor
    if (filterStatus === 'my-tasks') {
      // Aplicar filtro de status adicional se especificado
      if (options.initialFilterStatus && options.initialFilterStatus !== 'all') {
        return myTasks.filter(task => task.status === options.initialFilterStatus);
      }
      return myTasks;
    }

    // Para outros filtros, filtra o array de todas as tarefas
    if (!filterStatus || filterStatus === 'all') {
      return allTasks;
    }
    
    return allTasks.filter(task => task.status === filterStatus);
  }, [allTasks, myTasks, filterStatus, options.initialFilterStatus]);

  // Função para buscar todas as tarefas
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let endpoint = '/api/v1/tasks';
      let params: Record<string, any> = {};
      
      // Adiciona republicId como parâmetro de consulta, se fornecido
      if (options.republicId) {
        params.republicId = options.republicId;
      }

      const response = await api.get(endpoint, { params });
      setAllTasks(response.data);
      
      // Também busca tarefas atribuídas ao usuário
      await fetchMyTasks();
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      setError(parsedError.message);
      ErrorHandler.logError(parsedError);
    } finally {
      setLoading(false);
    }
  }, [options.republicId]);
  
  // Nova função para buscar tarefas atribuídas ao usuário
  const fetchMyTasks = useCallback(async () => {
    try {
      setLoadingMyTasks(true);
      
      const response = await api.get('/api/v1/tasks/assigned');
      setMyTasks(response.data);
    } catch (err) {
      console.error('Erro ao buscar tarefas atribuídas:', err);
      // Não redefinimos o erro principal, apenas logamos
    } finally {
      setLoadingMyTasks(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Função para aplicar filtro sem fazer novas requisições
  const applyFilter = (status?: string) => {
    setFilterStatus(status);
  };

  const createTask = async (taskData: {
    title: string;
    description?: string;
    dueDate?: string;
    category?: string;
    republicId: string;
  }) => {
    try {
      const response = await api.post('/api/v1/tasks', taskData);
      await fetchTasks(); // Recarrega a lista após criar
      return response.data;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  const updateTask = async (taskId: number, updateData: {
    title?: string;
    description?: string;
    dueDate?: string;
    category?: string;
    status?: string;
  }) => {
    try {
      const response = await api.put(`/api/v1/tasks/${taskId}`, updateData);
      
      // Atualiza ambas as listas
      await fetchTasks();
      
      return response.data;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };
  
  const assignMultipleUsers = async (taskId: number, userIds: string[]) => {
    try {
      const assignmentPromises = userIds.map(userId => 
        api.post(`/api/v1/tasks/${taskId}/assign`, { userId })
      );
      
      await Promise.all(assignmentPromises);
      
      // Atualiza ambas as listas
      await fetchTasks();
      return true;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };
  
  const deleteTask = async (taskId: number) => {
    try {
      await api.delete(`/api/v1/tasks/${taskId}`);
      
      // Atualiza otimisticamente as listas
      setAllTasks(prev => prev.filter(task => task.id !== taskId));
      setMyTasks(prev => prev.filter(task => task.id !== taskId));
      
      return true;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  const completeTask = async (taskId: number) => {
    try {
      const response = await api.post(`/api/v1/tasks/${taskId}/complete`);
      
      // Atualiza ambas as listas
      await fetchTasks();
      
      return response.data;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  const cancelTask = async (taskId: number) => {
    try {
      const response = await api.post(`/api/v1/tasks/${taskId}/cancel`);
      
      // Atualiza ambas as listas
      await fetchTasks();
      
      return response.data;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  const assignTask = async (taskId: number, userId: string) => {
    try {
      const response = await api.post(`/api/v1/tasks/${taskId}/assign`, { userId });
      
      // Atualiza ambas as listas
      await fetchTasks();
      
      return response.data;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  const unassignTask = async (taskId: number, userId: string) => {
    try {
      const response = await api.post(`/api/v1/tasks/${taskId}/unassign`, { userId });
      
      // Atualiza ambas as listas
      await fetchTasks();
      
      return response.data;
    } catch (err) {
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
    fetchTasks,
    fetchMyTasks,
    applyFilter,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    cancelTask,
    assignTask,
    unassignTask,
    assignMultipleUsers
  };
};