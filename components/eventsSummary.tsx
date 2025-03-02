// components/EventsSummary.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEvents, Event } from '../src/hooks/useEvents';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EventsSummaryProps {
  maxEvents?: number;
}

const EventsSummary: React.FC<EventsSummaryProps> = ({ maxEvents = 3 }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { events, fetchUpcomingEvents, formatEventDate } = useEvents({ initialFilter: 'upcoming' });

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        await fetchUpcomingEvents();
      } catch (error) {
        console.error('Erro ao carregar eventos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Formatar data para exibição mais amigável
  const formatEventDateForDisplay = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      
      if (isToday(date)) {
        return `Hoje, ${format(date, "HH:mm", { locale: ptBR })}`;
      } else if (isTomorrow(date)) {
        return `Amanhã, ${format(date, "HH:mm", { locale: ptBR })}`;
      } else {
        return format(date, "dd/MM, HH:mm", { locale: ptBR });
      }
    } catch (error) {
      return dateString;
    }
  };

  // Renderizar os primeiros eventos
  const eventsToShow = events.slice(0, maxEvents);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#7B68EE" />
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nenhum evento próximo</Text>
        <TouchableOpacity 
          style={styles.createEventButton}
          onPress={() => router.push('/(panel)/events/create')}
        >
          <Text style={styles.createEventText}>Criar Evento</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {eventsToShow.map((event) => (
        <TouchableOpacity
          key={event.id}
          style={styles.eventItem}
          onPress={() => router.push(`/(panel)/events/[id]?id=${event.id}`)}
        >
          <View style={styles.eventIconContainer}>
            <Ionicons name="calendar" size={24} color="#7B68EE" />
          </View>
          
          <View style={styles.eventContent}>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {event.title}
            </Text>
            
            <View style={styles.eventDetails}>
              <View style={styles.eventDetailItem}>
                <Ionicons name="time-outline" size={14} color="#aaa" />
                <Text style={styles.eventDetailText}>
                  {formatEventDateForDisplay(event.startDate)}
                </Text>
              </View>
              
              {event.location && (
                <View style={styles.eventDetailItem}>
                  <Ionicons name="location-outline" size={14} color="#aaa" />
                  <Text style={styles.eventDetailText} numberOfLines={1}>
                    {event.location}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <Ionicons name="chevron-forward" size={20} color="#7B68EE" />
        </TouchableOpacity>
      ))}
      
      {events.length > maxEvents && (
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => router.push('/(panel)/events/index')}
        >
          <Text style={styles.viewAllText}>Ver todos os eventos</Text>
          <Ionicons name="arrow-forward" size={16} color="#7B68EE" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 10,
  },
  createEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  createEventText: {
    color: '#7B68EE',
    fontSize: 14,
    fontWeight: '500',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  eventIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
    marginRight: 10,
  },
  eventTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventDetails: {
    flexDirection: 'column',
  },
  eventDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  eventDetailText: {
    color: '#aaa',
    fontSize: 12,
    marginLeft: 4,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  viewAllText: {
    color: '#7B68EE',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
});

export default EventsSummary;