// app/(panel)/events/index.tsx - Updated to match the screenshot design
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StatusBar,
  SafeAreaView,
  Platform,
  Animated,
  ListRenderItemInfo
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEvents, Event } from '../../../src/hooks/useEvents';
import { useAuth } from '../../../src/context/AuthContext';
import { format, parseISO, isToday, isTomorrow, isPast, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFocusEffect } from '@react-navigation/native';

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
  
  // Get today's date as string format
  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  
  // Load events when screen gets focus
  useFocusEffect(
    useCallback(() => {
      refreshCalendarEvents();
    }, [])
  );
  
  // Refresh events data
  const refreshCalendarEvents = useCallback(async () => {
    try {
      setRefreshing(true);
      await refreshEvents('all');
      updateSelectedDayEvents(selectedDate);
    } catch (error) {
      console.error('Error refreshing calendar events:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshEvents, selectedDate]);
  
  // Update today's events when events data changes
  useEffect(() => {
    updateSelectedDayEvents(selectedDate);
  }, [events, selectedDate]);
  
  // Filter events for selected day
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
    
    // Update title based on selected date
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
  
  // Navigate to previous month
  const goToPrevMonth = (): void => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
  };
  
  // Navigate to next month
  const goToNextMonth = (): void => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };
  
  // Get days for current month view
  const getDaysInMonth = useCallback((): Date[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get first day of month
    const firstDay = new Date(year, month, 1);
    const firstDayIndex = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Get last day of month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get days from previous month to fill the calendar
    const prevMonthDays: Date[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      const day = new Date(year, month, -i);
      prevMonthDays.unshift(day);
    }
    
    // Get days for current month
    const currentMonthDays: Date[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(year, month, i);
      currentMonthDays.push(day);
    }
    
    // Get days from next month to complete the grid (if needed)
    const totalDaysSoFar = prevMonthDays.length + currentMonthDays.length;
    const daysNeeded = Math.ceil(totalDaysSoFar / 7) * 7 - totalDaysSoFar;
    
    const nextMonthDays: Date[] = [];
    for (let i = 1; i <= daysNeeded; i++) {
      const day = new Date(year, month + 1, i);
      nextMonthDays.push(day);
    }
    
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  }, [currentMonth]);
  
  // Format event time for display
  const formatEventTime = useCallback((dateString?: string): string => {
    if (!dateString) return '';
    
    try {
      const date = parseISO(dateString);
      return format(date, "HH:mm", { locale: ptBR });
    } catch (error) {
      return '';
    }
  }, []);
  
  // Check if a day has events
  const dayHasEvents = useCallback((date: Date): boolean => {
    if (!events || events.length === 0) return false;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.some(event => event.startDate && event.startDate.startsWith(dateStr));
  }, [events]);
  
  // Get event status color
  const getEventColor = useCallback((event: Event): string => {
    if (!event) return '#7B68EE';
    
    // Check if event is finished
    if (event.isFinished) return '#9E9E9E';
    
    // Check if event is happening now
    if (event.isHappening) return '#4CAF50';
    
    // Check invite status for current user
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
  
  // Render calendar day
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
  
  // Render event item
  const renderEventItem = ({ item }: ListRenderItemInfo<Event>): JSX.Element => {
    // Calculate confirmed count
    let confirmedCount = 0;
    if (item.invitations && Array.isArray(item.invitations)) {
      confirmedCount = item.invitations.filter(inv => inv.status === 'CONFIRMED').length;
    }
    
    // Get status badge
    let statusBadge = null;
    if (item.isHappening) {
      statusBadge = <View style={styles.inProgressBadge}><Text style={styles.badgeText}>Em Progresso</Text></View>;
    } else if (item.startDate) {
      const now = new Date();
      const eventDate = parseISO(item.startDate);
      if (isAfter(eventDate, now)) {
        statusBadge = <View style={styles.pendingBadge}><Text style={styles.badgeText}>Pendente</Text></View>;
      }
    }
    
    // Get status for confirmed events
    const isConfirmed = user && item.invitations && 
      item.invitations.some(inv => inv.userId === user.uid && inv.status === 'CONFIRMED');
    
    if (isConfirmed) {
      statusBadge = <View style={styles.confirmedBadge}><Text style={styles.badgeText}>Confirmado</Text></View>;
    }
    
    return (
      <TouchableOpacity
        style={styles.eventItem}
        onPress={() => router.push(`/(panel)/events/${item.id}`)}
      >
        <View style={styles.eventInfo}>
          <Text style={styles.eventTime}>{formatEventTime(item.startDate)} - {formatEventTime(item.endDate)}</Text>
          <Text style={styles.eventTitle}>{item.title || 'Evento sem título'}</Text>
          
          {item.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#aaa" />
              <Text style={styles.locationText}>{item.location}</Text>
            </View>
          )}
          
          <View style={styles.attendeesRow}>
            <Ionicons name="people-outline" size={14} color="#aaa" />
            <Text style={styles.attendeesText}>{confirmedCount} {confirmedCount === 1 ? 'participante' : 'participantes'}</Text>
          </View>
        </View>
        
        {statusBadge}
      </TouchableOpacity>
    );
  };
  
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B68EE" />
        <Text style={styles.loadingText}>Carregando eventos...</Text>
      </View>
    );
  }
  
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
      
      {/* Calendar Days of Week */}
      <View style={styles.daysOfWeek}>
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
          <Text key={index} style={styles.dayOfWeekText}>{day}</Text>
        ))}
      </View>
      
      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {getDaysInMonth().map((day, index) => renderDay(day, index))}
      </View>
      
      {/* Selected Day Events Header */}
      <View style={styles.todayEventsHeader}>
        <Text style={styles.todayEventsTitle}>{selectedDayTitle}</Text>
      </View>
      
      {/* Selected Day Events List */}
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
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTime: {
    color: '#7B68EE',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    color: '#aaa',
    fontSize: 14,
    marginLeft: 4,
  },
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeesText: {
    color: '#aaa',
    fontSize: 14,
    marginLeft: 4,
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
  },
  pendingBadge: {
    backgroundColor: '#FF6347',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  confirmedBadge: {
    backgroundColor: '#4CAF50',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  inProgressBadge: {
    backgroundColor: '#7B68EE',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default EventsScreen;