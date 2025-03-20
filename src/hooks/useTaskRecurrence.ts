// src/hooks/useTaskRecurrence.ts
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { Task, RecurrenceType } from '../models/task.model';
import api from '../services/api';
import notificationService from '../services/notificationService';
import { ErrorHandler } from '../utils/errorHandling';

export const useTaskRecurrence = () => {
  const [loading, setLoading] = useState(false);

  // Calculate the next due date based on recurrence settings
  const calculateNextDueDate = useCallback((task: Task): string | null => {
    if (!task.is_recurring || !task.recurrence_type || !task.dueDate) {
      return null;
    }

    const dueDate = new Date(task.dueDate);
    const interval = task.recurrence_interval || 1;
    
    let nextDueDate = new Date(dueDate);
    
    switch (task.recurrence_type) {
      case 'DAILY':
        nextDueDate.setDate(nextDueDate.getDate() + interval);
        break;
      case 'WEEKLY':
        nextDueDate.setDate(nextDueDate.getDate() + (interval * 7));
        break;
      case 'MONTHLY':
        nextDueDate.setMonth(nextDueDate.getMonth() + interval);
        break;
      case 'YEARLY':
        nextDueDate.setFullYear(nextDueDate.getFullYear() + interval);
        break;
    }
    
    // Check if we've passed the end date
    if (task.recurrence_end_date) {
      const endDate = new Date(task.recurrence_end_date);
      if (nextDueDate > endDate) {
        return null;
      }
    }
    
    return nextDueDate.toISOString();
  }, []);

  // Stop the recurrence of a task
  const stopRecurrence = useCallback(async (taskId: number) => {
    try {
      setLoading(true);
      await api.patch(`/api/v1/tasks/${taskId}`, { is_recurring: false });
      return true;
    } catch (error) {
      ErrorHandler.handle(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle task completion and create next instance if recurring
  const handleRecurringTaskCompletion = useCallback(async (task: Task) => {
    if (!task.is_recurring) return null;
    
    try {
      setLoading(true);
      
      // Calculate next due date
      const nextDueDate = calculateNextDueDate(task);
      
      // If no next due date (e.g., past end date), stop recurrence
      if (!nextDueDate) {
        await stopRecurrence(task.id);
        Alert.alert(
          "Recorrência finalizada",
          "Esta era a última ocorrência desta tarefa recorrente."
        );
        return null;
      }
      
      // Create next instance of the task
      const newTaskData = {
        title: task.title,
        description: task.description,
        republicId: task.republic_id,
        dueDate: nextDueDate,
        category: task.category,
        is_recurring: task.is_recurring,
        recurrence_type: task.recurrence_type,
        recurrence_interval: task.recurrence_interval,
        recurrence_end_date: task.recurrence_end_date,
        parent_task_id: task.id
      };
      
      const response = await api.post('/api/v1/tasks', newTaskData);
      const newTask = response.data;
      
      // Copy assigned users from original task
      if (task.assigned_users && task.assigned_users.length > 0) {
        const userIds = task.assigned_users.map(user => user);
        await api.post(`/api/v1/tasks/${newTask.id}/assign-users`, { userIds });
      }
      
      // Schedule notification for the new recurring task
      await notificationService.scheduleRecurringTaskNotification(task, nextDueDate);
      
      return newTask;
    } catch (error) {
      ErrorHandler.handle(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [calculateNextDueDate, stopRecurrence]);

  return {
    loading,
    calculateNextDueDate,
    stopRecurrence,
    handleRecurringTaskCompletion
  };
};

export default useTaskRecurrence;