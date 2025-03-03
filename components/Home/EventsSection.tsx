// components/Home/EventsSection.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Event } from '../../src/hooks/useEvents';

interface EventsSectionProps {
  events: Event[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onViewAll: () => void;
  onCreateEvent: () => void;
}

const EventsSection: React.FC<EventsSectionProps> = ({
  events,
  loading,
  error,
  onRetry,
  onViewAll,
  onCreateEvent
}) => {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name="calendar" size={20} color="#7B68EE" />
          <Text style={styles.sectionTitle}>Próximos Eventos</Text>
        </View>
        
        <TouchableOpacity 
          onPress={onViewAll}
          style={styles.viewAllButton}
        >
          <Text style={styles.viewAllText}>Ver todos</Text>
          <Ionicons name="chevron-forward" size={16} color="#7B68EE" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#7B68EE" />
          <Text style={styles.loadingText}>Carregando eventos...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#FF6347" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={onRetry}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : events.length > 0 ? (
        <View style={styles.eventsContainer}>
          {events.map(event => (
            <EventItem key={event.id?.toString()} event={event} />
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name="calendar" 
            size={40} 
            color="#7B68EE" 
            style={{ opacity: 0.6 }}
          />
          <Text style={styles.emptyText}>
            Nenhum evento programado
          </Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={onCreateEvent}
          >
            <Text style={styles.createButtonText}>Criar Evento</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

interface EventItemProps {
  event: Event;
}

const EventItem: React.FC<EventItemProps> = ({ event }) => {
  // Formatar data para exibição
  const formatEventDate = (dateString?: string) => {
    if (!dateString) return null;
    
    try {
      const eventDate = parseISO(dateString);
      
      if (isToday(eventDate)) {
        const timeStr = format(eventDate, 'HH:mm', { locale: ptBR });
        return { text: `Hoje, ${timeStr}`, color: '#4CAF50', isToday: true };
      } else if (isTomorrow(eventDate)) {
        const timeStr = format(eventDate, 'HH:mm', { locale: ptBR });
        return { text: `Amanhã, ${timeStr}`, color: '#FF9800', isToday: false };
      } else {
        const dateStr = format(eventDate, 'dd/MM', { locale: ptBR });
        const timeStr = format(eventDate, 'HH:mm', { locale: ptBR });
        return { 
          text: `${dateStr}, ${timeStr}`,
          color: '#7B68EE',
          isToday: false
        };
      }
    } catch (error) {
      return { text: 'Data inválida', color: '#9E9E9E', isToday: false };
    }
  };

  const eventDate = formatEventDate(event.startDate);
  const confirmedCount = event.invitations?.filter(inv => inv.status === 'CONFIRMED').length || 0;

  return (
    <TouchableOpacity 
      style={[
        styles.eventItem,
        event.isHappening && styles.happeningEventItem
      ]}
    >
      {event.isHappening && (
        <View style={styles.liveIndicatorContainer}>
          <View style={styles.liveIndicator} />
          <Text style={styles.liveText}>AGORA</Text>
        </View>
      )}
      
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle} numberOfLines={1}>
          {event.title}
        </Text>
        
        <View style={styles.eventDetails}>
          {eventDate && (
            <View style={styles.eventDateContainer}>
              <Ionicons name="time" size={14} color={eventDate.color} />
              <Text style={[styles.eventDateText, { color: eventDate.color }]}>
                {eventDate.text}
              </Text>
            </View>
          )}
          
          {event.location && (
            <View style={styles.eventLocationContainer}>
              <Ionicons name="location" size={14} color="#9E9E9E" />
              <Text style={styles.eventLocationText} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.eventFooter}>
          <View style={styles.attendeesInfo}>
            <Ionicons name="people" size={14} color="#7B68EE" />
            <Text style={styles.attendeesText}>
              {confirmedCount} {confirmedCount === 1 ? 'participante' : 'participantes'}
            </Text>
          </View>
          
          {event.isHappening && (
            <View style={styles.happeningBadge}>
              <Text style={styles.happeningText}>Acontecendo</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#7B68EE',
    fontSize: 14,
    marginRight: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#aaa',
    marginTop: 10,
    fontSize: 14,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF6347',
    marginTop: 10,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 99, 71, 0.15)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#FF6347',
    fontWeight: 'bold',
  },
  eventsContainer: {
    marginBottom: 8,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    marginVertical: 16,
    fontSize: 14,
  },
  createButton: {
    backgroundColor: '#7B68EE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  eventItem: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    position: 'relative',
  },
  happeningEventItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  liveIndicatorContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    zIndex: 1,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 4,
  },
  liveText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: 'bold',
  },
  eventContent: {
    paddingRight: 70, // Espaço para o indicador "AGORA"
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  eventDetails: {
    marginBottom: 8,
  },
  eventDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventDateText: {
    fontSize: 12,
    marginLeft: 5,
    fontWeight: '500',
  },
  eventLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventLocationText: {
    fontSize: 12,
    color: '#aaa',
    marginLeft: 5,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendeesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeesText: {
    fontSize: 12,
    color: '#aaa',
    marginLeft: 5,
  },
  happeningBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  happeningText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: 'bold',
  }
});

export default EventsSection;