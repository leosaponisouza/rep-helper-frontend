// app/(panel)/events/events-list.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import TaskFilter, { FilterOption } from '../../../components/TaskFilter';
import { useEvents, Event } from '../../../src/hooks/useEvents';
import { useAuth } from '../../../src/context/AuthContext';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFocusEffect } from '@react-navigation/native';

// Interface de tipos para as propriedades do EventItem
interface EventItemProps {
  item: Event;
  currentUserId?: string;
}

const EventItem: React.FC<EventItemProps> = ({ 
  item, 
  currentUserId
}) => {
  const router = useRouter();
  const isAssignedToCurrentUser = item.invitations?.some(user => user.userId === currentUserId);
  
  const getStatusColor = (event: Event) => {
    if (event.isFinished) return '#9E9E9E';
    if (event.isHappening) return '#4CAF50';
    return '#7B68EE';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isEventToday = date.toDateString() === today.toDateString();
    const isEventTomorrow = date.toDateString() === tomorrow.toDateString();
    
    const formattedDate = format(date, "dd/MM", { locale: ptBR });
    const formattedTime = format(date, "HH:mm", { locale: ptBR });
    
    if (isEventToday) return { text: `Hoje, ${formattedTime}`, isSpecial: true, isOverdue: false };
    if (isEventTomorrow) return { text: `Amanhã, ${formattedTime}`, isSpecial: true, isOverdue: false };
    
    return { 
      text: `${formattedDate}, ${formattedTime}`, 
      isSpecial: false, 
      isOverdue: false 
    };
  };
  
  // Formata a data para exibição
  const formattedDate = formatDate(item.startDate);
  
  // Get confirmed invitations count safely
  const confirmedCount = item.invitations 
    ? item.invitations.filter(inv => inv.status === 'CONFIRMED').length 
    : 0;
  
  return (
    <TouchableOpacity
      style={[
        styles.eventItem, 
        { borderLeftColor: getStatusColor(item) }
      ]}
      onPress={() => router.push(`/(panel)/events/${item.id}`)}
    >
      <View style={styles.eventContent}>
        <View style={styles.eventMainContent}>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {item.title}
          </Text>
          
          <View style={styles.eventDateTimeContainer}>
            <View style={styles.dateTimeRow}>
              <Ionicons name="time-outline" size={16} color="#7B68EE" style={styles.eventIcon} />
              <Text style={[
                styles.eventDateTime,
                formattedDate?.isSpecial && styles.specialDateText
              ]}>
                {formattedDate?.text}
              </Text>
            </View>
            
            {item.location && (
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={16} color="#aaa" style={styles.eventIcon} />
                <Text style={styles.eventLocation} numberOfLines={1}>{item.location}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.eventFooter}>
            <View style={styles.participantsContainer}>
              <Ionicons name="people-outline" size={16} color="#aaa" style={styles.eventIcon} />
              <Text style={styles.participantsText}>
                {confirmedCount} confirmados
              </Text>
            </View>
            
            {item.creatorId === currentUserId && (
              <View style={styles.creatorBadge}>
                <Text style={styles.creatorText}>Criador</Text>
              </View>
            )}
          </View>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color="#7B68EE" />
      </View>
    </TouchableOpacity>
  );
};
const EventsListScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>('all');

  const eventFilters: FilterOption[] = [
    { key: 'all', label: 'Todos' },
    { key: 'upcoming', label: 'Próximos' },
    { key: 'today', label: 'Hoje' },
    { key: 'confirmed', label: 'Confirmados' },
    { key: 'invited', label: 'Convites' },
    { key: 'past', label: 'Passados' }
  ];

  const {
    events,
    loading,
    fetchEvents,
    fetchUpcomingEvents,
    fetchInvitedEvents,
    fetchConfirmedEvents,
    applyFilter,
    filterType
  } = useEvents();

  // Recarregar eventos quando a tela receber foco
  useFocusEffect(
    useCallback(() => {
      refreshEvents();
    }, [])
  );

  // Função para mudar filtro localmente
  const handleFilterChange = useCallback((newFilter: string) => {
    setFilter(newFilter);
    applyFilter(newFilter);
    
    // Se o filtro for específico, faça a chamada API correspondente
    switch (newFilter) {
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
  }, [applyFilter, fetchUpcomingEvents, fetchInvitedEvents, fetchConfirmedEvents, fetchEvents]);

  // Função de atualização para o componente
  const refreshEvents = useCallback(() => {
    switch (filter) {
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
  }, [fetchUpcomingEvents, fetchInvitedEvents, fetchConfirmedEvents, fetchEvents, filter]);

  return (
    <View style={styles.container}>
      <TaskFilter 
        filters={eventFilters}
        activeFilter={filter}
        onFilterChange={handleFilterChange}
      />

      <FlatList
        data={events}
        keyExtractor={(item) => item.id?.toString() || ''}
        renderItem={({ item }) => (
          <EventItem 
            item={item}
            currentUserId={user?.uid}
          />
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyStateContainer}>
            <MaterialCommunityIcons 
              name="calendar-blank" 
              size={64} 
              color="#7B68EE" 
            />
            <Text style={styles.emptyStateText}>
              {loading ? 'Carregando eventos...' : 
              filter === 'invited' ? 'Nenhum convite pendente' : 
              filter === 'confirmed' ? 'Nenhum evento confirmado' :
              filter === 'today' ? 'Nenhum evento para hoje' :
              filter === 'upcoming' ? 'Nenhum evento próximo' :
              filter === 'past' ? 'Nenhum evento passado' :
              'Nenhum evento encontrado'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {!loading && (
                filter === 'all' ? 'Crie seu primeiro evento clicando no botão "+' : 
                'Ajuste os filtros ou crie um novo evento'
              )}
            </Text>
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshEvents}
            colors={['#7B68EE']}
            tintColor={'#7B68EE'}
          />
        }
        contentContainerStyle={[
          styles.listContainer,
          events.length === 0 && { flex: 1, justifyContent: 'center' }
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  listContainer: {
    flexGrow: 1,
    backgroundColor: '#222',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  eventItem: {
    backgroundColor: '#333',
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  eventContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventMainContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  eventDateTimeContainer: {
    marginBottom: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventIcon: {
    marginRight: 6,
  },
  eventDateTime: {
    color: '#fff',
    fontSize: 14,
  },
  specialDateText: {
    color: '#7B68EE',
    fontWeight: 'bold',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventLocation: {
    color: '#ccc',
    fontSize: 14,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsText: {
    color: '#ccc',
    fontSize: 14,
  },
  creatorBadge: {
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  creatorText: {
    color: '#7B68EE',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default EventsListScreen;