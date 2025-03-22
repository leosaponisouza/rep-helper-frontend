// app/(panel)/events/calendar.tsx - Versão otimizada com melhor UX e performance
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
  ListRenderItemInfo,
  RefreshControl,
  Alert,
  Animated,
  Platform,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEvents, Event } from '../../../src/hooks/useEvents';
import { useAuth } from '../../../src/context/AuthContext';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { format, parseISO, isToday, isTomorrow, isPast, addMonths, isSameDay, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFocusEffect } from '@react-navigation/native';

// Configuração de localização para o calendário
LocaleConfig.locales['pt-br'] = {
  monthNames: [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ],
  monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

const windowWidth: number = Dimensions.get('window').width;
const windowHeight: number = Dimensions.get('window').height;

interface EventDot {
  color: string;
  key: string;
}

interface MarkedDate {
  marked?: boolean;
  dotColor?: string;
  dots?: EventDot[];
  selected?: boolean;
  selectedColor?: string;
  today?: boolean;
}

// Componente otimizado para o calendário
const CalendarScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { events, loading, refreshEvents } = useEvents();
  
  // Estados principais
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Inicializar com a data atual formatada como YYYY-MM-DD
    return new Date().toISOString().split('T')[0];
  });
  const [markedDates, setMarkedDates] = useState<Record<string, MarkedDate>>({});
  const [selectedDateEvents, setSelectedDateEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Animações
  const scrollY = new Animated.Value(0);
  
  // Configurações de tema para o calendário - melhorado para acessibilidade
  const calendarTheme = {
    backgroundColor: '#333',
    calendarBackground: '#333',
    textSectionTitleColor: '#7B68EE',
    selectedDayBackgroundColor: '#7B68EE',
    selectedDayTextColor: '#ffffff',
    todayTextColor: '#7B68EE',
    todayBackgroundColor: 'rgba(123, 104, 238, 0.1)',
    dayTextColor: '#ffffff',
    textDisabledColor: '#666',
    dotColor: '#7B68EE',
    selectedDotColor: '#ffffff',
    arrowColor: '#7B68EE',
    disabledArrowColor: '#666',
    monthTextColor: '#ffffff',
    indicatorColor: '#7B68EE',
    textDayFontWeight: '400',
    textMonthFontWeight: 'bold',
    textDayHeaderFontWeight: '500',
    textDayFontSize: 16,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 14
  };

  // Recarregar eventos quando a tela receber foco
  useFocusEffect(
    useCallback(() => {
      refreshCalendarEvents();
      
      // Selecionar a data atual se não houver data selecionada
      if (!selectedDate) {
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
        updateSelectedDateEvents(today);
      }
    }, [])
  );

  // Processar eventos para marcação no calendário - otimizado com useMemo
  useEffect(() => {
    if (!events || events.length === 0) {
      // Se não houver eventos, apenas marcar a data selecionada
      if (selectedDate) {
        setMarkedDates({
          [selectedDate]: {
            selected: true,
            selectedColor: '#7B68EE'
          }
        });
      }
      return;
    }
    
    // Processar eventos para marcação no calendário
    const dates: Record<string, MarkedDate> = {};
    const today = new Date().toISOString().split('T')[0];
    
    // Marcar o dia atual
    dates[today] = {
      today: true
    };
    
    // Processar eventos
    events.forEach(event => {
      if (!event.startDate) return;
      
      try {
        const dateStr = event.startDate.split('T')[0];
        
        if (!dates[dateStr]) {
          dates[dateStr] = {
            marked: true,
            dots: []
          };
        } else if (!dates[dateStr].dots) {
          dates[dateStr].dots = [];
          dates[dateStr].marked = true;
        }
        
        // Adicionar dot para o evento (limitado a 3 por data)
        if (dates[dateStr].dots && dates[dateStr].dots.length < 3) {
          dates[dateStr].dots.push({
            color: getEventColor(event),
            key: String(event.id)
          });
        }
      } catch (error) {
        console.error('Error processing event date:', error);
      }
    });
    
    // Marcar a data selecionada
    if (selectedDate) {
      dates[selectedDate] = {
        ...dates[selectedDate],
        selected: true,
        selectedColor: '#7B68EE'
      };
    }
    
    setMarkedDates(dates);
  }, [events, selectedDate]);

  // Função para recarregar os eventos do calendário - otimizada
  const refreshCalendarEvents = useCallback(async () => {
    try {
      setRefreshing(true);
      setErrorMessage(null);
      await refreshEvents('all');
      
      // Se já tiver uma data selecionada, atualizar os eventos dessa data
      if (selectedDate) {
        updateSelectedDateEvents(selectedDate);
      }
    } catch (error) {
      console.error('Error refreshing calendar events:', error);
      setErrorMessage('Não foi possível carregar os eventos. Tente novamente.');
    } finally {
      setRefreshing(false);
    }
  }, [refreshEvents, selectedDate]);

  // Atualizar a lista de eventos para a data selecionada - otimizada com useMemo
  const updateSelectedDateEvents = useCallback((dateStr: string) => {
    if (!events || events.length === 0) {
      setSelectedDateEvents([]);
      return;
    }
    
    // Filtrar eventos para a data selecionada e ordenar por hora
    const filtered = events
      .filter(event => event.startDate && event.startDate.startsWith(dateStr))
      .sort((a, b) => {
        if (!a.startDate || !b.startDate) return 0;
        return a.startDate.localeCompare(b.startDate);
      });
    
    setSelectedDateEvents(filtered);
  }, [events]);

  // Selecionar data e buscar eventos - otimizada
  const handleDayPress = useCallback((day: DateData) => {
    const dateStr = day.dateString;
    
    // Se já estiver selecionada, não faz nada
    if (dateStr === selectedDate) return;
    
    setSelectedDate(dateStr);
    updateSelectedDateEvents(dateStr);
  }, [selectedDate, updateSelectedDateEvents]);

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

  // Formatar data para exibição amigável - otimizada
  const getFormattedDate = useCallback((dateString?: string): string => {
    if (!dateString) return '';
    
    try {
      const date = parseISO(dateString);
      
      if (isToday(date)) {
        return "Hoje";
      } else if (isTomorrow(date)) {
        return "Amanhã";
      } else {
        return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
      }
    } catch (error) {
      return dateString;
    }
  }, []);

  // Navegar para o mês atual
  const goToToday = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    setCurrentMonth(new Date());
    updateSelectedDateEvents(today);
  }, [updateSelectedDateEvents]);

  // Manipular mudança de mês
  const handleMonthChange = useCallback((month: DateData) => {
    setCurrentMonth(new Date(month.timestamp));
  }, []);

  // Renderizar item de evento com tratamento seguro - otimizado
  const renderEventItem = useCallback(({ item }: ListRenderItemInfo<Event>): React.ReactElement => {
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

  // Verificar se o mês atual é o mês atual do calendário
  const isCurrentMonthToday = useMemo(() => {
    const today = new Date();
    return isSameMonth(currentMonth, today);
  }, [currentMonth]);

  // Se estiver carregando e não temos eventos, mostrar um loader
  if (loading && (!events || events.length === 0) && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B68EE" />
        <Text style={styles.loadingText}>Carregando eventos...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refreshCalendarEvents}
          colors={['#7B68EE']}
          tintColor={'#7B68EE'}
          progressBackgroundColor="#333"
        />
      }
    >
      <View style={styles.calendarContainer}>
        {/* Cabeçalho do calendário com botões de navegação */}
        <View style={styles.calendarHeader}>
          <Text style={styles.calendarMonthTitle}>
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </Text>
          
          <View style={styles.calendarActions}>
            {!isCurrentMonthToday && (
              <TouchableOpacity 
                style={styles.todayButton}
                onPress={goToToday}
                accessibilityLabel="Ir para hoje"
                accessibilityHint="Navega para o dia atual no calendário"
              >
                <Text style={styles.todayButtonText}>Hoje</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Calendário */}
        <Calendar
          theme={calendarTheme}
          onDayPress={handleDayPress}
          markedDates={markedDates}
          markingType={'multi-dot'}
          enableSwipeMonths={true}
          monthFormat={'MMMM yyyy'}
          hideExtraDays={false}
          firstDay={0}
          style={styles.calendar}
          onMonthChange={handleMonthChange}
          disableAllTouchEventsForDisabledDays={true}
          disableAllTouchEventsForInactiveDays={true}
          renderArrow={(direction: string) => (
            <Ionicons 
              name={direction === 'left' ? 'chevron-back' : 'chevron-forward'} 
              size={20} 
              color="#7B68EE" 
            />
          )}
        />
      </View>
      
      {/* Exibir mensagem de erro se houver */}
      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={refreshCalendarEvents}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Lista de eventos para o dia selecionado */}
      <View style={styles.eventsContainer}>
        <View style={styles.selectedDateHeader}>
          <View style={styles.selectedDateInfo}>
            <Text style={styles.selectedDateText}>
              {getFormattedDate(selectedDate)}
            </Text>
            <Text style={styles.eventsCountText}>
              {selectedDateEvents.length} {selectedDateEvents.length === 1 ? 'evento' : 'eventos'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.addEventButton}
            onPress={() => router.push({
              pathname: '/(panel)/events/create',
              params: { date: selectedDate }
            })}
            accessibilityLabel="Adicionar evento"
            accessibilityHint="Cria um novo evento para esta data"
          >
            <Ionicons name="add-circle" size={24} color="#7B68EE" />
          </TouchableOpacity>
        </View>
        
        {selectedDateEvents.length > 0 ? (
          <View style={styles.eventsList}>
            {selectedDateEvents.map((item) => renderEventItem({ item } as ListRenderItemInfo<Event>))}
          </View>
        ) : (
          <View style={styles.noEventsContainer}>
            <MaterialCommunityIcons name="calendar-blank" size={48} color="#7B68EE" />
            <Text style={styles.noEventsText}>
              Nenhum evento nesta data
            </Text>
            <TouchableOpacity 
              style={styles.createEventButtonLarge}
              onPress={() => router.push({
                pathname: '/(panel)/events/create',
                params: { date: selectedDate }
              })}
            >
              <Text style={styles.createEventButtonText}>
                Criar Evento
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Botão flutuante de adicionar */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => router.push({
          pathname: '/(panel)/events/create',
          params: { date: selectedDate }
        })}
        accessibilityLabel="Criar evento"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  calendarContainer: {
    backgroundColor: '#333',
    borderRadius: 12,
    margin: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  calendarMonthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'capitalize',
  },
  calendarActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayButton: {
    backgroundColor: 'rgba(123, 104, 238, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  todayButtonText: {
    color: '#7B68EE',
    fontWeight: 'bold',
    fontSize: 14,
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
  calendar: {
    borderRadius: 0,
  },
  eventsContainer: {
    flex: 1,
    backgroundColor: '#222',
    borderTopWidth: 1,
    borderTopColor: '#444',
    marginTop: 10,
    paddingBottom: 80, // Espaço para o botão flutuante
  },
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  selectedDateInfo: {
    flex: 1,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'capitalize',
  },
  eventsCountText: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 4,
  },
  addEventButton: {
    padding: 8,
  },
  eventsList: {
    paddingHorizontal: 16,
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 12,
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
  noEventsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noEventsText: {
    color: '#fff',
    fontSize: 16,
    marginVertical: 16,
  },
  createEventButtonLarge: {
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

export default CalendarScreen;