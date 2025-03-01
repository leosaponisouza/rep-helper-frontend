// src/models/task.model.ts

export interface Task {
    id?: number;  // Opcional, será atribuído pelo backend
    republic_id: string;
    title: string;
    description?: string;
    due_date?: string;  // Data em formato ISO ou timestamp
    category?: string;
    status: 'pending' | 'completed';
    created_at?: string;
    updated_at?: string;
    assigned_users?: string[];  // UIDs dos usuários atribuídos
  }
  
  export interface CreateTaskDTO {
    title: string;
    description?: string;
    due_date?: string;
    category?: string;
    republicId: string,
    assigned_users?: string[];
  }
  
  export interface UpdateTaskDTO {
    title?: string;
    description?: string;
    due_date?: string;
    category?: string;
    status?: 'pending' | 'completed';
    assigned_users?: string[];
  }