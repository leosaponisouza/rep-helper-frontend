// app/(panel)/events/calendar.tsx - Fixed version with improved null checks and error handling
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  FlatList,
  Dimensions,
  ListRenderItemInfo
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEvents, Event } from '../../../src/hooks/useEvents';
import { useAuth } from '../../../src/context/AuthContext';
import { Calendar, DateData } from 'react-native-calendars';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFocusEffect } from '@react-navigation/native';

const windowWidth: number = Dimensions.get('window').width;

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
}

const CalendarScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { events, loading, fetchEvents } = useEvents();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [markedDates, setMarkedDates] = useState<Record<string, MarkedDate>>({});
  const [selectedDateEvents, setSelectedDateEvents] = useState<Event[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Configurações de tema para o calendário
  const calendarTheme = {
    backgroundColor: '#333',
    calendarBackground: '#333',
    textSectionTitleColor: '#7B68EE',
    selectedDayBackgroundColor: '#7B68EE',
    selectedDayTextColor: '#ffffff',
    todayTextColor: '#7B68EE',
    dayTextColor: '#ffffff',
    textDisabledColor: '#666',
    dotColor: '#7B68EE',
    selectedDotColor: '#ffffff',
    arrowColor: '#7B68EE',
    disabledArrowColor: '#666',
    monthTextColor: '#ffffff',
    indicatorColor: '#7B68EE',
    textDayFontWeight: '300',
    textMonthFontWeight: 'bold',
    textDayHeaderFontWeight: '300',
    textDayFontSize: 16,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 14
  };

  // Recarregar eventos quando a tela receber foco
  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents])
  );

  // Processar eventos para marcação no calendário
  useEffect(() => {
    if (events && events.length > 0) {
      const dates: Record<string, MarkedDate> = {};
      
      events.forEach(event => {
        if (!event.startDate) return; // Verificar se startDate existe
        
        try {
          const dateStr = event.startDate.split('T')[0]; // Formato YYYY-MM-DD
          
          if (!dates[dateStr]) {
            dates[dateStr] = {
              marked: true,
              dotColor: '#7B68EE',
              dots: []
            };
          }
          
          // Limite a 3 dots por data
          if (dates[dateStr].dots && dates[dateStr].dots.length < 3) {
            dates[dateStr].dots.push({
              color: getEventColor(event),
              key: String(event.id) // Ensure key is a string
            });
          }
        } catch (error) {
          console.error('Error processing event date:', error);
        }
      });
      
      // Se houver uma data selecionada, mantém a seleção
      if (selectedDate) {
        dates[selectedDate] = {
          ...dates[selectedDate],
          selected: true,
          selectedColor: '#7B68EE'
        };
      }
      
      setMarkedDates(dates);
    }
  }, [events, selectedDate]);

  // Selecionar data e buscar eventos
  const handleDayPress = (day: DateData): void => {
    const dateStr = day.dateString;
    
    // Atualizar marca no calendário
    const updatedMarkedDates: Record<string, MarkedDate> = {...markedDates};
    
    // Remover seleção anterior
    Object.keys(updatedMarkedDates).forEach(key => {
      if (updatedMarkedDates[key]?.selected) {
        updatedMarkedDates[key] = {
          ...updatedMarkedDates[key],
          selected: false
        };
      }
    });
    
    // Adicionar nova seleção
    updatedMarkedDates[dateStr] = {
      ...updatedMarkedDates[dateStr],
      selected: true,
      selectedColor: '#7B68EE'
    };
    
    setMarkedDates(updatedMarkedDates);
    setSelectedDate(dateStr);
    
    // Filtrar eventos para a data selecionada
    const dayEvents = events.filter(event => {
      return event.startDate && event.startDate.startsWith(dateStr);
    });
    
    setSelectedDateEvents(dayEvents);
  };

  // Fixed getEventColor function with proper null checks
  const getEventColor = (event: Event): string => {
    if (!event) return '#7B68EE'; // Default color
    
    // Verificar se é um evento atrasado ou cancelado
    if (event.isFinished) return '#9E9E9E';
    
    // Verificar se está acontecendo agora
    if (event.isHappening) return '#4CAF50';
    
    // Verificar status do convite para o usuário atual
    if (user && event.invitations && Array.isArray(event.invitations)) {
      const userInvitation = event.invitations.find(inv => inv.userId === user.uid);
      
      if (userInvitation) {
        switch (userInvitation.status) {
          case 'CONFIRMED': return '#7B68EE'; // Confirmado pelo usuário
          case 'INVITED': return '#FFC107';   // Convite pendente
          case 'DECLINED': return '#FF6347';  // Recusado pelo usuário
          default: return '#7B68EE';
        }
      }
    }
    
    // Padrão para todos os outros casos
    return '#7B68EE';
  };

  // Formatar hora do evento
  const formatEventTime = (dateString?: string): string => {
    if (!dateString) return '';
    
    try {
      const date = parseISO(dateString);
      return format(date, "HH:mm", { locale: ptBR });
    } catch (error) {
      console.error('Error formatting event time:', dateString, error);
      return '';
    }
  };

  // Formatar data para exibição amigável
  const getFormattedDate = (dateString?: string): string => {
    if (!dateString) return '';
    
    try {
      const date = parseISO(dateString);
      
      if (isToday(date)) {
        return "Hoje";
      } else if (isTomorrow(date)) {
        return "Amanhã";
      } else {
        return format(date, "dd 'de' MMMM", { locale: ptBR });
      }
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return dateString;
    }
  };

  // Fixed renderEventItem function with proper null checks
  const renderEventItem = ({ item }: ListRenderItemInfo<Event>): React.ReactElement => {
    // Calculate confirmed count safely
    let confirmedCount = 0;
    if (item.invitations && Array.isArray(item.invitations)) {
      confirmedCount = item.invitations.filter(inv => inv.status === 'CONFIRMED').length;
    }
      
    return (
      <TouchableOpacity
        style={[
          styles.eventItem,
          { borderLeftColor: getEventColor(item) }
        ]}
        onPress={() => {
          router.push(`/(panel)/events/${item.id}`);
        }}
      >
        <View style={styles.eventTimeContainer}>
          <Text style={styles.eventTime}>
            {formatEventTime(item.startDate)}
          </Text>
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
                {confirmedCount} confirmados
              </Text>
            </View>
          </View>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color="#7B68EE" />
      </TouchableOpacity>
    );
  };

  if (loading && (!events || events.length === 0)) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#222" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B68EE" />
          <Text style={styles.loadingText}>Carregando eventos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      <View style={styles.container}>
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
        />
        
        {/* Lista de eventos para o dia selecionado */}
        {selectedDate && (
          <View style={styles.eventsContainer}>
            <View style={styles.selectedDateHeader}>
              <Text style={styles.selectedDateText}>
                {getFormattedDate(selectedDate)}
              </Text>
              <TouchableOpacity 
                style={styles.addEventButton}
                onPress={() => router.push('/(panel)/events/create')}
              >
                <Ionicons name="add" size={20} color="#7B68EE" />
              </TouchableOpacity>
            </View>
            
            {selectedDateEvents.length > 0 ? (
              <FlatList
                data={selectedDateEvents}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderEventItem}
                style={styles.eventsList}
              />
            ) : (
              <View style={styles.noEventsContainer}>
                <MaterialCommunityIcons name="calendar-blank" size={48} color="#7B68EE" />
                <Text style={styles.noEventsText}>
                  Nenhum evento nesta data
                </Text>
                <TouchableOpacity 
                  style={styles.createEventButtonLarge}
                  onPress={() => router.push('/(panel)/events/create')}
                >
                  <Text style={styles.createEventButtonText}>
                    Criar Evento
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        
        {/* Botão flutuante de adicionar */}
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={() => router.push('/(panel)/events/create')}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
  },
  listViewButton: {
    padding: 8,
  },
  eventsContainer: {
    flex: 1,
    minHeight: 200, // Altura mínima garantida
    maxHeight: Dimensions.get('window').height * 0.4, // Limita a altura máxima
    backgroundColor: '#222',
    borderTopWidth: 1,
    borderTopColor: '#444',
    padding: 10,
  },
  calendar: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 10,
    margin: 10,
    // Remover height fixo
  },
  container: {
    flex: 1,
    backgroundColor: '#222',
    // Adicionar justifyContent para melhor distribuição
    justifyContent: 'flex-start', 
  },
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  addEventButton: {
    padding: 8,
  },
  eventsList: {
    flex: 1,
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 10,
    marginBottom: 10,
    padding: 12,
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  eventTimeContainer: {
    marginRight: 12,
  },
  eventTime: {
    color: '#7B68EE',
    fontSize: 16,
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
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationText: {
    color: '#aaa',
    fontSize: 14,
    marginLeft: 4,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
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
  noEventsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    shadowColor: '#7B68EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});

export default CalendarScreen;