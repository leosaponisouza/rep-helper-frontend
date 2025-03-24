// src/services/taskService.ts
import api from './api';
import { Task, CreateTaskDTO, UpdateTaskDTO } from '../models/task.model';
import { TaskFilterRequest } from '../models/taskFilter.model';
import { PagedResponse } from '../models/pagedResponse.model';

// Obter todas as tarefas (método legado)
export const getAllTasks = async (republicId?: string): Promise<Task[]> => {
  const params: Record<string, any> = {};
  if (republicId) {
    params.republicId = republicId;
  }
  const response = await api.get('/api/v1/tasks', { params });
  return response.data;
};

// Obter tarefas com filtros e paginação
export const getTasksWithFilters = async (
  filter?: TaskFilterRequest,
  republicId?: string,
  page: number = 0,
  size: number = 20,
  sortBy: string = 'dueDate',
  sortDirection: string = 'asc'
): Promise<PagedResponse<Task>> => {
  // Preparar o objeto de filtro
  const taskFilter: TaskFilterRequest = filter || {};
  
  // Adicionar informações de paginação e ordenação
  if (page !== undefined) taskFilter.page = page;
  if (size !== undefined) taskFilter.size = size;
  if (sortBy) taskFilter.sortBy = sortBy;
  if (sortDirection) taskFilter.sortDirection = sortDirection;
  
  // Parâmetros de consulta
  const params: Record<string, any> = {};
  if (republicId) {
    params.republicId = republicId;
  }
  
  const response = await api.post('/api/v1/tasks/filter', taskFilter, { params });
  return response.data;
};

// Obter tarefas atribuídas ao usuário atual (método legado)
export const getAssignedTasks = async (): Promise<Task[]> => {
  const response = await api.get('/api/v1/tasks/assigned');
  return response.data;
};

// Obter tarefas atribuídas ao usuário atual com filtros e paginação
export const getAssignedTasksWithFilters = async (
  filter?: TaskFilterRequest,
  page: number = 0,
  size: number = 20,
  sortBy: string = 'dueDate',
  sortDirection: string = 'asc'
): Promise<PagedResponse<Task>> => {
  // Preparar o objeto de filtro
  const taskFilter: TaskFilterRequest = filter || {};
  
  // Adicionar informações de paginação e ordenação
  if (page !== undefined) taskFilter.page = page;
  if (size !== undefined) taskFilter.size = size;
  if (sortBy) taskFilter.sortBy = sortBy;
  if (sortDirection) taskFilter.sortDirection = sortDirection;
  
  const response = await api.post('/api/v1/tasks/assigned/filter', taskFilter);
  return response.data;
};

// Criar uma nova tarefa
export const createTask = async (taskData: CreateTaskDTO): Promise<Task> => {
  const response = await api.post('/api/v1/tasks', taskData);
  return response.data;
};

// Atualizar uma tarefa existente
export const updateTask = async (taskId: number, updateData: UpdateTaskDTO): Promise<Task> => {
  const response = await api.put(`/api/v1/tasks/${taskId}`, updateData);
  return response.data;
};

// Completar uma tarefa
export const completeTask = async (taskId: number): Promise<Task> => {
  const response = await api.post(`/api/v1/tasks/${taskId}/complete`);
  return response.data;
};

// Cancelar uma tarefa
export const cancelTask = async (taskId: number): Promise<Task> => {
  const response = await api.post(`/api/v1/tasks/${taskId}/cancel`);
  return response.data;
};

// Excluir uma tarefa
export const deleteTask = async (taskId: number): Promise<void> => {
  await api.delete(`/api/v1/tasks/${taskId}`);
};

// Atribuir uma tarefa a um usuário
export const assignTask = async (taskId: number, userId: string): Promise<Task> => {
  const response = await api.post(`/api/v1/tasks/${taskId}/assign`, { userId });
  return response.data;
};

// Desatribuir uma tarefa de um usuário
export const unassignTask = async (taskId: number, userId: string): Promise<Task> => {
  const response = await api.post(`/api/v1/tasks/${taskId}/unassign`, { userId });
  return response.data;
};

// Atribuir múltiplos usuários a uma tarefa
export const assignMultipleUsers = async (taskId: number, userIds: string[]): Promise<boolean> => {
  const assignmentPromises = userIds.map(userId => 
    api.post(`/api/v1/tasks/${taskId}/assign`, { userId })
  );
  
  await Promise.all(assignmentPromises);
  return true;
};

// Parar recorrência de uma tarefa
export const stopRecurrence = async (taskId: number): Promise<Task> => {
  const response = await api.put(`/api/v1/tasks/${taskId}`, { recurring: false });
  return response.data;
};