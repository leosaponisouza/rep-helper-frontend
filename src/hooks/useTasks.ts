// src/hooks/useTasks.ts
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Task } from '../models/task.model';
import { ErrorHandler } from '../utils/errorHandling';

interface UseTasksOptions {
  status?: 'pending' | 'completed' | 'all';
  category?: string;
  assignedTo?: string;
}

export const useTasks = (options: UseTasksOptions = {}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchTasks = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const currentPage = reset ? 1 : page;
      const params = {
        page: currentPage,
        limit: 10,
        status: options.status !== 'all' ? options.status : undefined,
        category: options.category,
        assignedTo: options.assignedTo
      };

      const response = await api.get('/tasks', { params });
      const newTasks = response.data.data;

      setTasks(prev => reset ? newTasks : [...prev, ...newTasks]);
      setPage(currentPage + 1);
      setHasMore(newTasks.length === 10);
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      setError(parsedError.message);
      ErrorHandler.logError(parsedError);
    } finally {
      setLoading(false);
    }
  }, [page, options.status, options.category, options.assignedTo]);

  const refreshTasks = useCallback(() => {
    fetchTasks(true);
  }, [fetchTasks]);

  const loadMoreTasks = useCallback(() => {
    if (hasMore && !loading) {
      fetchTasks();
    }
  }, [hasMore, loading, fetchTasks]);

  useEffect(() => {
    fetchTasks(true);
  }, [options.status, options.category, options.assignedTo]);

  const createTask = async (taskData: any) => {
    try {
      const response = await api.post('/tasks', taskData);
      // Atualizar lista após criar tarefa
      refreshTasks();
      return response.data;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  const updateTask = async (taskId: number, updateData: any) => {
    try {
      const response = await api.patch(`/tasks/${taskId}`, updateData);
      // Atualizar lista após atualizar tarefa
      refreshTasks();
      return response.data;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  const deleteTask = async (taskId: number) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      // Atualizar lista após deletar tarefa
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  return {
    tasks,
    loading,
    error,
    hasMore,
    refreshTasks,
    loadMoreTasks,
    createTask,
    updateTask,
    deleteTask
  };
};