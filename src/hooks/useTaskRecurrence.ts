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
    if (!task.recurring || !task.recurrenceType || !task.dueDate) {
      return null;
    }

    const dueDate = new Date(task.dueDate);
    const interval = task.recurrenceInterval || 1;
    
    let nextDueDate = new Date(dueDate);
    
    switch (task.recurrenceType) {
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
    if (task.recurrenceEndDate) {
      const endDate = new Date(task.recurrenceEndDate);
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
      await api.put(`/api/v1/tasks/${taskId}`, { isRecurrence: false });
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
    if (!task.recurring) return null;
    
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
        recurring: task.recurring,
        recurrenceType: task.recurrencetype,
        recurrenceInterval: task.recurrenceInterval,
        recurrenceEndDate: task.recurrenceEndDate,
        parentTaskId: task.id
      };
      
      const response = await api.post('/api/v1/tasks', newTaskData);
      const newTask = response.data;
      console.log("new task : " + newTask)
      // Copy assigned users from original task
      if (task.assigned_users && task.assigned_users.length > 0) {
        const userIds = task.assigned_users.map((user: any) => user);
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