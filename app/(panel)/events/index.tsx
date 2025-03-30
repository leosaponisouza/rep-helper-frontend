// app/(panel)/events/index.tsx - Updated with components
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Animated,
  Platform,
  RefreshControl,
  ToastAndroid
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEvents } from '@/src/hooks/useEvents';
import { useAuth } from '@/src/context/AuthContext';
import { format } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

// Importar componentes
import CalendarSkeleton from '@/components/Event/CalendarSkeleton';
import Calendar from '@/components/Event/Calendar';

// Tela principal de eventos (otimizada)
const EventsScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { events, loading, refreshEvents } = useEvents();
  
  // Estados
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [calendarLoading, setCalendarLoading] = useState<boolean>(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Referencias para otimização
  const eventsLoaded = useRef(false);
  const isRefreshing = useRef(false);
  
  // Animação para transição suave do skeleton para conteúdo real
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // String formatada da data selecionada (memorizada)
  const formattedDate = useMemo(() => {
    try {
      return format(selectedDate, 'yyyy-MM-dd');
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return format(new Date(), 'yyyy-MM-dd');
    }
  }, [selectedDate]);

  // Efeito para animar a entrada do calendário
  useEffect(() => {
    if (!calendarLoading && !refreshing) {
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
  }, [calendarLoading, refreshing, fadeAnim]);
  
  // Carregar eventos quando a tela recebe foco
  useFocusEffect(
    useCallback(() => {
      // Só atualiza se ainda não carregou ou se está solicitando refresh explicitamente
      if (!eventsLoaded.current || refreshing) {
        refreshCalendarEvents();
      }
      
      return () => {
        // Quando a tela perde o foco, permitimos que seja recarregada na próxima vez
        // mas apenas se estiver saindo completamente, não apenas indo para detalhes
        if (router.canGoBack()) {
          eventsLoaded.current = true;
        } else {
          eventsLoaded.current = false;
        }
      };
    }, [refreshing, router])
  );
  
  // Atualizar eventos do calendário (otimizado)
  const refreshCalendarEvents = useCallback(async () => {
    // Prevenir múltiplas requisições simultâneas
    if (isRefreshing.current) return;
    
    try {
      isRefreshing.current = true;
      setRefreshing(true);
      setCalendarLoading(true);
      
      // Carregar eventos
      await refreshEvents('all');
      
      // Marcar que os eventos foram carregados
      eventsLoaded.current = true;
      
      // Registrar o horário da atualização
      setLastRefresh(new Date());
      
      // Mostrar mensagem de sucesso apenas se for um pull-to-refresh
      if (!calendarLoading) {
        if (Platform.OS === 'android') {
          ToastAndroid.show('Eventos atualizados com sucesso!', ToastAndroid.SHORT);
        }
      }
      
      // Delay para o skeleton
      setTimeout(() => {
        setCalendarLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error refreshing calendar events:', error);
      setCalendarLoading(false);
    } finally {
      setRefreshing(false);
      isRefreshing.current = false;
    }
  }, [refreshEvents, calendarLoading]);
  
  // Callback para o "pull to refresh"
  const handlePullToRefresh = useCallback(async () => {
    if (isRefreshing.current) return;
    
    try {
      setRefreshing(true);
      await refreshEvents('all');
      
      // Registrar o horário da atualização
      setLastRefresh(new Date());
      
      // Feedback visual
      if (Platform.OS === 'android') {
        ToastAndroid.show('Eventos atualizados com sucesso!', ToastAndroid.SHORT);
      }
    } catch (error) {
      console.error('Erro ao atualizar eventos:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshEvents]);
  
  // Obter texto informativo sobre a última atualização
  const lastUpdateText = useMemo(() => {
    if (!lastRefresh) return '';
    
    try {
      const now = new Date();
      const diff = now.getTime() - lastRefresh.getTime();
      const minutes = Math.floor(diff / 60000);
      
      if (minutes < 1) {
        return 'Atualizado agora mesmo';
      } else if (minutes === 1) {
        return 'Atualizado há 1 minuto';
      } else if (minutes < 60) {
        return `Atualizado há ${minutes} minutos`;
      } else {
        const hours = Math.floor(minutes / 60);
        if (hours === 1) {
          return 'Atualizado há 1 hora';
        } else {
          return `Atualizado há ${hours} horas`;
        }
      }
    } catch (error) {
      return '';
    }
  }, [lastRefresh]);
  
  // Manipular seleção de data no calendário
  const handleDateSelect = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      // Verificar se a data é válida
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
      } else {
        console.error("Data inválida:", dateString);
      }
    } catch (error) {
      console.error("Erro ao converter data:", error);
    }
  }, []);
  
  // Navegar para a tela de detalhes do evento
  const handleEventPress = useCallback((event: any) => {
    if (event && event.id) {
      router.push(`/(panel)/events/${event.id}`);
    }
  }, [router]);
  
  // Navegar para a tela de criação de evento
  const handleAddEvent = useCallback(() => {
    router.push('/(panel)/events/create');
  }, [router]);
  
  // Eventos memorizados e limpos
  const eventsData = useMemo(() => {
    return Array.isArray(events) ? events : [];
  }, [events]);
  
  // Preparar eventos para o calendário
  const preparedEvents = useMemo(() => {
    return eventsData.map(event => {
      // Usar as operações de espalhamento para uma cópia segura
      const preparedEvent = { ...event };
      
      // Garantir que o evento tem uma propriedade date baseada em startDate
      if (event.startDate && typeof event.startDate === 'string') {
        // Adicionar explicitamente a propriedade date como uma propriedade dinâmica
        (preparedEvent as any).date = event.startDate;
      }
      
      return preparedEvent;
    });
  }, [eventsData]);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      {/* Header com título e botão de adicionar */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Agenda</Text>
            {lastUpdateText && (
              <Text style={styles.lastUpdateText}>{lastUpdateText}</Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.addButtonContainer} 
            onPress={handleAddEvent}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#9370DB', '#7B68EE', '#6A5ACD']}
              style={styles.addButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="add" size={22} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Novo</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
      
      {calendarLoading ? (
        <CalendarSkeleton />
      ) : (
        <Calendar
          events={preparedEvents}
          selectedDate={formattedDate}
          onDateSelect={handleDateSelect}
          onEventPress={handleEventPress}
          currentUserId={user?.uid || ''}
          loading={calendarLoading}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing}
              onRefresh={handlePullToRefresh}
              colors={['#7B68EE', '#9370DB']}
              tintColor="#7B68EE"
              title="Atualizando eventos..."
              titleColor="#7B68EE"
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  headerContainer: {
    backgroundColor: '#333',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 2,
  },
  addButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#7B68EE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  addButton: {
    width: 100,
    height: 40,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 4,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default React.memo(EventsScreen);