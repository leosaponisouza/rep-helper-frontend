// src/services/events/eventsService.ts
import api from '../api';
import { ErrorHandler } from '../../utils/errorHandling';
import { Event, EventFormData, InvitationStatus } from './eventsTypes';

/**
 * Serviço responsável por gerenciar todas as chamadas de API relacionadas a eventos
 */
export class EventsService {
  /**
   * Busca todos os eventos
   */
  static async fetchAllEvents(): Promise<Event[]> {
    try {
      const response = await api.get('/api/v1/events');
      return response.data;
    } catch (err) {
      const parsedError = await ErrorHandler.parseError(err);
      ErrorHandler.logError(parsedError);
      throw parsedError;
    }
  }

  /**
   * Busca eventos futuros
   */
  static async fetchUpcomingEvents(): Promise<Event[]> {
    try {
      const response = await api.get('/api/v1/events/upcoming');
      return response.data;
    } catch (err) {
      const parsedError = await ErrorHandler.parseError(err);
      ErrorHandler.logError(parsedError);
      throw parsedError;
    }
  }

  /**
   * Busca eventos para os quais o usuário foi convidado
   */
  static async fetchInvitedEvents(): Promise<Event[]> {
    try {
      const response = await api.get('/api/v1/events/invited');
      return response.data;
    } catch (err) {
      const parsedError = await ErrorHandler.parseError(err);
      ErrorHandler.logError(parsedError);
      throw parsedError;
    }
  }

  /**
   * Busca eventos para os quais o usuário confirmou presença
   */
  static async fetchConfirmedEvents(): Promise<Event[]> {
    try {
      const response = await api.get('/api/v1/events/confirmed');
      return response.data;
    } catch (err) {
      const parsedError = await ErrorHandler.parseError(err);
      ErrorHandler.logError(parsedError);
      throw parsedError;
    }
  }

  /**
   * Obtém um evento específico pelo ID
   */
  static async getEventById(eventId: number | string): Promise<Event> {
    try {
      const response = await api.get(`/api/v1/events/${eventId}`);
      return response.data;
    } catch (err) {
      const parsedError = await ErrorHandler.parseError(err);
      ErrorHandler.logError(parsedError);
      throw parsedError;
    }
  }

  /**
   * Cria um novo evento
   */
  static async createEvent(eventData: EventFormData): Promise<Event> {
    try {
      const response = await api.post('/api/v1/events', eventData);
      return response.data;
    } catch (err) {
      const parsedError = await ErrorHandler.parseError(err);
      ErrorHandler.logError(parsedError);
      ErrorHandler.handle(parsedError);
      throw parsedError;
    }
  }

  /**
   * Atualiza um evento existente
   */
  static async updateEvent(eventId: number, updateData: Partial<EventFormData>): Promise<Event> {
    try {
      const response = await api.put(`/api/v1/events/${eventId}`, updateData);
      return response.data;
    } catch (err) {
      const parsedError = await ErrorHandler.parseError(err);
      ErrorHandler.logError(parsedError);
      ErrorHandler.handle(parsedError);
      throw parsedError;
    }
  }

  /**
   * Exclui um evento
   */
  static async deleteEvent(eventId: number): Promise<boolean> {
    try {
      await api.delete(`/api/v1/events/${eventId}`);
      return true;
    } catch (err) {
      const parsedError = await ErrorHandler.parseError(err);
      ErrorHandler.logError(parsedError);
      ErrorHandler.handle(parsedError);
      throw parsedError;
    }
  }

  /**
   * Atualiza o status de convite para um usuário
   */
  static async updateInvitationStatus(
    eventId: number | string, 
    userId: string, 
    status: InvitationStatus
  ): Promise<Event> {
    try {
      const response = await api.put(`/api/v1/events/${eventId}/respond`, { status });
      return response.data;
    } catch (err) {
      const parsedError = await ErrorHandler.parseError(err);
      ErrorHandler.logError(parsedError);
      ErrorHandler.handle(parsedError);
      throw parsedError;
    }
  }

  /**
   * Convida usuários para um evento
   */
  static async inviteUsers(eventId: number, userIds: string[]): Promise<any> {
    try {
      if (!userIds.length) return null;
      
      const response = await api.post(`/api/v1/events/${eventId}/invite`, { userIds });
      return response.data;
    } catch (err) {
      const parsedError = await ErrorHandler.parseError(err);
      ErrorHandler.logError(parsedError);
      ErrorHandler.handle(parsedError);
      throw parsedError;
    }
  }
}