// app/(panel)/events/events-list.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEvents, Event } from '../../../src/hooks/useEvents';
import { useAuth } from '../../../src/context/AuthContext';
import { format, parseISO, isToday, isTomorrow, isPast, isFuture, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EventFilterProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

// Componente de filtro para eventos
const EventFilter: React.FC<EventFilterProps> = ({ activeFilter, onFilterChange }) => {
  const filters = [
    { key: 'all', label: 'Todos' },
    { key: 'upcoming', label: 'Próximos' },
    { key: 'today', label: 'Hoje' },
    { key: 'confirmed', label: 'Confirmados' },
    { key: 'invited', label: 'Convites' },
    { key: 'past', label: 'Passados' }
  ];

  return (
    <View style={styles.filterContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        {filters.map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              activeFilter === filter.key && styles.activeFilterButton
            ]}
            onPress={() => onFilterChange(filter.key)}
          >
            <Text 
              style={[
                styles.filterButtonText,
                activeFilter === filter.key && styles.activeFilterButtonText
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const EventItem: React.FC<{ event: Event }> = ({ event }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { getCurrentUserEventStatus } = useEvents();
  
  // Adicionando verificação de segurança
  if (!event || !event.invitations) {
    // Retornar um componente de fallback ou null
    return (
      <View style={styles.eventItemError}>
        <Text style={styles.eventItemErrorText}>Informações do evento indisponíveis</Text>
      </View>
    );
  }
  
  // Verificar status do usuário no evento - com verificação de segurança
  const userStatus = getCurrentUserEventStatus ? getCurrentUserEventStatus(event) : null;
  
  // Verificar se evento está acontecendo agora
  const isHappening = event.isHappening;
  
  // Verificar se evento já passou
  const isFinished = event.isFinished;
  
  // Formatar data
  const formatEventDate = (dateString: string) => {
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

  // Verificar se o usuário é o criador
  const isCreator = user?.uid === event.creatorId;

  // Estado de cor para o evento
  const getEventStatusColor = () => {
    if (isFinished) {
      return '#9E9E9E'; // Cinza para eventos passados
    } else if (isHappening) {
      return '#4CAF50'; // Verde para eventos acontecendo
    } else if (userStatus === 'CONFIRMED') {
      return '#7B68EE'; // Roxo para eventos confirmados
    } else if (userStatus === 'INVITED') {
      return '#FFC107'; // Amarelo para convites pendentes
    } else {
      return '#7B68EE'; // Roxo padrão
    }
  };

  const statusColor = getEventStatusColor();
  
  // Contagem de participantes confirmados - com verificação de segurança
  const confirmedCount = event.invitations ? 
    event.invitations.filter(inv => inv.status === 'CONFIRMED').length : 0;

  return (
    <TouchableOpacity 
      style={[
        styles.eventItem,
        { borderLeftColor: statusColor }
      ]}
      onPress={() => router.push({
        pathname: "/(panel)/events/[id]",
        params: { id: event.id.toString() }
      })}
      activeOpacity={0.7}
    >
      {/* O restante do componente permanece o mesmo */}
    </TouchableOpacity>
  );
};

// Componente de listagem de eventos
const EventsListScreen: React.FC = () => {
  const router = useRouter();
  const { filter: urlFilter } = useLocalSearchParams<{ filter?: string }>();
  const { user } = useAuth();
  
  const {
    events,
    loading,
    error,
    fetchEvents,
    fetchUpcomingEvents,
    fetchInvitedEvents,
    fetchConfirmedEvents,
    applyFilter,
    filterType
  } = useEvents({ initialFilter: urlFilter || 'all' });

  // Função para mudar filtro 
  const handleFilterChange = useCallback((newFilter: string) => {
    applyFilter(newFilter);
  }, [applyFilter]);

  // Função para recarregar eventos
  const refreshEvents = useCallback(() => {
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Eventos</Text>
        <EventFilter 
          activeFilter={filterType}
          onFilterChange={handleFilterChange}
        />
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id?.toString() || ''}
        renderItem={({ item }) => <EventItem event={item} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyStateContainer}>
            <MaterialCommunityIcons 
              name="calendar-blank" 
              size={64} 
              color="#7B68EE" 
            />
            <Text style={styles.emptyStateText}>
              {loading ? 'Carregando eventos...' : 
               filterType === 'invited' ? 'Nenhum convite pendente' : 
               filterType === 'confirmed' ? 'Nenhum evento confirmado' :
               filterType === 'today' ? 'Nenhum evento para hoje' :
               filterType === 'upcoming' ? 'Nenhum evento próximo' :
               filterType === 'past' ? 'Nenhum evento passado' :
               'Nenhum evento encontrado'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {!loading && (
                filterType === 'all' ? 'Crie seu primeiro evento clicando no botão "+' : 
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

      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => router.push('/(panel)/events/create')}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#222',
  },
  headerContainer: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  filterContainer: {
    marginBottom: 10,
  },
  filterScrollContent: {
    paddingRight: 20,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#444',
    borderWidth: 1,
    borderColor: '#555',
  },
  activeFilterButton: {
    backgroundColor: '#7B68EE',
    borderColor: '#7B68EE',
  },
  filterButtonText: {
    color: '#ccc',
    fontSize: 14,
  },
  activeFilterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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
    borderLeftColor: '#7B68EE',
    overflow: 'hidden',
  },
  eventContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventDateTimeContainer: {
    marginBottom: 10,
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
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7B68EE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7B68EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
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
   
  eventItemError: {
    backgroundColor: '#333',
    borderRadius: 10,
    marginBottom: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6347', // Vermelho para indicar erro
  },
  eventItemErrorText: {
    color: '#FF6347',
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default EventsListScreen;