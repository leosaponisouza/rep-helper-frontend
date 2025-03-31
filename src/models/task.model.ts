// src/models/task.model.ts

import { User } from "./user.model";

export type RecurrenceType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface Task {
  [x: string]: any;
  id: number;  // Opcional, será atribuído pelo backend
  republic_id: string;
  title: string;
  description?: string;
  dueDate?: string;  // Data em formato ISO ou timestamp
  category?: string;
  status: 'PENDING' | 'COMPLETED' | 'IN_PROGRESS' | 'OVERDUE' | 'CANCELLED';
  createdAt?: string;
  updated_at?: string;
  assignedUsers?: User[];  // UIDs dos usuários atribuídos
  completed_at?: string;
  createdBy?: User;  // Usuário que criou a tarefa
  // Campos para recorrência
  recurring?: boolean;
  recurrenceType?: RecurrenceType;
  recurrenceInterval?: number;
  recurrenceEndDate?: string;
  parentTaskId?: number;
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  dueDate?: string;
  category?: string;
  republicId: string;
  assigned_users?: string[];
  
  // Campos para recorrência
  recurring?: boolean;
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
  recurring?: boolean;
  recurrenceType?: RecurrenceType;
  recurrenceInterval?: number;
  recurrenceEndDate?: string;
}