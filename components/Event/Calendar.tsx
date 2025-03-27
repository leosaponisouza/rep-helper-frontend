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
import { Calendar as RNCalendar, LocaleConfig, CalendarList } from 'react-native-calendars';
import { format, parseISO, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import EventItem from './EventItem';

// Configurar localização em português
LocaleConfig.locales['pt-br'] = {
  monthNames: [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ],
  monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  dayNames: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

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
  const calendarRef = useRef<any>(null);
  
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
  
  // Função para navegar para o mês anterior
  const goToPreviousMonth = useCallback(() => {
    if (selectedDay) {
      try {
        const currentDate = parseISO(selectedDay);
        const newDate = subMonths(currentDate, 1);
        const newDateString = format(newDate, 'yyyy-MM-dd');
        setSelectedDay(newDateString);
        
        // Se o calendário tem uma referência, podemos usar seus métodos nativos
        if (calendarRef.current) {
          calendarRef.current.scrollToMonth(newDateString);
        }
      } catch (error) {
        console.error('Erro ao navegar para o mês anterior:', error);
      }
    }
  }, [selectedDay]);
  
  // Função para navegar para o próximo mês
  const goToNextMonth = useCallback(() => {
    if (selectedDay) {
      try {
        const currentDate = parseISO(selectedDay);
        const newDate = addMonths(currentDate, 1);
        const newDateString = format(newDate, 'yyyy-MM-dd');
        setSelectedDay(newDateString);
        
        // Se o calendário tem uma referência, podemos usar seus métodos nativos
        if (calendarRef.current) {
          calendarRef.current.scrollToMonth(newDateString);
        }
      } catch (error) {
        console.error('Erro ao navegar para o próximo mês:', error);
      }
    }
  }, [selectedDay]);

  return (
    <View style={[styles.container, { height: containerHeight }]}>
      {/* Cabeçalho do mês com setas de navegação */}
      <View style={styles.monthHeader}>
        <TouchableOpacity 
          onPress={goToPreviousMonth}
          style={styles.monthNavButton}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="chevron-back" size={22} color="#7B68EE" />
        </TouchableOpacity>
        
        <View style={styles.monthTextContainer}>
          <Text style={styles.monthText}>{currentMonth}</Text>
          <View style={styles.swipeIndicator}>
            <View style={styles.swipeDot} />
            <View style={styles.swipeDot} />
            <View style={styles.swipeDot} />
          </View>
        </View>
        
        <TouchableOpacity 
          onPress={goToNextMonth}
          style={styles.monthNavButton}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="chevron-forward" size={22} color="#7B68EE" />
        </TouchableOpacity>
      </View>
      
      {/* Calendário com scroll horizontal */}
      <CalendarList
        ref={calendarRef}
        current={selectedDay}
        onDayPress={handleDateSelect}
        markedDates={markedDates}
        pastScrollRange={6}
        futureScrollRange={6}
        scrollEnabled={true}
        showScrollIndicator={false}
        horizontal={true}
        pagingEnabled={true}
        calendarWidth={screenWidth}
        firstDay={0} // Semana começa no domingo
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
        // Esconder o cabeçalho padrão do mês
        renderHeader={(date) => null}
      />
      
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
                <Text style={styles.noEventsText}>Nenhum compromisso para este dia</Text>
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
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  monthNavButton: {
    padding: 5,
  },
  monthTextContainer: {
    alignItems: 'center',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
    marginBottom: 5,
  },
  swipeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#7B68EE',
    marginHorizontal: 2,
    opacity: 0.7,
  },
  calendarContainer: {
    position: 'relative',
    width: '100%',
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