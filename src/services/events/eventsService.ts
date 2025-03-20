// src/services/events/eventsService.ts
import api from '../api';
import { ErrorHandler } from '../../utils/errorHandling';
import { Event, EventFormData, InvitationStatus } from './eventsTypes';

/**
 * Service responsible for handling all event-related API calls
 */
export class EventsService {
  /**
   * Fetch all events
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
   * Fetch upcoming events
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
   * Fetch events where the user is invited
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
   * Fetch events where the user has confirmed attendance
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
   * Get a specific event by ID
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
   * Create a new event
   */
  static async createEvent(eventData: EventFormData): Promise<Event> {
    try {
      const response = await api.post('/api/v1/events', eventData);
      return response.data;
    } catch (err) {
      const parsedError = await ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  }

  /**
   * Update an existing event
   */
  static async updateEvent(eventId: number, updateData: Partial<EventFormData>): Promise<Event> {
    try {
      const response = await api.put(`/api/v1/events/${eventId}`, updateData);
      return response.data;
    } catch (err) {
      const parsedError = await ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  }

  /**
   * Delete an event
   */
  static async deleteEvent(eventId: number): Promise<boolean> {
    try {
      await api.delete(`/api/v1/events/${eventId}`);
      return true;
    } catch (err) {
      const parsedError = await ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  }

  /**
   * Update invitation status for a user
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
      ErrorHandler.handle(err);
      throw parsedError;
    }
  }

  /**
   * Invite users to an event
   */
  static async inviteUsers(eventId: number, userIds: string[]): Promise<any> {
    try {
      if (!userIds.length) return null;
      
      const response = await api.post(`/api/v1/events/${eventId}/invite`, { userIds });
      return response.data;
    } catch (err) {
      const parsedError = await ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  }
}