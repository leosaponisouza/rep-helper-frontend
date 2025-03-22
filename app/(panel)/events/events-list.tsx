// app/(panel)/events/events-list.tsx - Versão otimizada com melhor UX e performance
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEvents, Event, EventFilterType } from '../../../src/hooks/useEvents';
import { useAuth } from '../../../src/context/AuthContext';
import { format, parseISO, isToday, isTomorrow, isPast, isAfter, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const { width } = Dimensions.get('window');

// Componente otimizado para a lista de eventos
const EventsListScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { events, loading, refreshEvents } = useEvents();
  
  // Estados
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<EventFilterType>('upcoming');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState<boolean>(false);
  
  // Animações
  const scrollY = useState(new Animated.Value(0))[0];
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.9],
    extrapolate: 'clamp'
  });
  
  // Carregamento inicial - acontece apenas uma vez ao montar o componente
  useEffect(() => {
    if (!initialLoadDone) {
      refreshEventsList();
      setInitialLoadDone(true);
    }
  }, [initialLoadDone]);
  
  // Função para recarregar a lista de eventos - otimizada
  const refreshEventsList = useCallback(async () => {
    try {
      setRefreshing(true);
      setErrorMessage(null);
      await refreshEvents(filter);
    } catch (error) {
      console.error('Error refreshing events list:', error);
      setErrorMessage('Não foi possível carregar os eventos. Tente novamente.');
    } finally {
      setRefreshing(false);
    }
  }, [refreshEvents, filter]);
  
  // Quando o filtro muda, atualiza a lista
  useEffect(() => {
    if (initialLoadDone) {
      refreshEventsList();
    }
  }, [filter, initialLoadDone, refreshEventsList]);
  
  // Filtrar eventos com base no filtro selecionado - otimizado com useMemo
  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return events
          .filter(event => {
            if (!event.startDate) return false;
            const eventDate = parseISO(event.startDate);
            return isAfter(eventDate, now) || isToday(eventDate);
          })
          .sort((a, b) => {
            if (!a.startDate || !b.startDate) return 0;
            return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          });
      
      case 'past':
        return events
          .filter(event => {
            if (!event.startDate) return false;
            const eventDate = parseISO(event.startDate);
            return isBefore(eventDate, now) && !isToday(eventDate);
          })
          .sort((a, b) => {
            if (!a.startDate || !b.startDate) return 0;
            return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
          });
      
      case 'mine':
        return events
          .filter(event => {
            // Verificar se o usuário é o criador ou está confirmado
            const isCreator = event.creatorId === user?.uid;
            const isConfirmed = event.invitations?.some(
              inv => inv.userId === user?.uid && inv.status === 'CONFIRMED'
            );
            return isCreator || isConfirmed;
          })
          .sort((a, b) => {
            if (!a.startDate || !b.startDate) return 0;
            return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          });
      
      default: // 'all'
        return events.sort((a, b) => {
          if (!a.startDate || !b.startDate) return 0;
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        });
    }
  }, [events, filter, user]);
  
  // Agrupar eventos por data - otimizado com useMemo
  const groupedEvents = useMemo(() => {
    if (!filteredEvents || filteredEvents.length === 0) return [];
    
    const groups: { title: string, data: Event[] }[] = [];
    const now = new Date();
    const tomorrow = addDays(now, 1);
    
    // Função para obter o título da seção
    const getSectionTitle = (date: Date): string => {
      if (isToday(date)) return 'Hoje';
      if (isTomorrow(date)) return 'Amanhã';
      return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
    };
    
    // Agrupar eventos por data
    filteredEvents.forEach(event => {
      if (!event.startDate) return;
      
      try {
        const eventDate = parseISO(event.startDate);
        const dateStr = format(eventDate, 'yyyy-MM-dd');
        
        // Verificar se já existe um grupo para esta data
        const existingGroup = groups.find(group => {
          const firstEvent = group.data[0];
          if (!firstEvent.startDate) return false;
          
          const firstEventDate = parseISO(firstEvent.startDate);
          return format(firstEventDate, 'yyyy-MM-dd') === dateStr;
        });
        
        if (existingGroup) {
          existingGroup.data.push(event);
        } else {
          groups.push({
            title: getSectionTitle(eventDate),
            data: [event]
          });
        }
      } catch (error) {
        console.error('Error processing event date for grouping:', error);
      }
    });
    
    return groups;
  }, [filteredEvents]);
  
  // Formatar hora do evento - otimizada
  const formatEventTime = useCallback((dateString?: string): string => {
    if (!dateString) return '';
    
    try {
      const date = parseISO(dateString);
      return format(date, "HH:mm", { locale: ptBR });
    } catch (error) {
      return '';
    }
  }, []);
  
  // Função para determinar a cor do evento com tratamento seguro
  const getEventColor = useCallback((event: Event): string => {
    if (!event) return '#7B68EE';
    
    // Verificar se é um evento atrasado ou cancelado
    if (event.isFinished) return '#9E9E9E';
    
    // Verificar se está acontecendo agora
    if (event.isHappening) return '#4CAF50';
    
    // Verificar status do convite para o usuário atual
    if (user && event.invitations && Array.isArray(event.invitations)) {
      const userInvitation = event.invitations.find(inv => inv.userId === user.uid);
      
      if (userInvitation) {
        switch (userInvitation.status) {
          case 'CONFIRMED': return '#7B68EE';
          case 'INVITED': return '#FFC107';
          case 'DECLINED': return '#FF6347';
          default: return '#7B68EE';
        }
      }
    }
    
    return '#7B68EE';
  }, [user]);
  
  // Renderizar item de evento com tratamento seguro - otimizado
  const renderEventItem = useCallback(({ item }: { item: Event }): React.ReactElement => {
    // Calcular contagem de confirmados com segurança
    let confirmedCount = 0;
    if (item.invitations && Array.isArray(item.invitations)) {
      confirmedCount = item.invitations.filter(inv => inv.status === 'CONFIRMED').length;
    }
    
    // Verificar status do usuário atual
    const userStatus = user && item.invitations ? 
      item.invitations.find(inv => inv.userId === user.uid)?.status : null;
    
    return (
      <TouchableOpacity
        style={[
          styles.eventItem,
          { borderLeftColor: getEventColor(item) }
        ]}
        onPress={() => {
          router.push(`/(panel)/events/${item.id}`);
        }}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Evento: ${item.title}`}
        accessibilityHint="Toque para ver detalhes do evento"
      >
        <View style={styles.eventTimeContainer}>
          <Text style={styles.eventTime}>
            {formatEventTime(item.startDate)}
          </Text>
          {item.isHappening && (
            <View style={styles.happeningNowBadge}>
              <Text style={styles.happeningNowText}>Agora</Text>
            </View>
          )}
        </View>
        
        <View style={styles.eventContent}>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {item.title || 'Evento sem título'}
          </Text>
          
          {item.location && (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={14} color="#aaa" />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
          )}
          
          <View style={styles.eventMeta}>
            <View style={styles.attendeesInfo}>
              <Ionicons name="people-outline" size={14} color="#7B68EE" />
              <Text style={styles.attendeesText}>
                {confirmedCount} {confirmedCount === 1 ? 'confirmado' : 'confirmados'}
              </Text>
            </View>
            
            {userStatus && (
              <View style={[
                styles.statusBadge,
                userStatus === 'CONFIRMED' ? styles.confirmedBadge :
                userStatus === 'INVITED' ? styles.invitedBadge :
                styles.declinedBadge
              ]}>
                <Text style={[
                  styles.statusBadgeText,
                  userStatus === 'CONFIRMED' ? styles.confirmedBadgeText :
                  userStatus === 'INVITED' ? styles.invitedBadgeText :
                  styles.declinedBadgeText
                ]}>
                  {userStatus === 'CONFIRMED' ? 'Confirmado' :
                   userStatus === 'INVITED' ? 'Convidado' : 'Recusado'}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color="#7B68EE" />
      </TouchableOpacity>
    );
  }, [formatEventTime, getEventColor, router, user]);
  
  // Renderizar cabeçalho de seção - otimizado
  const renderSectionHeader = useCallback(({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  ), []);
  
  // Renderizar separador entre seções - otimizado
  const renderSectionSeparator = useCallback(() => (
    <View style={styles.sectionSeparator} />
  ), []);
  
  // Renderizar estado vazio - otimizado
  const renderEmptyState = useCallback(() => {
    if (loading && !refreshing && !initialLoadDone) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#7B68EE" />
          <Text style={styles.emptyText}>Carregando eventos...</Text>
        </View>
      );
    }
    
    let message = 'Nenhum evento encontrado';
    let subMessage = 'Crie um novo evento para começar';
    let icon = 'calendar-blank';
    
    switch (filter) {
      case 'upcoming':
        message = 'Nenhum evento futuro';
        subMessage = 'Crie um novo evento para começar';
        break;
      case 'past':
        message = 'Nenhum evento passado';
        subMessage = 'Os eventos passados aparecerão aqui';
        icon = 'clock-outline';
        break;
      case 'mine':
        message = 'Você não tem eventos';
        subMessage = 'Crie um evento ou confirme presença em um';
        icon = 'account';
        break;
    }
    
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name={icon} size={64} color="#7B68EE" />
        <Text style={styles.emptyTitle}>{message}</Text>
        <Text style={styles.emptyText}>{subMessage}</Text>
        
        <TouchableOpacity 
          style={styles.createEventButton}
          onPress={() => router.push('/(panel)/events/create')}
        >
          <Text style={styles.createEventButtonText}>
            Criar Evento
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [loading, refreshing, filter, router, initialLoadDone]);
  
  // Renderizar cabeçalho da lista - otimizado
  const renderListHeader = useCallback(() => (
    <Animated.View style={[styles.filtersContainer, { opacity: headerOpacity }]}>
      <Text style={styles.filtersTitle}>Filtrar por:</Text>
      <View style={styles.filterButtons}>
        <TouchableOpacity 
          style={[
            styles.filterButton,
            filter === 'upcoming' && styles.filterButtonActive
          ]}
          onPress={() => setFilter('upcoming')}
          accessibilityRole="button"
          accessibilityLabel="Filtrar por eventos futuros"
          accessibilityState={{ selected: filter === 'upcoming' }}
        >
          <MaterialCommunityIcons 
            name="calendar"
            size={16} 
            color={filter === 'upcoming' ? '#7B68EE' : '#aaa'} 
            style={styles.filterIcon}
          />
          <Text style={[
            styles.filterButtonText,
            filter === 'upcoming' && styles.filterButtonTextActive
          ]}>
            Próximos
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterButton,
            filter === 'past' && styles.filterButtonActive
          ]}
          onPress={() => setFilter('past')}
          accessibilityRole="button"
          accessibilityLabel="Filtrar por eventos passados"
          accessibilityState={{ selected: filter === 'past' }}
        >
          <MaterialCommunityIcons 
            name="clock-outline"
            size={16} 
            color={filter === 'past' ? '#7B68EE' : '#aaa'} 
            style={styles.filterIcon}
          />
          <Text style={[
            styles.filterButtonText,
            filter === 'past' && styles.filterButtonTextActive
          ]}>
            Passados
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterButton,
            filter === 'mine' && styles.filterButtonActive
          ]}
          onPress={() => setFilter('mine')}
          accessibilityRole="button"
          accessibilityLabel="Filtrar por meus eventos"
          accessibilityState={{ selected: filter === 'mine' }}
        >
          <MaterialCommunityIcons 
            name="account"
            size={16} 
            color={filter === 'mine' ? '#7B68EE' : '#aaa'} 
            style={styles.filterIcon}
          />
          <Text style={[
            styles.filterButtonText,
            filter === 'mine' && styles.filterButtonTextActive
          ]}>
            Meus
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterButton,
            filter === 'all' && styles.filterButtonActive
          ]}
          onPress={() => setFilter('all')}
          accessibilityRole="button"
          accessibilityLabel="Mostrar todos os eventos"
          accessibilityState={{ selected: filter === 'all' }}
        >
          <MaterialCommunityIcons 
            name="view-grid"
            size={16} 
            color={filter === 'all' ? '#7B68EE' : '#aaa'} 
            style={styles.filterIcon}
          />
          <Text style={[
            styles.filterButtonText,
            filter === 'all' && styles.filterButtonTextActive
          ]}>
            Todos
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  ), [filter, headerOpacity]);
  
  // Renderizar lista de eventos agrupados - otimizado
  const renderEventsList = useCallback(() => {
    if (groupedEvents.length === 0) {
      return renderEmptyState();
    }
    
    return (
      <Animated.SectionList
        sections={groupedEvents}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => renderEventItem({ item })}
        renderSectionHeader={({ section }) => renderSectionHeader({ section })}
        SectionSeparatorComponent={renderSectionSeparator}
        stickySectionHeadersEnabled={true}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshEventsList}
            colors={['#7B68EE']}
            tintColor={'#7B68EE'}
            progressBackgroundColor="#333"
          />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={<View style={{ height: 80 }} />}
      />
    );
  }, [groupedEvents, renderEmptyState, renderEventItem, renderSectionHeader, 
       renderSectionSeparator, refreshing, refreshEventsList, renderListHeader, scrollY]);
  
  return (
    <View style={styles.container}>
      {/* Exibir mensagem de erro se houver */}
      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={refreshEventsList}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {renderEventsList()}
      
      {/* Botão flutuante de adicionar */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => router.push('/(panel)/events/create')}
        accessibilityLabel="Criar evento"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  filtersContainer: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 12,
    margin: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  filtersTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#444',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(123, 104, 238, 0.2)',
  },
  filterIcon: {
    marginRight: 4,
  },
  filterButtonText: {
    color: '#aaa',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: '#7B68EE',
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 80, // Espaço para o botão flutuante
  },
  sectionHeader: {
    backgroundColor: '#222',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionHeaderText: {
    color: '#7B68EE',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  sectionSeparator: {
    height: 16,
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  eventTimeContainer: {
    marginRight: 16,
    alignItems: 'center',
  },
  eventTime: {
    color: '#7B68EE',
    fontSize: 16,
    fontWeight: 'bold',
  },
  happeningNowBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  happeningNowText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: 'bold',
  },
  eventContent: {
    flex: 1,
    marginRight: 10,
  },
  eventTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    color: '#aaa',
    fontSize: 14,
    marginLeft: 4,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attendeesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeesText: {
    color: '#aaa',
    fontSize: 12,
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  confirmedBadge: {
    backgroundColor: 'rgba(123, 104, 238, 0.2)',
  },
  invitedBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
  },
  declinedBadge: {
    backgroundColor: 'rgba(255, 99, 71, 0.2)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  confirmedBadgeText: {
    color: '#7B68EE',
  },
  invitedBadgeText: {
    color: '#FFC107',
  },
  declinedBadgeText: {
    color: '#FF6347',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  createEventButton: {
    backgroundColor: '#7B68EE',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#7B68EE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  createEventButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 99, 71, 0.1)',
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 99, 71, 0.3)',
  },
  errorText: {
    color: '#FF6347',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 99, 71, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#FF6347',
    fontWeight: 'bold',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7B68EE',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#7B68EE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});

export default EventsListScreen;