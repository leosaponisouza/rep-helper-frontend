// src/models/pagedResponse.model.ts

/**
 * Modelo para resposta paginada do servidor
 */
export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}