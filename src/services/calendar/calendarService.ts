import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';
import { Event } from '../events/eventsTypes';
import { parseISO } from 'date-fns';

/**
 * Serviço responsável por gerenciar a sincronização com o calendário do dispositivo
 */
export class CalendarService {
  /**
   * Solicita permissões de acesso ao calendário
   */
  static async requestCalendarPermissions(): Promise<boolean> {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissões de calendário:', error);
      return false;
    }
  }

  /**
   * Obtém o ID do calendário padrão
   * Prioriza o Samsung Calendar, depois Google Calendar
   */
  static async getDefaultCalendarId(): Promise<{ id: string | null; source: string | null }> {
    try {
      // Verificar se tem permissão para acessar o calendário
      const hasPermission = await this.requestCalendarPermissions();
      if (!hasPermission) {
        return { id: null, source: null };
      }

      // Listar todos os calendários disponíveis
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      
      // Filtrar apenas calendários que permitem modificações
      const writableCalendars = calendars.filter(cal => cal.allowsModifications);
      
      if (writableCalendars.length === 0) {
        return { id: null, source: null };
      }

      // Procurar calendário da Samsung
      const samsungCalendar = writableCalendars.find(cal => 
        cal.source.name.includes('Samsung') || 
        (cal.name && cal.name.includes('Samsung'))
      );

      if (samsungCalendar) {
        return { id: samsungCalendar.id, source: 'Samsung Calendar' };
      }

      // Procurar calendário do Google
      const googleCalendar = writableCalendars.find(cal => 
        cal.source.name === 'Google' || cal.source.name.includes('Google')
      );

      if (googleCalendar) {
        return { id: googleCalendar.id, source: 'Google Calendar' };
      }

      // Se não encontrar Samsung ou Google, usa o primeiro calendário disponível
      return { 
        id: writableCalendars[0].id, 
        source: writableCalendars[0].source.name 
      };
      
    } catch (error) {
      console.error('Erro ao obter calendário padrão:', error);
      return { id: null, source: null };
    }
  }

  /**
   * Adiciona um evento ao calendário do dispositivo
   */
  static async addEventToCalendar(event: Event): Promise<{eventId: string | null, calendarSource: string | null}> {
    try {
      const hasPermission = await this.requestCalendarPermissions();
      
      if (!hasPermission) {
        Alert.alert(
          'Permissão necessária',
          'Para sincronizar eventos, precisamos de acesso ao seu calendário.'
        );
        return { eventId: null, calendarSource: null };
      }

      const { id: calendarId, source: calendarSource } = await this.getDefaultCalendarId();
      
      if (!calendarId) {
        Alert.alert(
          'Calendário não encontrado',
          'Não foi possível encontrar um calendário válido no seu dispositivo.'
        );
        return { eventId: null, calendarSource: null };
      }

      const startDate = parseISO(event.startDate);
      const endDate = parseISO(event.endDate);

      const eventId = await Calendar.createEventAsync(calendarId, {
        title: event.title,
        notes: event.description,
        location: event.location,
        startDate,
        endDate,
        alarms: [{ relativeOffset: -60 }], // Lembrete 1 hora antes
      });

      return { eventId, calendarSource };
    } catch (error) {
      console.error('Erro ao adicionar evento ao calendário:', error);
      Alert.alert(
        'Erro na sincronização',
        'Não foi possível adicionar o evento ao seu calendário.'
      );
      return { eventId: null, calendarSource: null };
    }
  }

  /**
   * Lista todos os calendários disponíveis no dispositivo
   */
  static async listAvailableCalendars(): Promise<Calendar.Calendar[]> {
    try {
      const hasPermission = await this.requestCalendarPermissions();
      
      if (!hasPermission) {
        Alert.alert(
          'Permissão necessária',
          'Para listar calendários, precisamos de acesso ao seu calendário.'
        );
        return [];
      }

      return await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    } catch (error) {
      console.error('Erro ao listar calendários:', error);
      return [];
    }
  }

  /**
   * Sincroniza múltiplos eventos com o calendário
   */
  static async syncEventsWithCalendar(events: Event[]): Promise<{ success: number, failed: number, calendarSource: string | null }> {
    let success = 0;
    let failed = 0;
    let calendarSource = null;

    const hasPermission = await this.requestCalendarPermissions();
    
    if (!hasPermission) {
      Alert.alert(
        'Permissão necessária',
        'Para sincronizar eventos, precisamos de acesso ao seu calendário.'
      );
      return { success, failed: events.length, calendarSource };
    }

    // Verificar se há algum calendário disponível
    const { id: calendarId, source } = await this.getDefaultCalendarId();
    calendarSource = source;
    
    if (!calendarId) {
      Alert.alert(
        'Calendário não encontrado',
        'Não foi possível encontrar um calendário válido no seu dispositivo. ' +
        'Verifique se você tem o Google Calendar ou Samsung Calendar instalado.'
      );
      return { success: 0, failed: events.length, calendarSource };
    }

    for (const event of events) {
      try {
        const startDate = parseISO(event.startDate);
        const endDate = parseISO(event.endDate);

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
          failed++;
        }
      } catch (error) {
        console.error(`Erro ao sincronizar evento ${event.id}:`, error);
        failed++;
      }
    }

    return { success, failed, calendarSource };
  }
} 