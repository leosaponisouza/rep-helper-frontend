// app/(panel)/home.tsx - Versão com header fixo moderno
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  RefreshControl,
  Image,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import api from '../../src/services/api';
import { ErrorHandler } from '../../src/utils/errorHandling';
import { useRouter } from 'expo-router';
import { Task } from '../../src/hooks/useTasks';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFocusEffect } from '@react-navigation/native';
import { getDisplayName } from '../../src/utils/userUtils';
import { LinearGradient } from 'expo-linear-gradient';

// Obter dimensões da tela
const { width } = Dimensions.get('window');

// Constante para altura do header
const HEADER_HEIGHT = 120;

// Tipos para melhor tipagem
interface QuickAction {
  id: string;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  bgColor: string;
  onPress: () => void;
}

interface HomeStats {
  totalExpenses: number;
  pendingTasks: number;
  upcomingEvents: number;
  republicName: string;
}

// Interface para eventos na tela inicial
interface HomeEvent {
  id: number;
  title: string;
  startDate: string;
  location?: string;
  isHappening: boolean;
  confirmedCount: number;
}

// Interface para tarefas do usuário
interface UserTask extends Task {
  isOverdue?: boolean;
}

const HomeScreen = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [userTasks, setUserTasks] = useState<UserTask[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<HomeEvent[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [eventError, setEventError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Buscar dados da home
  const fetchHomeData = async () => {
    try {
      setRefreshing(true);
      
      // Carregar estatísticas
      try {
        const statsResponse = await api.get('/home/stats');
        if (statsResponse?.data?.data) {
          setStats(statsResponse.data.data);
        }
      } catch (statsError) {
        console.error("Erro ao carregar estatísticas:", statsError);
      }
      
      // Buscar tarefas do usuário
      await fetchUserTasks();
      
      // Buscar eventos próximos
      await fetchUpcomingEvents();
      
      // Atualizar timestamp da última atualização
      setLastRefresh(Date.now());
    } catch (error) {
      console.error("Erro em fetchHomeData:", error);
      ErrorHandler.handle(error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Função para buscar tarefas do usuário
  const fetchUserTasks = async () => {
    try {
      setLoadingTasks(true);
      setTaskError(null);
      
      const response = await api.get('/api/v1/tasks/assigned');
      
      if (!response || !response.data) {
        setTaskError("Resposta da API inválida");
        setUserTasks([]);
        return;
      }
      
      const tasks = response.data;
      
      if (!Array.isArray(tasks)) {
        setTaskError("Formato de dados inválido");
        setUserTasks([]);
        return;
      }
      
      // Filtrar apenas tarefas ativas
      const activeTasks = tasks.filter(task => 
        task && task.status && ['PENDING', 'IN_PROGRESS', 'OVERDUE'].includes(task.status)
      );
      
      // Adicionar informação de atraso
      const tasksWithOverdueInfo = activeTasks.map(task => {
        try {
          let isOverdue = false;
          
          if (task.dueDate) {
            const dueDate = parseISO(task.dueDate);
            const now = new Date();
            isOverdue = dueDate < now;
          }
          
          return {
            ...task,
            isOverdue
          };
        } catch (error) {
          return task;
        }
      });
      
      // Ordenar com segurança
      const sortedTasks = [...tasksWithOverdueInfo].sort((a, b) => {
        // Prioridade para tarefas atrasadas
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        
        // Se ambas têm data de vencimento, ordenar por data
        if (a.dueDate && b.dueDate) {
          return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
        }
        
        return 0;
      });
      
      setUserTasks(sortedTasks.slice(0, 3)); // Mostrar apenas as 3 primeiras
    } catch (error) {
      console.error("Erro em fetchUserTasks:", error);
      setTaskError(error.message || "Erro ao buscar tarefas");
      setUserTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };
  
  // Função para buscar eventos próximos
  const fetchUpcomingEvents = async () => {
    try {
      setLoadingEvents(true);
      setEventError(null);
      
      const response = await api.get('/api/v1/events/upcoming');
      
      if (!response || !response.data) {
        setEventError("Resposta da API inválida");
        setUpcomingEvents([]);
        return;
      }
      
      const events = response.data;
      
      if (!Array.isArray(events)) {
        setEventError("Formato de dados inválido");
        setUpcomingEvents([]);
        return;
      }
      
      // Processar eventos para exibição na home
      const processedEvents = events.map(event => {
        const confirmedCount = event.invitations 
          ? event.invitations.filter(inv => inv.status === 'CONFIRMED').length 
          : 0;
        
        return {
          id: event.id,
          title: event.title,
          startDate: event.startDate,
          location: event.location,
          isHappening: event.isHappening || false,
          confirmedCount
        };
      });
      
      // Ordenar eventos pela data
      const sortedEvents = [...processedEvents].sort((a, b) => {
        const dateA = parseISO(a.startDate);
        const dateB = parseISO(b.startDate);
        return dateA.getTime() - dateB.getTime();
      });
      
      setUpcomingEvents(sortedEvents.slice(0, 3)); // Mostrar apenas os 3 próximos
    } catch (error) {
      console.error("Erro em fetchUpcomingEvents:", error);
      setEventError(error.message || "Erro ao buscar eventos");
      setUpcomingEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Carregar quando montar o componente
  useEffect(() => {
    fetchHomeData();
  }, []);
  
  // Recarregar sempre que a tela receber foco
  useFocusEffect(
    useCallback(() => {
      fetchHomeData();
    }, [])
  );

  // Ações rápidas
  const quickActions: QuickAction[] = [
    {
      id: 'new-task',
      title: 'Nova Tarefa',
      icon: 'checkbox-marked-circle-outline',
      color: '#7B68EE',
      bgColor: 'rgba(123, 104, 238, 0.15)',
      onPress: () => {
        router.push('/(panel)/tasks/create');
      }
    },
    {
      id: 'new-expense',
      title: 'Registrar Despesa',
      icon: 'cash-plus',
      color: '#4CAF50',
      bgColor: 'rgba(76, 175, 80, 0.15)',
      onPress: () => {
        router.push('/(panel)/expenses/create');
      }
    },
    {
      id: 'new-event',
      title: 'Novo Evento',
      icon: 'calendar-plus',
      color: '#FF9800',
      bgColor: 'rgba(255, 152, 0, 0.15)',
      onPress: () => {
        router.push('/(panel)/events/create');
      }
    }
  ];

  // Formatador de datas para tarefas
  const formatTaskDueDate = (dateString?: string) => {
    if (!dateString) return null;
    
    try {
      const dueDate = parseISO(dateString);
      
      if (isToday(dueDate)) {
        return { text: 'Hoje', color: '#FF9800' };
      } else if (isTomorrow(dueDate)) {
        return { text: 'Amanhã', color: '#2196F3' };
      } else {
        const formattedDate = format(dueDate, 'dd/MM', { locale: ptBR });
        const now = new Date();
        return { 
          text: formattedDate, 
          color: dueDate < now ? '#F44336' : '#7B68EE' 
        };
      }
    } catch (error) {
      return { text: 'Data inválida', color: '#9E9E9E' };
    }
  };
  
  // Formatador para datas de eventos
  const formatEventDate = (dateString?: string) => {
    if (!dateString) return null;
    
    try {
      const eventDate = parseISO(dateString);
      
      if (isToday(eventDate)) {
        const timeStr = format(eventDate, 'HH:mm', { locale: ptBR });
        return { text: `Hoje, ${timeStr}`, color: '#4CAF50', isToday: true };
      } else if (isTomorrow(eventDate)) {
        const timeStr = format(eventDate, 'HH:mm', { locale: ptBR });
        return { text: `Amanhã, ${timeStr}`, color: '#FF9800', isToday: false };
      } else {
        const dateStr = format(eventDate, 'dd/MM', { locale: ptBR });
        const timeStr = format(eventDate, 'HH:mm', { locale: ptBR });
        return { 
          text: `${dateStr}, ${timeStr}`,
          color: '#7B68EE',
          isToday: false
        };
      }
    } catch (error) {
      return { text: 'Data inválida', color: '#9E9E9E', isToday: false };
    }
  };
  
  // Renderizador de item de tarefa
  const TaskItem = ({ task }: { task: UserTask }) => {
    const dueDate = formatTaskDueDate(task.dueDate);
    
    return (
      <TouchableOpacity 
        style={[
          styles.taskItem, 
          task.isOverdue && styles.overdueTaskItem
        ]}
        onPress={() => router.push(`/(panel)/tasks/${task.id}`)}
      >
        <View style={styles.taskItemHeader}>
          <View style={styles.taskTitleContainer}>
            <Text style={styles.taskTitle} numberOfLines={1}>
              {task.title}
            </Text>
            
            {task.category && (
              <View style={styles.categoryChip}>
                <FontAwesome5 name="tag" size={12} color="#7B68EE" />
                <Text style={styles.categoryText}>{task.category}</Text>
              </View>
            )}
          </View>
          
          <View style={[
            styles.statusBadge, 
            { backgroundColor: task.status === 'OVERDUE' 
              ? 'rgba(244, 67, 54, 0.15)' 
              : task.status === 'IN_PROGRESS' 
                ? 'rgba(33, 150, 243, 0.15)' 
                : 'rgba(255, 152, 0, 0.15)' 
            }
          ]}>
            <Text style={[
              styles.statusText, 
              { color: task.status === 'OVERDUE' 
                ? '#F44336' 
                : task.status === 'IN_PROGRESS' 
                  ? '#2196F3' 
                  : '#FF9800' 
              }
            ]}>
              {task.status === 'OVERDUE' 
                ? 'Atrasada' 
                : task.status === 'IN_PROGRESS' 
                  ? 'Em andamento' 
                  : 'Pendente'
              }
            </Text>
          </View>
        </View>
        
        <View style={styles.taskItemFooter}>
          {dueDate && (
            <View style={styles.dueDateContainer}>
              <Ionicons 
                name="calendar" 
                size={14} 
                color={dueDate.color} 
              />
              <Text style={[styles.dueDateText, { color: dueDate.color }]}>
                {dueDate.text}
              </Text>
            </View>
          )}
          
          <View style={styles.assigneesContainer}>
            {task.assignedUsers && task.assignedUsers.slice(0, 3).map((assignee, index) => (
              <View 
                key={assignee.id} 
                style={[
                  styles.assigneeAvatar, 
                  { zIndex: 10 - index, marginLeft: index > 0 ? -10 : 0 },
                  assignee.id === user?.uid && styles.currentUserAvatar
                ]}
              >
                {assignee.profilePictureUrl ? (
                  <Image 
                    source={{ uri: assignee.profilePictureUrl }} 
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarInitial}>
                    {assignee.nickname
                      ? assignee.nickname.charAt(0).toUpperCase()
                      : assignee.name?.charAt(0).toUpperCase() || '?'}
                  </Text>
                )}
              </View>
            ))}
            
            {task.assignedUsers && task.assignedUsers.length > 3 && (
              <View style={[styles.assigneeAvatar, styles.moreAssigneesAvatar]}>
                <Text style={styles.moreAssigneesText}>
                  +{task.assignedUsers.length - 3}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Renderizador de item de evento
  const EventItem = ({ event }: { event: HomeEvent }) => {
    const eventDate = formatEventDate(event.startDate);
    
    return (
      <TouchableOpacity 
        style={[
          styles.eventItem,
          event.isHappening && styles.happeningEventItem
        ]}
        onPress={() => router.push(`/(panel)/events/${event.id}`)}
      >
        {event.isHappening && (
          <View style={styles.liveIndicatorContainer}>
            <View style={styles.liveIndicator} />
            <Text style={styles.liveText}>AGORA</Text>
          </View>
        )}
        
        <View style={styles.eventContent}>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {event.title}
          </Text>
          
          <View style={styles.eventDetails}>
            {eventDate && (
              <View style={styles.eventDateContainer}>
                <Ionicons name="time" size={14} color={eventDate.color} />
                <Text style={[styles.eventDateText, { color: eventDate.color }]}>
                  {eventDate.text}
                </Text>
              </View>
            )}
            
            {event.location && (
              <View style={styles.eventLocationContainer}>
                <Ionicons name="location" size={14} color="#9E9E9E" />
                <Text style={styles.eventLocationText} numberOfLines={1}>
                  {event.location}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.eventFooter}>
            <View style={styles.attendeesInfo}>
              <Ionicons name="people" size={14} color="#7B68EE" />
              <Text style={styles.attendeesText}>
                {event.confirmedCount} {event.confirmedCount === 1 ? 'participante' : 'participantes'}
              </Text>
            </View>
            
            {event.isHappening && (
              <View style={styles.happeningBadge}>
                <Text style={styles.happeningText}>Acontecendo</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Componente de ação rápida
  const QuickActionButton = ({ action }: { action: QuickAction }) => (
    <TouchableOpacity 
      style={[
        styles.quickActionButton,
        { backgroundColor: action.bgColor }
      ]}
      onPress={action.onPress}
    >
      <MaterialCommunityIcons 
        name={action.icon} 
        size={28} 
        color={action.color} 
      />
      <Text style={[styles.quickActionText, { color: action.color }]}>
        {action.title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['right', 'left']}>
      <StatusBar barStyle="light-content" backgroundColor="#7B68EE" />
      
      {/* Novo Header Fixo Moderno */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#7B68EE', '#6A5ACD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTitleSection}>
              <Text style={styles.welcomeText}>Bem-vindo(a),</Text>
              <Text style={styles.userNameText}>{getDisplayName(user, true)}</Text>
              <Text style={styles.republicName}>
                {stats?.republicName || 'Sua República'}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => router.push('/(panel)/settings/account')}
            >
              {user?.profile_picture_url ? (
                <Image 
                  source={{ uri: user.profile_picture_url }} 
                  style={styles.profileImage} 
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Text style={styles.profileInitials}>
                    {user?.name?.charAt(0) || 'U'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Indicadores de atividade */}
          <View style={styles.activityIndicators}>
            <View style={styles.indicatorItem}>
              <MaterialCommunityIcons name="cash" size={20} color="#FFFFFF" />
              <Text style={styles.indicatorText}>
                R$ {stats?.totalExpenses?.toFixed(2) || '0,00'}
              </Text>
            </View>
            
            <View style={styles.indicatorDivider} />
            
            <View style={styles.indicatorItem}>
              <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.indicatorText}>
                {stats?.pendingTasks || 0} tarefas
              </Text>
            </View>
            
            <View style={styles.indicatorDivider} />
            
            <View style={styles.indicatorItem}>
              <MaterialCommunityIcons name="calendar-check" size={20} color="#FFFFFF" />
              <Text style={styles.indicatorText}>
                {stats?.upcomingEvents || 0} eventos
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
      
      {/* ScrollView com conteúdo principal */}
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: HEADER_HEIGHT + 20 }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchHomeData}
            colors={['#7B68EE']}
            tintColor={'#7B68EE'}
            progressBackgroundColor="#333"
            progressViewOffset={HEADER_HEIGHT}
          />
        }
        style={styles.scrollView}
      >
        {/* Ações Rápidas */}
        <View style={styles.quickActionsSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="flash" size={20} color="#7B68EE" />
              <Text style={styles.sectionTitle}>Ações Rápidas</Text>
            </View>
          </View>
          
          <View style={styles.quickActionsContainer}>
            {quickActions.map(action => (
              <QuickActionButton key={action.id} action={action} />
            ))}
          </View>
        </View>
        
        {/* Seção de Tarefas do Usuário */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={20} color="#7B68EE" />
              <Text style={styles.sectionTitle}>Suas Tarefas</Text>
            </View>
            
            <TouchableOpacity 
              onPress={() => router.push('/(panel)/tasks/?filter=my-tasks')}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>Ver todas</Text>
              <Ionicons name="chevron-forward" size={16} color="#7B68EE" />
            </TouchableOpacity>
          </View>
          
          {loadingTasks ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#7B68EE" />
              <Text style={styles.loadingText}>Carregando tarefas...</Text>
            </View>
          ) : taskError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={24} color="#FF6347" />
              <Text style={styles.errorText}>{taskError}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={fetchUserTasks}
              >
                <Text style={styles.retryButtonText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : userTasks.length > 0 ? (
            <View style={styles.tasksContainer}>
              {userTasks.map(task => (
                <TaskItem key={task.id?.toString()} task={task} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="checkbox-marked-circle-outline" 
                size={40} 
                color="#7B68EE" 
                style={{ opacity: 0.6 }}
              />
              <Text style={styles.emptyText}>
                Você não tem tarefas atribuídas
              </Text>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => router.push('/(panel)/tasks/create')}
              >
                <Text style={styles.createButtonText}>Criar Tarefa</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Seção de Eventos Próximos */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="calendar" size={20} color="#7B68EE" />
              <Text style={styles.sectionTitle}>Próximos Eventos</Text>
            </View>
            
            <TouchableOpacity 
              onPress={() => router.push('/(panel)/events/calendar')}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>Ver todos</Text>
              <Ionicons name="chevron-forward" size={16} color="#7B68EE" />
            </TouchableOpacity>
          </View>
          
          {loadingEvents ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#7B68EE" />
              <Text style={styles.loadingText}>Carregando eventos...</Text>
            </View>
          ) : eventError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={24} color="#FF6347" />
              <Text style={styles.errorText}>{eventError}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={fetchUpcomingEvents}
              >
                <Text style={styles.retryButtonText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : upcomingEvents.length > 0 ? (
            <View style={styles.eventsContainer}>
              {upcomingEvents.map(event => (
                <EventItem key={event.id?.toString()} event={event} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name="calendar" 
                size={40} 
                color="#7B68EE" 
                style={{ opacity: 0.6 }}
              />
              <Text style={styles.emptyText}>
                Nenhum evento programado
              </Text>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => router.push('/(panel)/events/create')}
              >
                <Text style={styles.createButtonText}>Criar Evento</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  // Estilos Básicos
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  
  // Estilos do Header Moderno
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  headerGradient: {
    flex: 1,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTitleSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  userNameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  republicName: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  profileButton: {
    height: 50,
    width: 50,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileImage: {
    height: 50,
    width: 50,
    borderRadius: 25,
  },
  profileImagePlaceholder: {
    height: 50,
    width: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  
  // Indicadores de Atividade no Header
  activityIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 15,
    margin: 15,
    padding: 10,
  },
  indicatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  indicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  indicatorDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  // Seção de Ações Rápidas
  quickActionsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '31%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  quickActionText: {
    fontWeight: '600',
    marginTop: 8,
    fontSize: 13,
    textAlign: 'center',
  },
  
  // Estilos de Seção
  sectionContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#7B68EE',
    fontSize: 14,
    marginRight: 4,
  },
  
  // Estados de Loading e Erro
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#aaa',
    marginTop: 10,
    fontSize: 14,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF6347',
    marginTop: 10,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 99, 71, 0.15)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#FF6347',
    fontWeight: 'bold',
  },
  
  // Estados vazios
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    marginVertical: 16,
    fontSize: 14,
  },
  createButton: {
    backgroundColor: '#7B68EE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  
  // Tarefas
  tasksContainer: {
    marginBottom: 8,
  },
  taskItem: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#7B68EE',
  },
  overdueTaskItem: {
    borderLeftColor: '#F44336',
  },
  taskItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  categoryText: {
    color: '#7B68EE',
    fontSize: 12,
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  taskItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateText: {
    fontSize: 12,
    marginLeft: 5,
    fontWeight: '500',
  },
  assigneesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assigneeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#222',
  },
  avatarImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  currentUserAvatar: {
    borderColor: '#7B68EE',
    backgroundColor: '#444',
  },
  moreAssigneesAvatar: {
    backgroundColor: 'rgba(123, 104, 238, 0.3)',
  },
  moreAssigneesText: {
    color: '#7B68EE',
    fontSize: 9,
    fontWeight: 'bold',
  },
  
  // Eventos
  eventsContainer: {
    marginBottom: 8,
  },
  eventItem: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    position: 'relative',
  },
  happeningEventItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  liveIndicatorContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    zIndex: 1,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 4,
  },
  liveText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: 'bold',
  },
  eventContent: {
    paddingRight: 70, // Espaço para o indicador "AGORA"
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  eventDetails: {
    marginBottom: 8,
  },
  eventDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventDateText: {
    fontSize: 12,
    marginLeft: 5,
    fontWeight: '500',
  },
  eventLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventLocationText: {
    fontSize: 12,
    color: '#aaa',
    marginLeft: 5,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendeesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeesText: {
    fontSize: 12,
    color: '#aaa',
    marginLeft: 5,
  },
  happeningBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  happeningText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: 'bold',
  }
});

export default HomeScreen;