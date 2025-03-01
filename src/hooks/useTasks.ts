// src/hooks/useTasks.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { ErrorHandler } from '../utils/errorHandling';

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
  initialFilterStatus?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
}

export const useTasks = (options: UseTasksOptions = {}) => {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(
    options.initialFilterStatus
  );

  // Filtra as tarefas localmente baseado no status atual
  const tasks = useMemo(() => {
    if (!filterStatus || filterStatus === 'all') {
      return allTasks;
    }
    return allTasks.filter(task => task.status === filterStatus);
  }, [allTasks, filterStatus]);
// Add this to your useTasks.ts hook
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
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      setError(parsedError.message);
      ErrorHandler.logError(parsedError);
    } finally {
      setLoading(false);
    }
  }, [options.republicId]);

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
      await fetchTasks(); // Recarrega a lista após atualizar
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
      await fetchTasks(); // Refresh task list
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
      setAllTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  const completeTask = async (taskId: number) => {
    try {
      const response = await api.post(`/api/v1/tasks/${taskId}/complete`);
      await fetchTasks(); // Recarrega a lista após completar
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
      await fetchTasks(); // Recarrega a lista após cancelar
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
      await fetchTasks(); // Recarrega a lista após atribuir
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
      await fetchTasks(); // Recarrega a lista após desatribuir
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
    loading,
    error,
    fetchTasks,
    applyFilter,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    cancelTask,
    assignTask,
    unassignTask,
    assignMultipleUsers,
    useTasks
  };
};