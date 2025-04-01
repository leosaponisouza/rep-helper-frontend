import { useState, useCallback, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { CalendarService } from '../services/calendar/calendarService';
import { Event } from '../services/events/eventsTypes';
import { useEvents } from './useEvents';
import * as Calendar from 'expo-calendar';
import { parseISO } from 'date-fns';

export interface CalendarSyncResult {
  success: number;
  failure: number;
  calendarSource?: string | null;
}

/**
 * Hook personalizado para gerenciar a sincronização de eventos com o calendário do dispositivo
 */
export const useCalendarSync = () => {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<CalendarSyncResult | null>(null);
  const [isCalendarPickerVisible, setIsCalendarPickerVisible] = useState(false);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);
  const [selectedCalendarSource, setSelectedCalendarSource] = useState<string | null>(null);
  const [isCalendarPickerLoading, setIsCalendarPickerLoading] = useState(false);
  const [currentSyncEvent, setCurrentSyncEvent] = useState<Event | null>(null);
  const [currentSyncEvents, setCurrentSyncEvents] = useState<Event[]>([]);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const { events: allEvents } = useEvents();

  // Alias para maior clareza na interface
  const isLoading = syncing;

  // Salvar o ID do calendário selecionado
  const selectCalendar = useCallback((calendarId: string, calendarSource?: string) => {
    setSelectedCalendarId(calendarId);
    if (calendarSource) {
      setSelectedCalendarSource(calendarSource);
    }
    
    // Realizar a sincronização com o calendário selecionado
    if (currentSyncEvent) {
      syncSingleEventWithCalendar(currentSyncEvent, calendarId);
    } else if (isSyncingAll) {
      syncEventsWithCalendar(currentSyncEvents, calendarId);
    }
  }, [currentSyncEvent, currentSyncEvents, isSyncingAll]);
  
  // Função auxiliar para sincronizar um único evento com um calendário específico
  const syncSingleEventWithCalendar = useCallback(async (event: Event, calendarId?: string): Promise<boolean> => {
    try {
      setSyncing(true);
      
      // Se não tiver permissão, cancela
      const hasPermission = await CalendarService.requestCalendarPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permissão necessária',
          'Para sincronizar eventos, precisamos de acesso ao seu calendário.'
        );
        return false;
      }
      
      // Se não tiver ID de calendário, abre o seletor
      if (!calendarId && !selectedCalendarId) {
        setCurrentSyncEvent(event);
        setIsCalendarPickerVisible(true);
        return false;
      }
      
      const useCalendarId = calendarId || selectedCalendarId;
      
      // Se ainda não tiver ID de calendário, tenta obter o padrão
      if (!useCalendarId) {
        const { id: defaultId, source } = await CalendarService.getDefaultCalendarId();
        if (!defaultId) {
          Alert.alert(
            'Calendário não encontrado',
            'Não foi possível encontrar um calendário válido no seu dispositivo.',
            [
              {
                text: 'Selecionar calendário',
                onPress: () => setIsCalendarPickerVisible(true)
              },
              { text: 'Cancelar', style: 'cancel' }
            ]
          );
          return false;
        }
        
        setSelectedCalendarId(defaultId);
        setSelectedCalendarSource(source);
        
        // Criar o evento no calendário padrão
        const startDate = parseISO(event.startDate);
        const endDate = parseISO(event.endDate);
        
        const eventId = await Calendar.createEventAsync(defaultId, {
          title: event.title,
          notes: event.description,
          location: event.location,
          startDate,
          endDate,
          alarms: [{ relativeOffset: -60 }], // Lembrete 1 hora antes
        });
        
        if (eventId) {
          Alert.alert(
            'Sucesso', 
            `Evento adicionado ao calendário ${source || ''} com sucesso!`
          );
          return true;
        }
        
        return false;
      }
      
      // Criar o evento no calendário selecionado
      const startDate = parseISO(event.startDate);
      const endDate = parseISO(event.endDate);
      
      const eventId = await Calendar.createEventAsync(useCalendarId, {
        title: event.title,
        notes: event.description,
        location: event.location,
        startDate,
        endDate,
        alarms: [{ relativeOffset: -60 }], // Lembrete 1 hora antes
      });
      
      if (eventId) {
        Alert.alert(
          'Sucesso', 
          `Evento adicionado ao calendário ${selectedCalendarSource || ''} com sucesso!`
        );
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao sincronizar evento:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o evento ao calendário.');
      return false;
    } finally {
      setSyncing(false);
      setCurrentSyncEvent(null);
    }
  }, [selectedCalendarId, selectedCalendarSource]);

  // Função auxiliar para sincronizar múltiplos eventos com um calendário específico
  const syncEventsWithCalendar = useCallback(async (events: Event[], calendarId?: string): Promise<CalendarSyncResult> => {
    try {
      setSyncing(true);
      
      // Se não tiver permissão, cancela
      const hasPermission = await CalendarService.requestCalendarPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permissão necessária',
          'Para sincronizar eventos, precisamos de acesso ao seu calendário.'
        );
        return { success: 0, failure: events.length };
      }
      
      // Se não tiver ID de calendário, abre o seletor
      if (!calendarId && !selectedCalendarId) {
        setCurrentSyncEvents(events);
        setIsSyncingAll(true);
        setIsCalendarPickerVisible(true);
        return { success: 0, failure: 0 };
      }
      
      const useCalendarId = calendarId || selectedCalendarId;
      let useCalendarSource = selectedCalendarSource;
      
      // Se ainda não tiver ID de calendário, tenta obter o padrão
      if (!useCalendarId) {
        const { id: defaultId, source } = await CalendarService.getDefaultCalendarId();
        if (!defaultId) {
          Alert.alert(
            'Calendário não encontrado',
            'Não foi possível encontrar um calendário válido no seu dispositivo.',
            [
              {
                text: 'Selecionar calendário',
                onPress: () => setIsCalendarPickerVisible(true)
              },
              { text: 'Cancelar', style: 'cancel' }
            ]
          );
          return { success: 0, failure: events.length };
        }
        
        setSelectedCalendarId(defaultId);
        setSelectedCalendarSource(source);
        useCalendarSource = source;
        
        // Sincronizar todos os eventos com o calendário padrão
        let success = 0;
        let failure = 0;
        
        for (const event of events) {
          try {
            const startDate = parseISO(event.startDate);
            const endDate = parseISO(event.endDate);
            
            const eventId = await Calendar.createEventAsync(defaultId, {
              title: event.title,
              notes: event.description,
              location: event.location,
              startDate,
              endDate,
              alarms: [{ relativeOffset: -60 }], // Lembrete 1 hora antes
            });
            
            if (eventId) {
              success++;
            } else {
              failure++;
            }
          } catch (error) {
            console.error(`Erro ao sincronizar evento ${event.id}:`, error);
            failure++;
          }
        }
        
        const result = { success, failure, calendarSource: source };
        setLastSyncResult(result);
        
        const message = `Sincronização concluída com o calendário ${source || ''}!\n${result.success} evento(s) sincronizado(s) com sucesso.\n${result.failure} evento(s) não puderam ser sincronizados.`;
        Alert.alert('Sincronização concluída', message);
        
        return result;
      }
      
      // Sincronizar todos os eventos com o calendário selecionado
      let success = 0;
      let failure = 0;
      
      for (const event of events) {
        try {
          const startDate = parseISO(event.startDate);
          const endDate = parseISO(event.endDate);
          
          const eventId = await Calendar.createEventAsync(useCalendarId, {
            title: event.title,
            notes: event.description,
            location: event.location,
            startDate,
            endDate,
            alarms: [{ relativeOffset: -60 }], // Lembrete 1 hora antes
          });
          
          if (eventId) {
            success++;
          } else {
            failure++;
          }
        } catch (error) {
          console.error(`Erro ao sincronizar evento ${event.id}:`, error);
          failure++;
        }
      }
      
      const result = { success, failure, calendarSource: useCalendarSource };
      setLastSyncResult(result);
      
      const message = `Sincronização concluída com o calendário ${useCalendarSource || ''}!\n${result.success} evento(s) sincronizado(s) com sucesso.\n${result.failure} evento(s) não puderam ser sincronizados.`;
      Alert.alert('Sincronização concluída', message);
      
      return result;
    } catch (error) {
      console.error('Erro ao sincronizar eventos:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao sincronizar seus eventos com o calendário.');
      return { success: 0, failure: events.length };
    } finally {
      setSyncing(false);
      setCurrentSyncEvents([]);
      setIsSyncingAll(false);
    }
  }, [selectedCalendarId, selectedCalendarSource]);

  /**
   * Sincroniza um único evento com o calendário
   */
  const syncEventWithCalendar = useCallback(async (event: Event): Promise<boolean> => {
    try {
      setSyncing(true);
      const result = await CalendarService.addEventToCalendar(event);
      
      if (result.eventId) {
        setSelectedCalendarSource(result.calendarSource || null);
        const source = result.calendarSource ? ` ${result.calendarSource}` : '';
        Alert.alert('Sucesso', `Evento adicionado com sucesso ao calendário${source}!`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao sincronizar evento:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o evento ao calendário.');
      return false;
    } finally {
      setSyncing(false);
    }
  }, []);

  /**
   * Sincroniza todos os eventos confirmados com o calendário
   */
  const syncConfirmedEvents = useCallback(async (): Promise<CalendarSyncResult> => {
    try {
      // Filtrar eventos confirmados
      const confirmedEvents = allEvents.filter(event => 
        (event as any).status === 'confirmed' ||
        event.invitations?.some(
          invitation => invitation.status === 'CONFIRMED'
        )
      );
      
      if (confirmedEvents.length === 0) {
        Alert.alert(
          'Nenhum evento confirmado',
          'Você não tem eventos confirmados para sincronizar.'
        );
        return { success: 0, failure: 0 };
      }
      
      setSyncing(true);
      const result = await CalendarService.syncEventsWithCalendar(confirmedEvents);
      
      // Adaptar o resultado para o formato correto
      const adaptedResult: CalendarSyncResult = {
        success: result.success,
        failure: result.failed, // Convertendo de 'failed' para 'failure'
        calendarSource: result.calendarSource
      };
      
      setLastSyncResult(adaptedResult);
      setSelectedCalendarSource(result.calendarSource);
      
      const source = result.calendarSource ? ` ${result.calendarSource}` : '';
      const message = `Sincronização concluída com o calendário${source}!\n${adaptedResult.success} evento(s) sincronizado(s) com sucesso.\n${adaptedResult.failure} evento(s) não puderam ser sincronizados.`;
      Alert.alert('Sincronização concluída', message);
      
      return adaptedResult;
    } catch (error) {
      console.error('Erro ao sincronizar eventos confirmados:', error);
      Alert.alert(
        'Erro na sincronização',
        'Ocorreu um erro ao sincronizar seus eventos com o calendário.'
      );
      return { success: 0, failure: 0 };
    } finally {
      setSyncing(false);
    }
  }, [allEvents]);

  /**
   * Sincroniza todos os eventos com o calendário
   */
  const syncAllEvents = useCallback(async (): Promise<CalendarSyncResult> => {
    try {      
      if (allEvents.length === 0) {
        Alert.alert(
          'Nenhum evento disponível',
          'Você não tem eventos para sincronizar.'
        );
        return { success: 0, failure: 0 };
      }
      
      setSyncing(true);
      const result = await CalendarService.syncEventsWithCalendar(allEvents);
      
      // Adaptar o resultado para o formato correto
      const adaptedResult: CalendarSyncResult = {
        success: result.success,
        failure: result.failed, // Convertendo de 'failed' para 'failure'
        calendarSource: result.calendarSource
      };
      
      setLastSyncResult(adaptedResult);
      setSelectedCalendarSource(result.calendarSource);
      
      const source = result.calendarSource ? ` ${result.calendarSource}` : '';
      const message = `Sincronização concluída com o calendário${source}!\n${adaptedResult.success} evento(s) sincronizado(s) com sucesso.\n${adaptedResult.failure} evento(s) não puderam ser sincronizados.`;
      Alert.alert('Sincronização concluída', message);
      
      return adaptedResult;
    } catch (error) {
      console.error('Erro ao sincronizar todos os eventos:', error);
      Alert.alert(
        'Erro na sincronização',
        'Ocorreu um erro ao sincronizar seus eventos com o calendário.'
      );
      return { success: 0, failure: 0 };
    } finally {
      setSyncing(false);
    }
  }, [allEvents]);

  // Função interna para sincronizar múltiplos eventos
  const syncMultipleEvents = async (type: 'all' | 'confirmed'): Promise<CalendarSyncResult> => {
    try {
      setSyncing(true);

      // Verificar permissões
      const hasPermission = await CalendarService.requestCalendarPermissions();
      if (!hasPermission) {
        Alert.alert('Permissão Negada', 'É necessário conceder permissão para acessar o calendário.');
        return { success: 0, failure: 0 };
      }

      let calendarId = selectedCalendarId;
      let source = selectedCalendarSource;

      // Se não há calendário selecionado, tentar obter o padrão
      if (!calendarId) {
        try {
          const defaultCalendar = await CalendarService.getDefaultCalendarId();
          if (defaultCalendar) {
            calendarId = defaultCalendar.id;
            source = defaultCalendar.source;
          }
        } catch (err) {
          // Se falhar em obter o calendário padrão, mostrar seletor
          setIsCalendarPickerVisible(true);
          return { success: 0, failure: 0 };
        }
      }

      // Se ainda não há calendário selecionado, mostrar seletor
      if (!calendarId) {
        setIsCalendarPickerVisible(true);
        return { success: 0, failure: 0 };
      }

      // Filtrar eventos conforme o tipo (todos ou apenas confirmados)
      const eventsToSync = type === 'all'
        ? allEvents
        : allEvents.filter(event => 
            (event as any).status === 'confirmed' || 
            event.invitations?.some(invitation => invitation.status === 'CONFIRMED')
          );

      if (eventsToSync.length === 0) {
        Alert.alert('Nenhum Evento', 'Não há eventos para sincronizar.');
        return { success: 0, failure: 0 };
      }

      // Iniciar a sincronização
      setIsSyncingAll(true);
      
      // Implementar a sincronização manualmente para este caso específico
      let success = 0;
      let failure = 0;
      
      for (const event of eventsToSync) {
        try {
          const startDate = parseISO(event.startDate);
          const endDate = parseISO(event.endDate);
          
          if (calendarId) {
            const eventId = await Calendar.createEventAsync(calendarId, {
              title: event.title,
              notes: event.description,
              location: event.location,
              startDate,
              endDate,
              alarms: [{ relativeOffset: -60 }], // Lembrete 1 hora antes
            });
            
            if (eventId) {
              success++;
            } else {
              failure++;
            }
          }
        } catch (error) {
          console.error(`Erro ao sincronizar evento ${event.id}:`, error);
          failure++;
        }
      }
      
      const resultWithSource: CalendarSyncResult = { 
        success, 
        failure,
        calendarSource: source
      };
      
      setLastSyncResult(resultWithSource);

      if (success > 0) {
        Alert.alert(
          'Sincronização Concluída',
          `${success} eventos foram adicionados com sucesso ao ${source || 'calendário'}.${
            failure > 0 ? `\n${failure} eventos não puderam ser adicionados.` : ''
          }`
        );
      } else {
        Alert.alert(
          'Sincronização Falhou',
          'Nenhum evento pôde ser adicionado ao calendário.'
        );
      }

      return resultWithSource;
    } catch (error) {
      console.error('Erro ao sincronizar eventos:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao sincronizar os eventos com o calendário.');
      return { success: 0, failure: 0 };
    } finally {
      setSyncing(false);
      setIsSyncingAll(false);
    }
  };

  // Limpar o estado quando o componente é desmontado
  useEffect(() => {
    return () => {
      setCurrentSyncEvent(null);
      setCurrentSyncEvents([]);
      setIsSyncingAll(false);
    };
  }, []);

  return {
    syncing,
    isLoading,
    lastSyncResult,
    syncEventWithCalendar,
    syncConfirmedEvents,
    syncAllEvents,
    syncEventsWithCalendar,
    isCalendarPickerVisible,
    setIsCalendarPickerVisible,
    selectCalendar,
    selectedCalendarId,
    selectedCalendarSource
  };
}; 