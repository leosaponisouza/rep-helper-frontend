// src/models/task.model.ts

export type RecurrenceType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface Task {
  id: number;  // Opcional, será atribuído pelo backend
  republic_id: string;
  title: string;
  description?: string;
  dueDate?: string;  // Data em formato ISO ou timestamp
  category?: string;
  status: 'PENDING' | 'COMPLETED' | 'IN_PROGRESS' | 'OVERDUE' | 'CANCELLED';
  created_at?: string;
  updated_at?: string;
  assigned_users?: string[];  // UIDs dos usuários atribuídos
  
  // Campos para recorrência
  is_recurring?: boolean;
  recurrence_type?: RecurrenceType;
  recurrence_interval?: number;
  recurrence_end_date?: string;
  parent_task_id?: number;
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  dueDate?: string;
  category?: string;
  republicId: string;
  assigned_users?: string[];
  
  // Campos para recorrência
  is_recurring?: boolean;
  recurrenceType?: RecurrenceType;
  recurrenceInterval?: number;
  recurrenceEndDate?: string;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  dueDate?: string;
  category?: string;
  status?: 'PENDING' | 'COMPLETED' | 'IN_PROGRESS' | 'OVERDUE' | 'CANCELLED';
  assigned_users?: string[];
  
  // Campos para recorrência
  is_recurring?: boolean;
  recurrenceType?: RecurrenceType;
  recurrenceInterval?: number;
  recurrenceEndDate?: string;
}