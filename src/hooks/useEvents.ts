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
 * Hook personalizado para gerenciar eventos
 */
export const useEvents = (options: UseEventsOptions = {}) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<EventFilterType>(options.initialFilter || 'all');
  
  // Referência para controlar se já carregou eventos ao menos uma vez
  const hasLoadedEvents = useRef(false);

  // Processa eventos para garantir que todas as propriedades existam
  const processEvents = useCallback((eventsData: Event[]): Event[] => {
    return eventsData.map(event => {
      // Garantir que invitations nunca seja null
      const processedEvent = {
        ...event,
        invitations: event.invitations || [],
      };
      
      // Adicionar flags de status se não presentes
      if (typeof processedEvent.isHappening !== 'boolean') {
        const now = new Date();
        const startDate = parseISO(processedEvent.startDate);
        const endDate = parseISO(processedEvent.endDate);
        processedEvent.isHappening = isAfter(now, startDate) && isBefore(now, endDate);
      }
      
      if (typeof processedEvent.isFinished !== 'boolean') {
        const now = new Date();
        const endDate = parseISO(processedEvent.endDate);
        processedEvent.isFinished = isAfter(now, endDate);
      }
      
      return processedEvent;
    });
  }, []);

  // Função para aplicar filtro aos eventos
  const applyFilter = useCallback((filter: EventFilterType, eventsToFilter: Event[] = events) => {
    setFilterType(filter);
    
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        setFilteredEvents(eventsToFilter.filter(event => {
          const startDate = parseISO(event.startDate);
          return isAfter(startDate, now) && !event.isFinished;
        }));
        break;
      case 'past':
        setFilteredEvents(eventsToFilter.filter(event => {
          return event.isFinished;
        }));
        break;
      case 'today':
        setFilteredEvents(eventsToFilter.filter(event => {
          const startDate = parseISO(event.startDate);
          return isToday(startDate);
        }));
        break;
      case 'invited':
        setFilteredEvents(eventsToFilter.filter(event => {
          return event.invitations?.some(
            invitation => invitation.userId === user?.uid && invitation.status === 'INVITED'
          );
        }));
        break;
      case 'confirmed':
        setFilteredEvents(eventsToFilter.filter(event => {
          return event.invitations?.some(
            invitation => invitation.userId === user?.uid && invitation.status === 'CONFIRMED'
          );
        }));
        break;
      case 'mine':
        setFilteredEvents(eventsToFilter.filter(event => {
          return event.creatorId === user?.uid;
        }));
        break;
      default: // 'all'
        setFilteredEvents(eventsToFilter);
        break;
    }
  }, [events, user?.uid]);

  // Função unificada para buscar eventos
  const fetchEvents = useCallback(async (filter?: EventFilterType) => {
    try {
      setLoading(true);
      setError(null);

      let eventsData: Event[] = [];
      const filterToUse = filter || filterType;
      
      // Determinar qual API chamar com base no filtro
      switch (filterToUse) {
        case 'upcoming':
          eventsData = await EventsService.fetchUpcomingEvents();
          break;
        case 'invited':
          eventsData = await EventsService.fetchInvitedEvents();
          break;
        case 'confirmed':
          eventsData = await EventsService.fetchConfirmedEvents();
          break;
        default:
          eventsData = await EventsService.fetchAllEvents();
          break;
      }
      
      const processedEvents = processEvents(eventsData);
      setEvents(processedEvents);
      applyFilter(filterToUse, processedEvents);
      return true;
    } catch (err: any) {
      console.error('Erro ao carregar eventos:', err);
      setError(err.message || 'Falha ao buscar eventos');
      return false;
    } finally {
      setLoading(false);
    }
  }, [filterType, processEvents, applyFilter]);

  // Carregar eventos na montagem do componente
  useEffect(() => {
    // Verifica se já carregou eventos para evitar requisições em loop
    if (!hasLoadedEvents.current) {
      fetchEvents(filterType);
      hasLoadedEvents.current = true;
    }
  }, [fetchEvents, filterType]);

  // Função para atualizar eventos
  const refreshEvents = useCallback(async (specificFilter?: EventFilterType) => {
    return fetchEvents(specificFilter || filterType);
  }, [fetchEvents, filterType]);

  // Função para criar evento
  const createEvent = useCallback(async (eventData: EventFormData) => {
    try {
      const newEvent = await EventsService.createEvent(eventData);
      
      // Processar o novo evento
      const processedEvent = processEvents([newEvent])[0];
      
      // Adicionar o evento à lista
      setEvents(prev => {
        const exists = prev.some(e => e.id === newEvent.id);
        if (exists) {
          return prev.map(e => e.id === newEvent.id ? processedEvent : e);
        }
        return [...prev, processedEvent];
      });
      
      // Aplicar o filtro atual
      applyFilter(filterType);
      
      return newEvent;
    } catch (err) {
      console.error('Erro ao criar evento:', err);
      throw err;
    }
  }, [processEvents, applyFilter, filterType]);

  // Função para atualizar evento
  const updateEvent = useCallback(async (eventId: number, updateData: Partial<EventFormData>) => {
    try {
      const updatedEvent = await EventsService.updateEvent(eventId, updateData);
      
      // Processar o evento atualizado
      const processedEvent = processEvents([updatedEvent])[0];
      
      // Atualizar o evento na lista
      setEvents(prev => 
        prev.map(event => event.id === eventId ? processedEvent : event)
      );
      
      // Aplicar o filtro atual
      applyFilter(filterType);
      
      return updatedEvent;
    } catch (err) {
      console.error('Erro ao atualizar evento:', err);
      throw err;
    }
  }, [processEvents, applyFilter, filterType]);

  // Função para excluir evento
  const deleteEvent = useCallback(async (eventId: number) => {
    try {
      await EventsService.deleteEvent(eventId);
      
      // Remover o evento das listas
      setEvents(prev => prev.filter(event => event.id !== eventId));
      setFilteredEvents(prev => prev.filter(event => event.id !== eventId));
      
      return true;
    } catch (err) {
      console.error('Erro ao excluir evento:', err);
      throw err;
    }
  }, []);

  // Função para responder a um convite de evento
  const respondToInvite = useCallback(async (eventId: number | string, userId: string, status: InvitationStatus) => {
    try {
      const updatedEvent = await EventsService.updateInvitationStatus(eventId, userId, status);
      
      // Processar o evento atualizado
      const processedEvent = processEvents([updatedEvent])[0];
      
      // Atualizar o evento na lista
      setEvents(prev => 
        prev.map(event => event.id === Number(eventId) ? processedEvent : event)
      );
      
      // Aplicar o filtro atual
      applyFilter(filterType);
      
      return updatedEvent;
    } catch (err) {
      console.error('Erro ao responder ao convite:', err);
      throw err;
    }
  }, [processEvents, applyFilter, filterType]);

  // Alias para respondToInvite para manter compatibilidade
  const updateInvitationStatus = useCallback((eventId: number | string, userId: string, status: InvitationStatus) => {
    return respondToInvite(eventId, userId, status);
  }, [respondToInvite]);

  // Função para convidar usuários para um evento
  const inviteUsers = useCallback(async (eventId: number, userIds: string[]) => {
    try {
      if (!userIds.length) return null;
      
      const response = await EventsService.inviteUsers(eventId, userIds);
      
      // Após convidar usuários, buscar o evento atualizado
      try {
        const updatedEvent = await EventsService.getEventById(eventId);
        
        // Processar o evento atualizado
        const processedEvent = processEvents([updatedEvent])[0];
        
        // Atualizar o evento na lista
        setEvents(prev => 
          prev.map(event => event.id === eventId ? processedEvent : event)
        );
        
        // Aplicar o filtro atual
        applyFilter(filterType);
      } catch (error) {
        console.error('Erro ao buscar detalhes atualizados do evento após convite:', error);
      }
      
      return response;
    } catch (err) {
      console.error('Erro ao convidar usuários:', err);
      throw err;
    }
  }, [processEvents, applyFilter, filterType]);

  // Função para obter evento por ID
  const getEventById = useCallback(async (eventId: string | number): Promise<Event | null> => {
    try {
      return await EventsService.getEventById(eventId);
    } catch (err) {
      console.error('Erro ao obter evento por ID:', err);
      return null;
    }
  }, []);

  // Formatar data para exibição
  const formatEventDate = useCallback((dateString?: string, includeTime: boolean = true): string => {
    if (!dateString) return '';
    
    try {
      const date = parseISO(dateString);
      if (includeTime) {
        return format(date, "dd 'de' MMMM', às' HH:mm", { locale: ptBR });
      }
      return format(date, "dd 'de' MMMM", { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data do evento:', error, dateString);
      return dateString;
    }
  }, []);

  // Obter status do usuário atual para um evento
  const getCurrentUserEventStatus = useCallback((event: Event): InvitationStatus | null => {
    if (!user || !event || !event.invitations) return null;
    
    const invitation = event.invitations.find(inv => inv.userId === user.uid);
    return invitation ? invitation.status : null;
  }, [user]);
  
  // Obter estatísticas de convites para um evento
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
  
  // Verificar se o usuário atual é o criador do evento
  const isCurrentUserCreator = useCallback((event: Event): boolean => {
    return !!user && user.uid === event.creatorId;
  }, [user]);

  // Memoizar o valor de retorno para evitar renderizações desnecessárias
  return useMemo(() => ({
    events: filteredEvents,
    allEvents: events,
    loading,
    error,
    fetchEvents,
    refreshEvents,
    applyFilter,
    createEvent,
    updateEvent,
    deleteEvent,
    respondToInvite,
    updateInvitationStatus,
    inviteUsers,
    formatEventDate,
    getCurrentUserEventStatus,
    getInvitationStats,
    isCurrentUserCreator,
    filterType,
    getEventById
  }), [
    filteredEvents,
    events,
    loading,
    error,
    fetchEvents,
    refreshEvents,
    applyFilter,
    createEvent,
    updateEvent,
    deleteEvent,
    respondToInvite,
    updateInvitationStatus,
    inviteUsers,
    formatEventDate,
    getCurrentUserEventStatus,
    getInvitationStats,
    isCurrentUserCreator,
    filterType,
    getEventById
  ]);
};

// Exportar tipos para uso direto pelos componentes
export { Event, EventFilterType };