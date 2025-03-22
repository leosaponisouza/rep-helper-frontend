// src/hooks/useEvents.ts
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { format, parseISO, isAfter, isBefore, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Event, 
  EventFormData, 
  InvitationStatus, 
  EventFilterType,
  EventStats,
  EventsService
} from '../services/events';

interface UseEventsOptions {
  initialFilter?: EventFilterType;
}

/**
 * Custom hook for managing events with improved performance and type safety
 */
export const useEvents = (options: UseEventsOptions = {}) => {
  const { user } = useAuth();
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<EventFilterType>(options.initialFilter || 'all');
  
  // Adiciona estado para controlar requisições em andamento e evitar duplicidade
  const [requestInProgress, setRequestInProgress] = useState(false);
  
  // Referência para controlar debounce de operações
  const operationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Utility functions to check event status
  const checkEventIsHappening = useCallback((event: Event): boolean => {
    try {
      const now = new Date();
      const startDate = parseISO(event.startDate);
      const endDate = parseISO(event.endDate);
      
      return isAfter(now, startDate) && isBefore(now, endDate);
    } catch (error) {
      console.error('Error checking if event is happening:', error);
      return false;
    }
  }, []);

  const checkEventIsFinished = useCallback((event: Event): boolean => {
    try {
      const now = new Date();
      const endDate = parseISO(event.endDate);
      
      return isAfter(now, endDate);
    } catch (error) {
      console.error('Error checking if event is finished:', error);
      return false;
    }
  }, []);

  // Process events to ensure all required properties exist
  const processEvents = useCallback((events: Event[]): Event[] => {
    return events.map(event => {
      // Ensure invitations is never null
      const processedEvent = {
        ...event,
        invitations: event.invitations || [],
      };
      
      // Add status flags if not present
      if (typeof processedEvent.isHappening !== 'boolean') {
        processedEvent.isHappening = checkEventIsHappening(processedEvent);
      }
      
      if (typeof processedEvent.isFinished !== 'boolean') {
        processedEvent.isFinished = checkEventIsFinished(processedEvent);
      }
      
      return processedEvent;
    });
  }, [checkEventIsHappening, checkEventIsFinished]);

  // Unified function to fetch events
  const fetchEvents = useCallback(async (filter?: EventFilterType) => {
    // Evita requisições duplicadas
    if (requestInProgress) {
      console.log('Uma requisição já está em andamento. Ignorando nova chamada.');
      return;
    }
    
    try {
      setRequestInProgress(true);
      setLoading(true);
      setError(null);

      let events: Event[] = [];
      
      // Determine which API to call based on filter
      switch (filter) {
        case 'upcoming':
          events = await EventsService.fetchUpcomingEvents();
          break;
        case 'invited':
          events = await EventsService.fetchInvitedEvents();
          break;
        case 'confirmed':
          events = await EventsService.fetchConfirmedEvents();
          break;
        default:
          events = await EventsService.fetchAllEvents();
          break;
      }
      
      const normalizedEvents = processEvents(events);
      
      setAllEvents(normalizedEvents);
      applyFilter(filter || filterType, normalizedEvents);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
      setRequestInProgress(false);
    }
  }, [filterType, processEvents, requestInProgress]);

  // Function to apply filter to events
  const applyFilter = useCallback((filter: EventFilterType, events: Event[] = allEvents) => {
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
          return event.invitations?.some(
            invitation => invitation.userId === user?.uid && invitation.status === 'INVITED'
          );
        }));
        break;
      case 'confirmed':
        setFilteredEvents(events.filter(event => {
          return event.invitations?.some(
            invitation => invitation.userId === user?.uid && invitation.status === 'CONFIRMED'
          );
        }));
        break;
      default: // 'all'
        setFilteredEvents(events);
        break;
    }
  }, [allEvents, user?.uid]);

  // Load events on component mount
  useEffect(() => {
    // No useEffect não usamos o debounce, mas apenas verificamos se já existe uma requisição
    if (!requestInProgress) {
      fetchEvents(filterType);
    }
  }, [fetchEvents, filterType, requestInProgress]);

  // Function to refresh events com debounce
  const refreshEvents = useCallback(async (specificFilter?: EventFilterType) => {
    // Limpa timeout anterior se existir
    if (operationTimeoutRef.current) {
      clearTimeout(operationTimeoutRef.current);
    }
    
    // Evita requisições duplicadas
    if (requestInProgress) {
      console.log('Uma requisição já está em andamento. Ignorando refresh.');
      return false;
    }
    
    const filterToUse = specificFilter || filterType;
    
    try {
      setRequestInProgress(true);
      setLoading(true);
      await fetchEvents(filterToUse);
      return true;
    } catch (error) {
      console.error('Error refreshing events:', error);
      return false;
    } finally {
      setLoading(false);
      setRequestInProgress(false);
    }
  }, [fetchEvents, filterType, requestInProgress]);

  // Function to create event
  const createEvent = useCallback(async (eventData: EventFormData) => {
    if (requestInProgress) {
      console.log('Uma requisição já está em andamento. Ignorando criação de evento.');
      throw new Error('Uma ação já está em andamento. Tente novamente em instantes.');
    }
    
    try {
      setRequestInProgress(true);
      const newEvent = await EventsService.createEvent(eventData);
      
      // Aplicamos debounce para o refresh após criar o evento
      if (operationTimeoutRef.current) {
        clearTimeout(operationTimeoutRef.current);
      }
      
      operationTimeoutRef.current = setTimeout(async () => {
        await refreshEvents();
        operationTimeoutRef.current = null;
      }, 300);
      
      return newEvent;
    } catch (err) {
      console.error('Error creating event:', err);
      throw err;
    } finally {
      setRequestInProgress(false);
    }
  }, [refreshEvents, requestInProgress]);

  // Function to update event
  const updateEvent = useCallback(async (eventId: number, updateData: Partial<EventFormData>) => {
    if (requestInProgress) {
      console.log('Uma requisição já está em andamento. Ignorando atualização de evento.');
      throw new Error('Uma ação já está em andamento. Tente novamente em instantes.');
    }
    
    try {
      setRequestInProgress(true);
      const updatedEvent = await EventsService.updateEvent(eventId, updateData);
      
      // Aplicamos debounce para o refresh após atualizar o evento
      if (operationTimeoutRef.current) {
        clearTimeout(operationTimeoutRef.current);
      }
      
      operationTimeoutRef.current = setTimeout(async () => {
        await refreshEvents();
        operationTimeoutRef.current = null;
      }, 300);
      
      return updatedEvent;
    } catch (err) {
      console.error('Error updating event:', err);
      throw err;
    } finally {
      setRequestInProgress(false);
    }
  }, [refreshEvents, requestInProgress]);

  // Function to delete event
  const deleteEvent = useCallback(async (eventId: number) => {
    if (requestInProgress) {
      console.log('Uma requisição já está em andamento. Ignorando exclusão de evento.');
      throw new Error('Uma ação já está em andamento. Tente novamente em instantes.');
    }
    
    try {
      setRequestInProgress(true);
      await EventsService.deleteEvent(eventId);
      
      // Update events list after deletion
      setAllEvents(prev => prev.filter(event => event.id !== eventId));
      setFilteredEvents(prev => prev.filter(event => event.id !== eventId));
      
      return true;
    } catch (err) {
      console.error('Error deleting event:', err);
      throw err;
    } finally {
      setRequestInProgress(false);
    }
  }, [requestInProgress]);

  // Function to respond to an invitation
  const updateInvitationStatus = useCallback(async (
    eventId: number | string, 
    userId: string, 
    status: InvitationStatus
  ) => {
    if (requestInProgress) {
      console.log('Uma requisição já está em andamento. Ignorando atualização de convite.');
      throw new Error('Uma ação já está em andamento. Tente novamente em instantes.');
    }
    
    try {
      setRequestInProgress(true);
      const response = await EventsService.updateInvitationStatus(eventId, userId, status);
      
      // Update only the changed event in the current list
      setAllEvents(prev => 
        prev.map(event => 
          event.id === Number(eventId) 
            ? {
                ...event, 
                invitations: event.invitations.map(inv => 
                  inv.userId === userId 
                    ? { ...inv, status } 
                    : inv
                )
              } 
            : event
        )
      );
      
      // Apply filter again to update filtered list
      applyFilter(filterType);
      
      return response;
    } catch (err) {
      console.error('Error updating invitation status:', err);
      throw err;
    } finally {
      setRequestInProgress(false);
    }
  }, [applyFilter, filterType, requestInProgress]);

  // Function to invite users to an event
  const inviteUsers = useCallback(async (eventId: number, userIds: string[]) => {
    if (requestInProgress) {
      console.log('Uma requisição já está em andamento. Ignorando convite de usuários.');
      throw new Error('Uma ação já está em andamento. Tente novamente em instantes.');
    }
    
    try {
      if (!userIds.length) return null;
      
      setRequestInProgress(true);
      const response = await EventsService.inviteUsers(eventId, userIds);
      
      // After inviting users, fetch the specific event again
      try {
        const updatedEvent = await EventsService.getEventById(eventId);
        
        // Update the event in the list
        setAllEvents(prev => 
          prev.map(event => 
            event.id === eventId ? updatedEvent : event
          )
        );
        
        // Apply filter again
        applyFilter(filterType);
      } catch (error) {
        console.error('Error fetching updated event data:', error);
      }
      
      return response;
    } catch (err) {
      console.error('Error inviting users:', err);
      throw err;
    } finally {
      setRequestInProgress(false);
    }
  }, [applyFilter, filterType, requestInProgress]);

  // Function to get event by ID
  const getEventById = useCallback(async (eventId: string | number): Promise<Event | null> => {
    // Não precisamos bloquear essa operação com requestInProgress
    // pois ela é apenas uma consulta que não modifica dados
    try {
      return await EventsService.getEventById(eventId);
    } catch (err) {
      console.error('Error getting event by ID:', err);
      return null;
    }
  }, []);

  // Format date for display
  const formatEventDate = useCallback((dateString?: string, includeTime: boolean = true): string => {
    if (!dateString) return '';
    
    try {
      const date = parseISO(dateString);
      if (includeTime) {
        return format(date, "dd 'de' MMMM', às' HH:mm", { locale: ptBR });
      }
      return format(date, "dd 'de' MMMM", { locale: ptBR });
    } catch (error) {
      console.error('Error formatting event date:', error, dateString);
      return dateString;
    }
  }, []);

  // Get current user's status for an event
  const getCurrentUserEventStatus = useCallback((event: Event): InvitationStatus | null => {
    if (!user || !event || !event.invitations) return null;
    
    const invitation = event.invitations.find(inv => inv.userId === user.uid);
    return invitation ? invitation.status : null;
  }, [user]);
  
  // Get invitation statistics for an event
  const getInvitationStats = useCallback((event: Event): EventStats => {
    if (!event || !event.invitations) {
      return { confirmed: 0, pending: 0, declined: 0 };
    }
    
    return {
      confirmed: event.invitations.filter(inv => inv.status === 'CONFIRMED').length,
      pending: event.invitations.filter(inv => inv.status === 'INVITED').length,
      declined: event.invitations.filter(inv => inv.status === 'DECLINED').length
    };
  }, []);
  
  // Check if current user is the creator of the event
  const isCurrentUserCreator = useCallback((event: Event): boolean => {
    return !!user && user.uid === event.creatorId;
  }, [user]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    events: filteredEvents,
    allEvents,
    loading,
    error,
    fetchEvents,
    refreshEvents,
    applyFilter,
    createEvent,
    updateEvent,
    deleteEvent,
    respondToInvite: updateInvitationStatus, // Alias for backward compatibility
    updateInvitationStatus,
    inviteUsers,
    formatEventDate,
    getCurrentUserEventStatus,
    getInvitationStats,
    isCurrentUserCreator,
    filterType,
    getEventById,
    requestInProgress // Exportamos este estado para componentes que precisem saber se uma operação está em andamento
  }), [
    filteredEvents,
    allEvents,
    loading,
    error,
    fetchEvents,
    refreshEvents,
    applyFilter,
    createEvent,
    updateEvent,
    deleteEvent,
    updateInvitationStatus,
    inviteUsers,
    formatEventDate,
    getCurrentUserEventStatus,
    getInvitationStats,
    isCurrentUserCreator,
    filterType,
    getEventById,
    requestInProgress
  ]);
};

// Re-export types from the service for backward compatibility
export type { Event, EventFormData, InvitationStatus, EventFilterType, EventStats, EventInvitation } from '../services/events';

// Re-export the EventsProvider from the context
export { EventsProvider } from '../context/EventsContext';