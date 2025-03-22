// app/(panel)/events/index.tsx - Updated with components
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  SafeAreaView,
  Animated,
  ListRenderItemInfo
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEvents, Event } from '@/src/hooks/useEvents';
import { useAuth } from '@/src/context/AuthContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFocusEffect } from '@react-navigation/native';

// Importar componentes
import EventItem from '@/components/Event/EventItem';
import EventItemSkeleton from '@/components/Event/EventItemSkeleton';
import CalendarSkeleton from '@/components/Event/CalendarSkeleton';

// Main calendar component
const EventsScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { events, loading, refreshEvents } = useEvents();
  
  // States
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [todaysEvents, setTodaysEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedDayTitle, setSelectedDayTitle] = useState<string>('Eventos de Hoje');
  const [calendarLoading, setCalendarLoading] = useState<boolean>(true);
  const [eventsLoading, setEventsLoading] = useState<boolean>(true);
  
  // Animação para transição suave do skeleton para conteúdo real
  const fadeAnim = useState(new Animated.Value(0))[0];
  const calendarFadeAnim = useState(new Animated.Value(0))[0];

  // Efeito para animar a entrada dos eventos
  useEffect(() => {
    if (!eventsLoading && !refreshing) {
      // Quando o carregamento termina, animamos a entrada do conteúdo
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset da animação quando começa a carregar
      fadeAnim.setValue(0);
    }
  }, [eventsLoading, refreshing]);

  // Efeito para animar a entrada do calendário
  useEffect(() => {
    if (!calendarLoading) {
      // Animar a entrada do calendário quando terminar de carregar
      Animated.timing(calendarFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset da animação quando começa a carregar
      calendarFadeAnim.setValue(0);
    }
  }, [calendarLoading]);
  
  // Carregar eventos quando a tela recebe foco
  useFocusEffect(
    useCallback(() => {
      refreshCalendarEvents();
    }, [])
  );
  
  // Data de hoje como string formatada
  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  
  // Atualizar eventos do calendário
  const refreshCalendarEvents = useCallback(async () => {
    try {
      setRefreshing(true);
      setCalendarLoading(true);
      setEventsLoading(true);
      
      await refreshEvents('all');
      updateSelectedDayEvents(selectedDate);
      
      // Simular um pequeno delay para o skeleton
      setTimeout(() => {
        setCalendarLoading(false);
      }, 500);
      
      // Delay ligeiramente maior para os eventos
      setTimeout(() => {
        setEventsLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error refreshing calendar events:', error);
      setCalendarLoading(false);
      setEventsLoading(false);
    } finally {
      setRefreshing(false);
    }
  }, [refreshEvents, selectedDate]);
  
  // Atualizar eventos do dia selecionado quando os dados mudam
  useEffect(() => {
    updateSelectedDayEvents(selectedDate);
  }, [events, selectedDate]);
  
  // Filtrar eventos para o dia selecionado
  const updateSelectedDayEvents = useCallback((date: Date) => {
    if (!events || events.length === 0) {
      setTodaysEvents([]);
      return;
    }
    
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const filtered = events
      .filter(event => {
        if (!event.startDate) return false;
        return event.startDate.startsWith(dateStr);
      })
      .sort((a, b) => {
        if (!a.startDate || !b.startDate) return 0;
        return a.startDate.localeCompare(b.startDate);
      });
    
    setTodaysEvents(filtered);
    
    // Atualizar título baseado na data selecionada
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const tomorrowStr = format(new Date(new Date().setDate(new Date().getDate() + 1)), 'yyyy-MM-dd');
    
    if (dateStr === todayStr) {
      setSelectedDayTitle('Eventos de Hoje');
    } else if (dateStr === tomorrowStr) {
      setSelectedDayTitle('Eventos de Amanhã');
    } else {
      setSelectedDayTitle(`Eventos de ${format(date, 'dd/MM/yyyy')}`);
    }
  }, [events]);
  
  // Ir para o mês anterior
  const goToPrevMonth = (): void => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
  };
  
  // Ir para o próximo mês
  const goToNextMonth = (): void => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };
  
  // Obter dias para a visualização do mês atual
  const getDaysInMonth = useCallback((): Date[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1);
    const firstDayIndex = firstDay.getDay(); // 0 = Domingo, 1 = Segunda, etc.
    
    // Último dia do mês
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Obter dias do mês anterior para preencher o calendário
    const prevMonthDays: Date[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      const day = new Date(year, month, -i);
      prevMonthDays.unshift(day);
    }
    
    // Obter dias para o mês atual
    const currentMonthDays: Date[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(year, month, i);
      currentMonthDays.push(day);
    }
    
    // Obter dias do próximo mês para completar a grade (se necessário)
    const totalDaysSoFar = prevMonthDays.length + currentMonthDays.length;
    const daysNeeded = Math.ceil(totalDaysSoFar / 7) * 7 - totalDaysSoFar;
    
    const nextMonthDays: Date[] = [];
    for (let i = 1; i <= daysNeeded; i++) {
      const day = new Date(year, month + 1, i);
      nextMonthDays.push(day);
    }
    
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  }, [currentMonth]);
  
  // Verificar se um dia tem eventos
  const dayHasEvents = useCallback((date: Date): boolean => {
    if (!events || events.length === 0) return false;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.some(event => event.startDate && event.startDate.startsWith(dateStr));
  }, [events]);
  
  // Navegar para a tela de detalhes do evento
  const handleEventPress = useCallback((eventId: number) => {
    router.push(`/(panel)/events/${eventId}`);
  }, [router]);
  
  // Renderizar dia do calendário
  const renderDay = (day: Date, index: number): JSX.Element => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
    const isSelectedDate = dateStr === format(selectedDate, 'yyyy-MM-dd');
    const isToday = dateStr === todayStr;
    const hasEvents = dayHasEvents(day);
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.calendarDay,
          !isCurrentMonth && styles.calendarDayOtherMonth,
          isToday && styles.calendarDayToday,
          isSelectedDate && styles.calendarDaySelected
        ]}
        onPress={() => setSelectedDate(day)}
      >
        <Text style={[
          styles.calendarDayText,
          !isCurrentMonth && styles.calendarDayTextOtherMonth,
          isToday && styles.calendarDayTextToday,
          isSelectedDate && styles.calendarDayTextSelected
        ]}>
          {day.getDate()}
        </Text>
        {hasEvents && <View style={styles.eventDot} />}
      </TouchableOpacity>
    );
  };
  
  // Renderizar item da lista de eventos
  const renderEventItem = ({ item }: ListRenderItemInfo<Event>) => (
    <EventItem
      item={item}
      onPress={handleEventPress}
      currentUserId={user?.uid}
    />
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      {/* Header no estilo do TasksListScreen */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Eventos</Text>
      </View>
      
      {/* Calendar Header */}
      <View style={styles.calendarHeader}>
        <Text style={styles.calendarTitle}>{format(currentMonth, "MMMM yyyy", { locale: ptBR })}</Text>
        <View style={styles.calendarNav}>
          <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Calendar Grid com Skeleton */}
      {calendarLoading ? (
        <CalendarSkeleton />
      ) : (
        <Animated.View style={{ opacity: calendarFadeAnim }}>
          <View style={styles.daysOfWeek}>
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
              <Text key={index} style={styles.dayOfWeekText}>{day}</Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {getDaysInMonth().map((day, index) => renderDay(day, index))}
          </View>
        </Animated.View>
      )}
      
      {/* Selected Day Events Header */}
      <View style={styles.todayEventsHeader}>
        <Text style={styles.todayEventsTitle}>{selectedDayTitle}</Text>
      </View>
      
      {/* Selected Day Events List */}
      {eventsLoading && !refreshing ? (
        <EventItemSkeleton count={3} />
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            data={todaysEvents}
            renderItem={renderEventItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.eventsList}
            ListEmptyComponent={() => (
              <View style={styles.emptyEventsContainer}>
                <Text style={styles.emptyEventsText}>Nenhum evento agendado para esta data</Text>
              </View>
            )}
          />
        </Animated.View>
      )}
      
      {/* Botão flutuante de adicionar */}
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
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  // Header no estilo das Tarefas
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'capitalize',
  },
  calendarNav: {
    flexDirection: 'row',
  },
  navButton: {
    padding: 8,
  },
  daysOfWeek: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  dayOfWeekText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '500',
    width: 32,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  calendarDay: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 20,
  },
  calendarDayOtherMonth: {
    opacity: 0.4,
  },
  calendarDayToday: {
    backgroundColor: 'rgba(123, 104, 238, 0.3)',
  },
  calendarDaySelected: {
    backgroundColor: '#7B68EE',
  },
  calendarDayText: {
    color: '#fff',
    fontSize: 16,
  },
  calendarDayTextOtherMonth: {
    color: '#999',
  },
  calendarDayTextToday: {
    fontWeight: 'bold',
    color: '#fff',
  },
  calendarDayTextSelected: {
    fontWeight: 'bold',
    color: '#fff',
  },
  eventDot: {
    position: 'absolute',
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#7B68EE',
  },
  todayEventsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginTop: 8,
  },
  todayEventsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  eventsList: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  emptyEventsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyEventsText: {
    color: '#aaa',
    fontSize: 16,
  },
  // Botão flutuante de adicionar no estilo das Tarefas
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
    zIndex: 100, // Garantir que esteja acima de outros elementos
  },
});

export default EventsScreen;