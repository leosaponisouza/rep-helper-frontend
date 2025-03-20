// src/models/taskFilter.model.ts

/**
 * Modelo para filtrar tarefas no servidor
 */
export interface TaskFilterRequest {
  // Filtros básicos
  status?: string;
  category?: string;
  isRecurring?: boolean;
  isOverdue?: boolean;
  
  // Filtros de data
  dueDateFrom?: string;
  dueDateTo?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  
  // Filtros de usuário
  assignedUserId?: string;
  unassigned?: boolean;
  
  // Filtros de texto
  searchTerm?: string; // Busca no título e descrição
  
  // Paginação
  page?: number;
  size?: number;
  
  // Ordenação
  sortBy?: string;
  sortDirection?: string;
}