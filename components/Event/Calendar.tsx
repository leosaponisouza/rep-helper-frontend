import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import EventItem from './EventItem';

// Obter dimensões da tela
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
// Altura calculada para o container
const containerHeight = screenHeight - 120;

interface CalendarProps {
  events: any[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onEventPress: (event: any) => void;
  currentUserId: string;
  loading?: boolean;
}

interface EventsByDate {
  [date: string]: any[];
}

const Calendar: React.FC<CalendarProps> = ({
  events,
  selectedDate,
  onDateSelect,
  onEventPress,
  currentUserId,
  loading = false,
}) => {
  const [selectedDay, setSelectedDay] = useState(selectedDate || format(new Date(), 'yyyy-MM-dd'));
  const [currentMonth, setCurrentMonth] = useState('');
  const [eventsByDate, setEventsByDate] = useState<EventsByDate>({});
  const [dayEvents, setDayEvents] = useState<any[]>([]);
  const slideAnim = useRef(new Animated.Value(20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Organiza os eventos por data
  useEffect(() => {
    const grouped: EventsByDate = {};
    
    if (Array.isArray(events)) {
      events.forEach(event => {
        if (event && typeof event === 'object') {
          // Verificar se o evento tem uma propriedade date ou startDate
          const eventDate = event.date || event.startDate;
          
          if (eventDate && typeof eventDate === 'string') {
            const dateStr = eventDate.split('T')[0];
            if (!grouped[dateStr]) {
              grouped[dateStr] = [];
            }
            grouped[dateStr].push(event);
          }
        }
      });
    }
    
    setEventsByDate(grouped);
  }, [events]);

  // Atualiza os eventos do dia quando a data selecionada muda
  useEffect(() => {
    if (selectedDay && typeof selectedDay === 'string') {
      const dateStr = selectedDay.split('T')[0];
      setDayEvents(eventsByDate[dateStr] || []);
      
      // Animar a entrada dos eventos
      slideAnim.setValue(20);
      opacityAnim.setValue(0);
      
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [selectedDay, eventsByDate]);

  // Formata o mês atual para exibição
  useEffect(() => {
    if (selectedDay && typeof selectedDay === 'string') {
      try {
        const date = parseISO(selectedDay);
        const monthStr = format(date, 'MMMM yyyy', { locale: ptBR });
        setCurrentMonth(monthStr.charAt(0).toUpperCase() + monthStr.slice(1));
      } catch (error) {
        console.error("Erro ao formatar mês:", error);
        setCurrentMonth('');
      }
    }
  }, [selectedDay]);

  // Prepara os marcadores para o calendário
  const markedDates = useMemo(() => {
    const markers: any = {};
    
    // Marca dias com eventos
    Object.keys(eventsByDate).forEach(date => {
      markers[date] = { 
        marked: true,
        dotColor: '#7B68EE'
      };
    });
    
    // Marca o dia selecionado
    if (selectedDay && typeof selectedDay === 'string') {
      const selectedDateStr = selectedDay.split('T')[0];
      markers[selectedDateStr] = {
        ...markers[selectedDateStr],
        selected: true,
        selectedColor: '#7B68EE',
      };
    }
    
    return markers;
  }, [eventsByDate, selectedDay]);

  const handleDateSelect = (day: any) => {
    if (day && day.dateString) {
      const dateString = day.dateString;
      setSelectedDay(dateString);
      onDateSelect(dateString);
    }
  };

  const renderEventItem = useCallback(({ item }: { item: any }) => {
    if (!item) return null;
    
    return (
      <EventItem 
        event={item} 
        onPress={() => onEventPress(item)}
        currentUserId={currentUserId}
      />
    );
  }, [onEventPress, currentUserId]);

  return (
    <View style={[styles.container, { height: containerHeight }]}>
      {/* Calendário */}
      <View style={styles.calendarContainer}>
        <View style={styles.monthHeader}>
          <Text style={styles.monthText}>{currentMonth}</Text>
          <View style={styles.arrowsContainer}>
            <TouchableOpacity>
              <Ionicons name="chevron-back" size={24} color="#aaa" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="chevron-forward" size={24} color="#aaa" />
            </TouchableOpacity>
          </View>
        </View>
        
        <RNCalendar
          current={selectedDay}
          onDayPress={handleDateSelect}
          markedDates={markedDates}
          hideExtraDays={false}
          theme={{
            backgroundColor: 'transparent',
            calendarBackground: 'transparent',
            textSectionTitleColor: '#aaa',
            selectedDayBackgroundColor: '#7B68EE',
            selectedDayTextColor: '#fff',
            todayTextColor: '#7B68EE',
            dayTextColor: '#fff',
            textDisabledColor: '#555',
            dotColor: '#7B68EE',
            selectedDotColor: '#fff',
            arrowColor: '#7B68EE',
            monthTextColor: '#fff',
            indicatorColor: '#7B68EE',
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '300',
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 13
          }}
        />
      </View>
      
      {/* Eventos */}
      <View style={styles.eventsContainer}>
        <View style={styles.eventsHeader}>
          <Text style={styles.eventsHeaderText}>
            {selectedDay 
              ? (() => {
                  try {
                    return format(parseISO(selectedDay), "EEEE, dd 'de' MMMM", { locale: ptBR });
                  } catch (error) {
                    return '';
                  }
                })()
              : ''}
          </Text>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7B68EE" />
          </View>
        ) : (
          <>
            {dayEvents.length === 0 ? (
              <View style={styles.noEventsContainer}>
                <Text style={styles.noEventsText}>Nenhum evento para este dia</Text>
              </View>
            ) : (
              <Animated.FlatList
                data={dayEvents}
                renderItem={renderEventItem}
                keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
                contentContainerStyle={styles.eventsList}
                style={[
                  styles.eventsFlat,
                  {
                    transform: [{ translateY: slideAnim }],
                    opacity: opacityAnim,
                  },
                ]}
              />
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  calendarContainer: {
    paddingTop: 5,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  arrowsContainer: {
    flexDirection: 'row',
    width: 70,
    justifyContent: 'space-between',
  },
  eventsContainer: {
    flex: 1,
  },
  eventsHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  eventsHeaderText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    textTransform: 'capitalize',
  },
  eventsList: {
    paddingBottom: 20,
  },
  eventsFlat: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noEventsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noEventsText: {
    color: '#aaa',
    fontSize: 16,
  },
});

export default Calendar; 