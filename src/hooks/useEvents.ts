// src/hooks/useEvents.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { ErrorHandler } from '../utils/errorHandling';
import { useAuth } from '../context/AuthContext';
import { format, parseISO, isAfter, isBefore, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type InvitationStatus = 'INVITED' | 'CONFIRMED' | 'DECLINED';

export interface EventInvitation {
  userId: string;
  userName: string;
  userEmail: string;
  userProfilePicture: string | null;
  status: InvitationStatus;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  republicId: string;
  republicName: string;
  creatorId: string;
  creatorName: string;
  invitations: EventInvitation[];
  createdAt: string;
  isFinished: boolean;
  isHappening: boolean;
}

export interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  republicId: string;
}

interface UseEventsOptions {
  initialFilter?: 'all' | 'upcoming' | 'invited' | 'confirmed' | 'past' | 'today';
}

export const useEvents = (options: UseEventsOptions = {}) => {
  const { user } = useAuth();
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>(options.initialFilter || 'all');

  // Função para buscar eventos
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/api/v1/events');
      const normalizedEvents = response.data.map((event: any) => ({
        ...event,
        invitations: event.invitations || [], // Garante que nunca seja null
      }));
      
      setAllEvents(normalizedEvents);
      applyFilter(filterType, response.data);
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      setError(parsedError.message);
      ErrorHandler.logError(parsedError);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  // Função para buscar eventos futuros
  const fetchUpcomingEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/api/v1/events/upcoming');
      setAllEvents(response.data);
      applyFilter(filterType, response.data);
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      setError(parsedError.message);
      ErrorHandler.logError(parsedError);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  // Função para buscar eventos para os quais o usuário foi convidado
  const fetchInvitedEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/api/v1/events/invited');
      setAllEvents(response.data);
      applyFilter(filterType, response.data);
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      setError(parsedError.message);
      ErrorHandler.logError(parsedError);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  // Função para buscar eventos confirmados pelo usuário
  const fetchConfirmedEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/api/v1/events/confirmed');
      setAllEvents(response.data);
      applyFilter(filterType, response.data);
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      setError(parsedError.message);
      ErrorHandler.logError(parsedError);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  // Função para aplicar filtro aos eventos
  const applyFilter = useCallback((filter: string, events: Event[] = allEvents) => {
    setFilterType(filter);
    
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        setFilteredEvents(events.filter(event => {
          const startDate = parseISO(event.startDate);
          return isAfter(startDate, now) && !event.isFinished;
        }));
        break;
      case 'past':
        setFilteredEvents(events.filter(event => {
          return event.isFinished;
        }));
        break;
      case 'today':
        setFilteredEvents(events.filter(event => {
          const startDate = parseISO(event.startDate);
          return isToday(startDate);
        }));
        break;
      case 'invited':
        setFilteredEvents(events.filter(event => {
          return event.invitations.some(
            invitation => invitation.userId === user?.uid && invitation.status === 'INVITED'
          );
        }));
        break;
      case 'confirmed':
        setFilteredEvents(events.filter(event => {
          return event.invitations.some(
            invitation => invitation.userId === user?.uid && invitation.status === 'CONFIRMED'
          );
        }));
        break;
      default: // 'all'
        setFilteredEvents(events);
        break;
    }
  }, [allEvents, user?.uid]);

  // Carregar eventos no mount do componente
  useEffect(() => {
    switch (filterType) {
      case 'upcoming':
        fetchUpcomingEvents();
        break;
      case 'invited':
        fetchInvitedEvents();
        break;
      case 'confirmed':
        fetchConfirmedEvents();
        break;
      default:
        fetchEvents();
        break;
    }
  }, [fetchEvents, fetchUpcomingEvents, fetchInvitedEvents, fetchConfirmedEvents, filterType]);

  // Função para criar evento
  const createEvent = async (eventData: EventFormData) => {
    try {
      const response = await api.post('/api/v1/events', eventData);
      
      // Atualizar lista de eventos
      fetchEvents();
      
      return response.data;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  // Função para atualizar evento
  const updateEvent = async (eventId: number, updateData: Partial<EventFormData>) => {
    try {
      const response = await api.put(`/api/v1/events/${eventId}`, updateData);
      
      // Atualizar lista de eventos
      fetchEvents();
      
      return response.data;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  // Função para excluir evento
  const deleteEvent = async (eventId: number) => {
    try {
      await api.delete(`/api/v1/events/${eventId}`);
      
      // Atualizar lista de eventos após exclusão
      setAllEvents(prev => prev.filter(event => event.id !== eventId));
      setFilteredEvents(prev => prev.filter(event => event.id !== eventId));
      
      return true;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  // Função para responder a um convite
  const respondToInvite = async (eventId: number, status: 'CONFIRMED' | 'DECLINED') => {
    try {
      const response = await api.put(`/api/v1/events/${eventId}/respond`, { status });
      
      // Update event lists after responding to invitation
      await Promise.all([
        fetchEvents(),
        fetchInvitedEvents(),
        fetchConfirmedEvents()
      ]);
      
      return response.data;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  const inviteUsers = async (eventId: number, userIds: string[]) => {
    try {
      if (!userIds.length) return null;
      
      const response = await api.post(`/api/v1/events/${eventId}/invite`, { userIds });
      
      // Update event list after inviting users
      await fetchEvents();
      
      return response.data;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  // Formatar data para exibição
  const formatEventDate = (dateString: string, includeTime: boolean = true) => {
    try {
      const date = parseISO(dateString);
      if (includeTime) {
        return format(date, "dd 'de' MMMM', às' HH:mm", { locale: ptBR });
      }
      return format(date, "dd 'de' MMMM", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  const getCurrentUserEventStatus = (event: Event): InvitationStatus | null => {
    if (!user || !event || !event.invitations) return null;
    
    const invitation = event.invitations.find(inv => inv.userId === user.uid);
    return invitation ? invitation.status : null;
  };
  const getInvitationStats = (event: Event) => {
    if (!event || !event.invitations) {
      return { confirmed: 0, pending: 0, declined: 0 };
    }
    
    return {
      confirmed: event.invitations.filter(inv => inv.status === 'CONFIRMED').length,
      pending: event.invitations.filter(inv => inv.status === 'INVITED').length,
      declined: event.invitations.filter(inv => inv.status === 'DECLINED').length
    };
  };
  // Verificar se o usuário atual é o criador do evento
  const isCurrentUserCreator = (event: Event): boolean => {
    return !!user && user.uid === event.creatorId;
  };

  return {
    events: filteredEvents,
    allEvents,
    loading,
    error,
    fetchEvents,
    fetchUpcomingEvents,
    fetchInvitedEvents,
    fetchConfirmedEvents,
    applyFilter,
    createEvent,
    updateEvent,
    deleteEvent,
    respondToInvite,
    inviteUsers,
    formatEventDate,
    getCurrentUserEventStatus,
    getInvitationStats,
    isCurrentUserCreator,
    filterType
  };
};