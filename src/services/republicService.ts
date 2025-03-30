import api from './api';
import { 
  Republic, 
  RepublicMember, 
  CreateRepublicRequest, 
  CreateRepublicResponse,
  UpdateRepublicRequest,
  JoinRepublicRequest,
  JoinRepublicResponse,
  RegenerateCodeResponse
} from '../models/republic.model';
import { User } from '../models/user.model';
import { getFreshFirebaseToken } from '../utils/firebaseClientConfig';
import { ErrorHandler } from '../utils/errorHandling';
import { PagedResponse } from '../models/pagedResponse.model';
import axios from 'axios';

/**
 * @fileoverview Serviço para gerenciamento de repúblicas
 * 
 * Este serviço fornece métodos para criar, atualizar, e gerenciar repúblicas.
 */

/**
 * Obtém os detalhes de uma república específica
 * @param republicId ID da república
 * @returns Dados da república
 */
export const getRepublic = async (republicId: string): Promise<Republic> => {
  try {
    const response = await api.get<Republic>(`/api/v1/republics/${republicId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao obter república:', error);
    const parsedError = await ErrorHandler.parseError(error);
    throw parsedError;
  }
};

/**
 * Cria uma nova república
 * @param republicData Dados da nova república
 * @returns Resposta com a república criada
 */
export const createRepublic = async (republicData: CreateRepublicRequest): Promise<CreateRepublicResponse> => {
  try {
    // Verificar se todos os campos obrigatórios foram fornecidos
    const requiredFields = ['name', 'street', 'number', 'neighborhood', 'city', 'state', 'zip_code'];
    const missingFields = requiredFields.filter(field => !republicData[field as keyof CreateRepublicRequest]);
    
    if (missingFields.length > 0) {
      throw new Error(`Campos obrigatórios ausentes: ${missingFields.join(', ')}`);
    }
    
    // Log em desenvolvimento
    if (__DEV__) {
      console.log('Enviando dados para criação de república:', republicData);
    }
    
    const response = await api.post<CreateRepublicResponse>('/api/v1/republics', republicData);
    
    if (__DEV__) {
      console.log('República criada com sucesso:', response.data);
    }
    
    return response.data;
  } catch (error) {
    console.error('Erro ao criar república:', error);
    const parsedError = await ErrorHandler.parseError(error);
    parsedError.message = parsedError.message || 'Não foi possível criar a república';
    throw parsedError;
  }
};

/**
 * Atualiza uma república existente
 * @param republicId ID da república
 * @param republicData Dados da república que serão atualizados
 * @returns República atualizada
 */
export const updateRepublic = async (republicId: string, republicData: UpdateRepublicRequest): Promise<Republic> => {
  try {
    const response = await api.put<Republic>(`/api/v1/republics/${republicId}`, republicData);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar república:', error);
    const parsedError = await ErrorHandler.parseError(error);
    parsedError.message = parsedError.message || 'Não foi possível atualizar a república';
    throw parsedError;
  }
};

/**
 * Entra em uma república usando um código de convite
 * @param code Código da república
 * @returns Resposta com token e usuário atualizado
 */
export const joinRepublic = async (code: string): Promise<JoinRepublicResponse> => {
  try {
    // Obter token fresco do Firebase para autenticação
    const firebaseToken = await getFreshFirebaseToken(true);
    
    // Enviar requisição para entrar na república
    const response = await api.post<JoinRepublicResponse>(
      '/api/v1/republics/join',
      { code },
      { headers: { Authorization: `Bearer ${firebaseToken}` } }
    );
    
    return response.data;
  } catch (error) {
    console.error('Erro ao entrar na república:', error);
    
    // Tratamento de erros específicos
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 404) {
        throw new Error('República não encontrada. Verifique o código e tente novamente.');
      } else if (error.response.status === 400) {
        throw new Error('Você já faz parte desta república ou o código é inválido.');
      }
    }
    
    const parsedError = await ErrorHandler.parseError(error);
    parsedError.message = parsedError.message || 'Não foi possível entrar na república';
    throw parsedError;
  }
};

/**
 * Obtém os membros de uma república
 * @param republicId ID da república
 * @returns Lista de membros da república
 */
export const getRepublicMembers = async (republicId: string): Promise<RepublicMember[]> => {
  try {
    const response = await api.get<RepublicMember[]>(`/api/v1/republics/${republicId}/members`);
    return response.data;
  } catch (error) {
    console.error('Erro ao obter membros da república:', error);
    const parsedError = await ErrorHandler.parseError(error);
    parsedError.message = parsedError.message || 'Não foi possível listar os membros da república';
    throw parsedError;
  }
};

/**
 * Promove um membro a administrador da república
 * @param republicId ID da república
 * @param memberId ID do membro
 * @returns Resposta da API
 */
export const promoteToAdmin = async (republicId: string, memberId: string): Promise<any> => {
  try {
    const response = await api.post(`/api/v1/republics/${republicId}/members/${memberId}/admin`);
    return response.data;
  } catch (error) {
    console.error('Erro ao promover membro a administrador:', error);
    const parsedError = await ErrorHandler.parseError(error);
    parsedError.message = parsedError.message || 'Não foi possível promover o membro a administrador';
    throw parsedError;
  }
};

/**
 * Remove privilégios de administrador de um membro
 * @param republicId ID da república
 * @param memberId ID do membro
 * @returns Resposta da API
 */
export const demoteFromAdmin = async (republicId: string, memberId: string): Promise<any> => {
  try {
    const response = await api.delete(`/api/v1/republics/${republicId}/members/${memberId}/admin`);
    return response.data;
  } catch (error) {
    console.error('Erro ao remover privilégios de administrador:', error);
    const parsedError = await ErrorHandler.parseError(error);
    parsedError.message = parsedError.message || 'Não foi possível remover os privilégios de administrador';
    throw parsedError;
  }
};

/**
 * Remove um membro da república
 * @param republicId ID da república
 * @param memberId ID do membro
 * @returns Resposta da API
 */
export const removeMember = async (republicId: string, memberId: string): Promise<any> => {
  try {
    const response = await api.delete(`/api/v1/republics/${republicId}/members/${memberId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao remover membro da república:', error);
    const parsedError = await ErrorHandler.parseError(error);
    parsedError.message = parsedError.message || 'Não foi possível remover o membro da república';
    throw parsedError;
  }
};

/**
 * Regenera o código de convite da república
 * @param republicId ID da república
 * @param customCode Código personalizado (opcional)
 * @returns Novo código de convite
 */
export const regenerateInviteCode = async (republicId: string, customCode?: string): Promise<RegenerateCodeResponse> => {
  try {
    const response = await api.post<RegenerateCodeResponse>(
      `/api/v1/republics/${republicId}/regenerate-code`,
      customCode ? { code: customCode } : {}
    );
    return response.data;
  } catch (error) {
    console.error('Erro ao regenerar código de convite:', error);
    const parsedError = await ErrorHandler.parseError(error);
    parsedError.message = parsedError.message || 'Não foi possível gerar um novo código de convite';
    throw parsedError;
  }
};

/**
 * Obtém o comprimento padrão dos códigos de convite
 * @returns Comprimento dos códigos de convite
 */
export const getCodeLength = async (): Promise<number> => {
  try {
    const response = await api.get<{ length: number }>('/api/v1/republics/code-length');
    return response.data.length;
  } catch (error) {
    console.error('Erro ao obter comprimento do código:', error);
    // Em caso de erro, retorna um valor padrão
    return 6;
  }
}; 