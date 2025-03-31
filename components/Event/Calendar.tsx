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
  refreshControl?: React.ReactElement;
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
  refreshControl,
}) => {
  const [selectedDay, setSelectedDay] = useState(selectedDate || format(new Date(), 'yyyy-MM-dd'));
  const [currentMonth, setCurrentMonth] = useState('');
  const [eventsByDate, setEventsByDate] = useState<EventsByDate>({});
  const [dayEvents, setDayEvents] = useState<any[]>([]);
  const slideAnim = useRef(new Animated.Value(20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const calendarRef = useRef<any>(null);
  const isRefreshing = useRef(false);
  
  // Função para animar a entrada dos eventos com efeito de fade in/slide up
  const animateEventsIn = useCallback(() => {
    // Reset dos valores de animação
    slideAnim.setValue(20);
    opacityAnim.setValue(0);
    
    // Animação paralela de deslize para cima e fade in
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
  }, [slideAnim, opacityAnim]);
  
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
    
    // Animar a entrada dos eventos quando forem carregados
    if (!isRefreshing.current) {
      animateEventsIn();
    }
    isRefreshing.current = false;
  }, [events, animateEventsIn]);

  // Atualiza os eventos do dia quando a data selecionada muda
  useEffect(() => {
    if (selectedDay && typeof selectedDay === 'string') {
      const dateStr = selectedDay.split('T')[0];
      setDayEvents(eventsByDate[dateStr] || []);
      
      // Animar a entrada dos eventos
      animateEventsIn();
    }
  }, [selectedDay, eventsByDate, animateEventsIn]);

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
        dotColor: '#7B68EE',
        activeOpacity: 0.8
      };
    });
    
    // Marca o dia selecionado
    if (selectedDay && typeof selectedDay === 'string') {
      const selectedDateStr = selectedDay.split('T')[0];
      markers[selectedDateStr] = {
        ...markers[selectedDateStr],
        selected: true,
        selectedColor: '#7B68EE',
        selectedTextColor: '#ffffff',
        selectedDotColor: '#ffffff'
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
    <View style={styles.container}>
      <View style={styles.calendarWrapper}>
        <CalendarList
          ref={calendarRef}
          current={selectedDay}
          onDayPress={handleDateSelect}
          markedDates={markedDates}
          pastScrollRange={12}
          futureScrollRange={12}
          scrollEnabled={true}
          horizontal={true}
          pagingEnabled={true}
          theme={{
            calendarBackground: '#333',
            textSectionTitleColor: '#fff',
            selectedDayBackgroundColor: '#7B68EE',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#7B68EE',
            dayTextColor: '#fff',
            textDisabledColor: '#666',
            dotColor: '#7B68EE',
            monthTextColor: '#fff',
            arrowColor: '#7B68EE',
            indicatorColor: '#7B68EE',
          }}
        />
      </View>

      <View style={styles.eventsSection}>
        <View style={styles.eventsHeader}>
          <View style={styles.eventsHeaderContent}>
            <Text style={styles.eventsTitle}>
              {format(parseISO(selectedDay), "dd 'de' MMMM", { locale: ptBR })}
            </Text>
            <View style={styles.eventsCountBadge}>
              <Text style={styles.eventsCountText}>
                {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'}
              </Text>
            </View>
          </View>
        </View>

        <Animated.View 
          style={[
            styles.eventsList,
            {
              transform: [{ translateY: slideAnim }],
              opacity: opacityAnim
            }
          ]}
        >
          <FlatList
            data={dayEvents}
            renderItem={renderEventItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.eventsListContent}
            refreshControl={refreshControl}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={40} color="#666" />
                <Text style={styles.emptyText}>Nenhum evento para este dia</Text>
              </View>
            }
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#333',
  },
  calendarWrapper: {
    backgroundColor: '#333',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  eventsSection: {
    flex: 1,
    backgroundColor: '#222',
  },
  eventsHeader: {
    backgroundColor: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  eventsHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  eventsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  eventsCountBadge: {
    backgroundColor: '#7B68EE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventsCountText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  eventsList: {
    flex: 1,
  },
  eventsListContent: {
    padding: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
});

export default Calendar; 