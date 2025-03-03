// app/(panel)/events/events-list.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEvents, Event } from '../../../src/hooks/useEvents';
import { useAuth } from '../../../src/context/AuthContext';
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFocusEffect } from '@react-navigation/native';

// Interface de tipos para as propriedades do EventItem
interface EventItemProps {
  item: Event;
  currentUserId?: string;
  onPress: (eventId: number) => void;
}


const EventItem: React.FC<EventItemProps> = ({ 
  item, 
  currentUserId,
  onPress
}) => {
  // Verificar se o usuário atual está atribuído a este evento
  const isAssignedToCurrentUser = item.invitations?.some(
    user => user.userId === currentUserId
  );
  
  // Determinar a cor do status do evento
  const getStatusColor = (event: Event) => {
    if (!event) return '#7B68EE'; // Cor padrão caso o evento seja nulo
    
    if (event.isFinished) return '#9E9E9E';
    if (event.isHappening) return '#4CAF50';
    
    // Verificar status do convite para o usuário atual
    if (currentUserId && event.invitations) {
      const userInvitation = event.invitations.find(inv => inv.userId === currentUserId);
      
      if (userInvitation) {
        switch (userInvitation.status) {
          case 'CONFIRMED': return '#7B68EE'; // Confirmado pelo usuário
          case 'INVITED': return '#FFC107';   // Convite pendente
          case 'DECLINED': return '#FF6347';  // Recusado pelo usuário
        }
      }
    }
    
    return '#7B68EE';
  };

  // Formatar data para exibição
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    
    try {
      const date = parseISO(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const isEventToday = isToday(date);
      const isEventTomorrow = isTomorrow(date);
      const isEventPast = isPast(date) && !isEventToday;
      
      const formattedDate = format(date, "dd/MM", { locale: ptBR });
      const formattedTime = format(date, "HH:mm", { locale: ptBR });
      
      if (isEventToday) return { 
        text: `Hoje, ${formattedTime}`, 
        isSpecial: true, 
        isOverdue: false 
      };
      
      if (isEventTomorrow) return { 
        text: `Amanhã, ${formattedTime}`, 
        isSpecial: true, 
        isOverdue: false 
      };
      
      return { 
        text: `${formattedDate}, ${formattedTime}`, 
        isSpecial: false, 
        isOverdue: isEventPast 
      };
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return { text: dateString, isSpecial: false, isOverdue: false };
    }
  };
  
  // Formatar a data para exibição
  const formattedDate = formatDate(item.startDate);
  
  // Contar participantes confirmados com segurança
  const confirmedCount = item.invitations 
    ? item.invitations.filter(inv => inv.status === 'CONFIRMED').length 
    : 0;
  
  return (
    <TouchableOpacity
      style={[
        styles.eventItem, 
        { borderLeftColor: getStatusColor(item) }
      ]}
      onPress={() => onPress(item.id)}
      accessibilityRole="button"
      accessibilityLabel={`Evento: ${item.title}`}
      accessibilityHint="Toque para ver detalhes do evento"
    >
      <View style={styles.eventContent}>
        <View style={styles.eventMainContent}>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {item.title || 'Sem título'}
          </Text>
          
          <View style={styles.eventDateTimeContainer}>
            <View style={styles.dateTimeRow}>
              <Ionicons name="time-outline" size={16} color="#7B68EE" style={styles.eventIcon} />
              <Text style={[
                styles.eventDateTime,
                formattedDate?.isSpecial && styles.specialDateText,
                formattedDate?.isOverdue && styles.overdueDateText
              ]}>
                {formattedDate?.text || 'Data não disponível'}
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
                {confirmedCount} {confirmedCount === 1 ? 'confirmado' : 'confirmados'}
              </Text>
            </View>
            
            {currentUserId && item.creatorId === currentUserId && (
              <View style={styles.creatorBadge}>
                <Text style={styles.creatorText}>Criador</Text>
              </View>
            )}
            
            {isAssignedToCurrentUser && currentUserId !== item.creatorId && (
              <View style={[
                styles.participantBadge,
                item.invitations?.find(inv => inv.userId === currentUserId)?.status === 'CONFIRMED' 
                  ? styles.confirmedBadge
                  : item.invitations?.find(inv => inv.userId === currentUserId)?.status === 'DECLINED'
                    ? styles.declinedBadge
                    : styles.invitedBadge
              ]}>
                <Text style={[
                  styles.participantBadgeText,
                  item.invitations?.find(inv => inv.userId === currentUserId)?.status === 'CONFIRMED'
                    ? styles.confirmedBadgeText
                    : item.invitations?.find(inv => inv.userId === currentUserId)?.status === 'DECLINED'
                      ? styles.declinedBadgeText
                      : styles.invitedBadgeText
                ]}>
                  {item.invitations?.find(inv => inv.userId === currentUserId)?.status === 'CONFIRMED'
                    ? 'Confirmado'
                    : item.invitations?.find(inv => inv.userId === currentUserId)?.status === 'DECLINED'
                      ? 'Recusado'
                      : 'Convidado'
                  }
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color="#7B68EE" />
      </View>
    </TouchableOpacity>
  );
};

interface EventsListProps {
  initialFilter?: string;
}

const EventsListScreen: React.FC<EventsListProps> = ({ initialFilter = 'all' }) => {
  const router = useRouter();
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>(initialFilter);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Definição das opções de filtro
  const eventFilters = [
    { key: 'all', label: 'Todos' },
    { key: 'upcoming', label: 'Próximos' },
    { key: 'today', label: 'Hoje' },
    { key: 'confirmed', label: 'Confirmados' },
    { key: 'invited', label: 'Convites' },
    { key: 'past', label: 'Passados' }
  ];

  // Obter hook de eventos
  const {
    events,
    loading,
    fetchEvents,
    refreshEvents,
    applyFilter,
    filterType
  } = useEvents();

  // Recarregar eventos quando a tela receber foco
  useFocusEffect(
    useCallback(() => {
      // Verificar se é necessário recarregar (tempo desde última recarga)
      const now = new Date();
      const timeSinceLastRefresh = now.getTime() - lastRefresh.getTime();
      const shouldRefresh = timeSinceLastRefresh > 30000; // 30 segundos
      
      if (shouldRefresh) {
        refreshEventsList();
        setLastRefresh(now);
      }
    }, [lastRefresh])
  );

  // Carregar eventos inicialmente com o filtro inicial
  useEffect(() => {
    // Apply the initial filter when component mounts
    applyFilter(initialFilter);
    refreshEvents(initialFilter);
  }, [initialFilter]);

  // Função de atualização para o componente
  const refreshEventsList = useCallback(async () => {
    await refreshEvents(filter);
  }, [refreshEvents, filter]);

  // Função para mudar filtro e recarregar dados
  const handleFilterChange = useCallback((newFilter: string) => {
    setFilter(newFilter);
    applyFilter(newFilter);
    refreshEvents(newFilter);
  }, [applyFilter, refreshEvents]);
  
  // Função para navegar para o detalhe do evento
  const navigateToEventDetails = useCallback((eventId: number) => {
    router.push(`/(panel)/events/${eventId}`);
  }, [router]);

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => (
          <EventItem 
            item={item}
            currentUserId={user?.uid}
            onPress={navigateToEventDetails}
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
            onRefresh={refreshEventsList}
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
  overdueDateText: {
    color: '#FF6347',
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
    color: '#aaa',
    fontSize: 12,
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
  participantBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confirmedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  invitedBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
  },
  declinedBadge: {
    backgroundColor: 'rgba(255, 99, 71, 0.15)',
  },
  participantBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  confirmedBadgeText: {
    color: '#4CAF50',
  },
  invitedBadgeText: {
    color: '#FFC107',
  },
  declinedBadgeText: {
    color: '#FF6347',
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