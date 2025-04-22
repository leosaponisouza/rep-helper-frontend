// app/(panel)/home.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { useHome } from '@/src/hooks/useHome';
import { useNotifications } from '@/src/hooks/useNotifications';
import { useFinances } from '@/src/hooks/useFinances';
import { useTasks } from '@/src/hooks/useTasks';
import { colors, createShadow } from '@/src/styles/sharedStyles';
import { getDisplayName } from '@/src/utils/userUtils';
import { parseISOPreservingTime, formatLocalDate, formatTime } from '@/src/utils/dateUtils';
import TaskItem from '@/components/TaskItem';
import NotificationCenter from '@/components/NotificationCenter';
import { Task } from '@/src/models/task.model';
import api from '@/src/services/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Função para navegar com timeout
const navigateWithTimeout = (mainRoute: string, detailRoute?: string) => {
  router.push(mainRoute as any);
  
  if (detailRoute) {
    setTimeout(() => {
      router.push(detailRoute as any);
    }, 100); // 100ms de delay para garantir que a primeira navegação seja concluída
  }
};

// Componente simples para exibir um evento (não usa o EventItem completo)
const SimpleEventCard = ({ 
  title, 
  date, 
  onPress 
}: { 
  title: string; 
  date: string; 
  onPress: () => void;
}) => {
  const eventDate = parseISOPreservingTime(date);
  
  return (
    <TouchableOpacity 
      style={styles.simpleEventCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.eventDateBadge}>
        <Text style={styles.eventDateText}>
          {eventDate.getDate()}
        </Text>
        <Text style={styles.eventMonthText}>
          {formatLocalDate(eventDate, 'MMM')}
        </Text>
      </View>
      <View style={styles.eventDetails}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.eventTime}>
          {formatTime(eventDate)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ADB5BD" />
    </TouchableOpacity>
  );
};

const HomeScreen = () => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Estado local para armazenar a URL da imagem de perfil
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(user?.profilePictureUrl || null);
  
  // Atualiza a URL da imagem de perfil quando o usuário ou sua URL muda
  useEffect(() => {
    if (user?.profilePictureUrl) {
      setProfileImageUrl(user.profilePictureUrl);
    }
  }, [user, user?.profilePictureUrl]);
  
  // Usar o hook useHome para centralizar a lógica
  const { 
    userTasks,
    loadingTasks,
    tasksError,
    upcomingEvents,
    loadingEvents,
    eventsError,
    refreshData: refreshHomeData,
    refreshEvents,
  } = useHome();
  
  // Usar hooks adicionais para ampliar funcionalidades
  const { 
    fetchNotifications, 
    unreadCount, 
    markAsRead 
  } = useNotifications();
  
  const { completeTask } = useTasks();
  
  // Usar useFinances para dados financeiros precisos
  const { 
    dashboardSummary,
    pendingActions,
    loadingDashboard,
    fetchDashboardData,
  } = useFinances();
  
  // Valor animado para o cabeçalho
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Calcula a altura do header baseado no scroll
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [Platform.OS === 'ios' ? 120 : 110, Platform.OS === 'ios' ? 100 : 90],
    extrapolate: 'clamp',
  });
  
  // Função para lidar com o pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    
    try {
      // Atualizar os dados da home
      await refreshHomeData();
      
      // Atualizar dados financeiros
      await fetchDashboardData();
      
      // Atualizar notificações
      await fetchNotifications();
      
      // Atualizar especificamente os eventos para garantir dados atualizados
      await refreshEvents();
      
      // Pequeno atraso para dar tempo à UI de reagir
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error) {
      console.error('Erro ao atualizar dados da home:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshHomeData, fetchDashboardData, fetchNotifications, refreshEvents]);
  
  // Função para navegar para os detalhes das tarefas
  const handleTaskPress = useCallback((taskId: number) => {
    navigateWithTimeout('/(panel)/tasks', `/(panel)/tasks/${taskId}`);
  }, []);
  
  // Controlar exibição do painel de notificações
  const toggleNotifications = useCallback(() => {
    setShowNotifications(!showNotifications);
  }, [showNotifications]);
  
  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };
  
  // Filtrar eventos para exibir apenas eventos futuros com data válida
  const filteredEvents = upcomingEvents ? upcomingEvents.filter(event => {
    if (!event.startDate) return false;
    try {
      const eventDate = parseISOPreservingTime(event.startDate);
      const now = new Date();
      return eventDate > now;
    } catch (e) {
      console.error('Erro ao analisar data do evento:', e);
      return false;
    }
  }).sort((a, b) => {
    // Ordenar por data (mais próximos primeiro)
    const dateA = parseISOPreservingTime(a.startDate);
    const dateB = parseISOPreservingTime(b.startDate);
    return dateA.getTime() - dateB.getTime();
  }) : [];
  
  // Função para lidar com a conclusão de uma tarefa
  const handleToggleStatus = useCallback(async (task: Task): Promise<void> => {
    if (task && task.id) {
      try {
        await completeTask(task.id);
        // Após concluir, atualizar as tarefas
        await refreshHomeData();
      } catch (error) {
        console.error('Erro ao alternar status da tarefa:', error);
      }
    }
  }, [completeTask, refreshHomeData]);
  
  // Atualizar notificações quando o componente for montado
  useEffect(() => {
    fetchNotifications();
    // Carregar os eventos ao iniciar o componente
    refreshEvents();
  }, [fetchNotifications, refreshEvents]);
  
  // Função para fechar centro de notificações e atualizar contagem
  const handleCloseNotifications = useCallback(() => {
    setShowNotifications(false);
    // Atualizar a contagem de notificações não lidas
    fetchNotifications();
  }, [fetchNotifications]);
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      {/* Cabeçalho Animado */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigateWithTimeout('/(panel)/settings', '/(panel)/settings/account')}
          >
            {profileImageUrl ? (
              <Image 
                source={{ uri: profileImageUrl }} 
                style={styles.profilePhoto}
              />
            ) : (
              <View style={styles.profilePhotoPlaceholder}>
                <Text style={styles.profilePhotoInitial}>
                  {getDisplayName(user, true).charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          <View style={styles.userInfoContainer}>
            <Text style={styles.greeting}>Bem-vindo,</Text>
            <Text style={styles.userName}>{getDisplayName(user)}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={toggleNotifications}
          >
            <Ionicons name="notifications" size={24} color="#7B68EE" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationCount}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      {/* Conteúdo Principal - ScrollView animada */}
      <Animated.ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: 15 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary.main]}
            tintColor={colors.primary.main}
            title="Atualizando..."
            titleColor={colors.text.secondary}
          />
        }
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Cards de Resumo */}
        <View style={styles.summaryCardsContainer}>
          <TouchableOpacity 
            style={[styles.summaryCard, {borderLeftColor: '#7B68EE'}]}
            onPress={() => navigateWithTimeout('/(panel)/tasks')}
            activeOpacity={0.7}
          >
            <View style={styles.summaryCardContent}>
              <View style={[styles.summaryIconContainer, {backgroundColor: 'rgba(123, 104, 238, 0.1)'}]}>
                <MaterialCommunityIcons name="checkbox-marked-outline" size={18} color="#7B68EE" />
              </View>
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryCount}>{userTasks?.length || 0}</Text>
                <Text style={styles.summaryLabel}>Tarefas pendentes</Text>
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.summaryCard, {borderLeftColor: '#4A90E2'}]}
            onPress={() => navigateWithTimeout('/(panel)/events')}
            activeOpacity={0.7}
          >
            <View style={styles.summaryCardContent}>
              <View style={[styles.summaryIconContainer, {backgroundColor: 'rgba(74, 144, 226, 0.1)'}]}>
                <Ionicons name="calendar" size={18} color="#4A90E2" />
              </View>
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryCount}>{filteredEvents.length}</Text>
                <Text style={styles.summaryLabel}>Próximos eventos</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Resumo Financeiro */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Resumo Financeiro</Text>
            <TouchableOpacity onPress={() => navigateWithTimeout('/(panel)/finances')}>
              <Text style={styles.sectionAction}>Ver detalhes</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.financeSummaryCard}>
            {loadingDashboard ? (
              <View style={styles.loadingSectionContainer}>
                <ActivityIndicator size="small" color={colors.primary.main} />
                <Text style={styles.loadingSectionText}>Carregando resumo...</Text>
              </View>
            ) : dashboardSummary ? (
              <View style={styles.financeSummaryContent}>
                <View>
                  <Text style={styles.balanceLabel}>Saldo Atual</Text>
                  <Text style={[
                    styles.balanceValue,
                    dashboardSummary.currentBalance >= 0 ? styles.positiveBalance : styles.negativeBalance
                  ]}>
                    {formatCurrency(dashboardSummary.currentBalance)}
                  </Text>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.financeStatsRow}>
                  <View style={styles.financeStatItem}>
                    <View style={styles.financeIconContainerRed}>
                      <Ionicons name="arrow-up" size={14} color="#fff" />
                    </View>
                    <Text style={styles.financeStatText}>Despesas</Text>
                  </View>
                  <Text style={[styles.financeStatValue, styles.expenseValue]}>
                    {formatCurrency(dashboardSummary.totalExpensesCurrentMonth || 0)}
                  </Text>
                </View>
                
                <View style={[styles.financeStatsRow, {marginTop: 10}]}>
                  <View style={styles.financeStatItem}>
                    <View style={styles.financeIconContainerGreen}>
                      <Ionicons name="arrow-down" size={14} color="#fff" />
                    </View>
                    <Text style={styles.financeStatText}>Receitas</Text>
                  </View>
                  <Text style={[styles.financeStatValue, styles.incomeValue]}>
                    {formatCurrency(dashboardSummary.totalIncomesCurrentMonth || 0)}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="wallet-outline" size={36} color={colors.primary.light} />
                <Text style={styles.emptyStateText}>
                  Sem dados financeiros disponíveis
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Seção de Tarefas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Minhas Tarefas</Text>
            <TouchableOpacity onPress={() => navigateWithTimeout('/(panel)/tasks')}>
              <Text style={styles.sectionAction}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.sectionContent}>
            {loadingTasks ? (
              <View style={styles.loadingSectionContainer}>
                <ActivityIndicator size="small" color={colors.primary.main} />
                <Text style={styles.loadingSectionText}>Carregando tarefas...</Text>
              </View>
            ) : userTasks && userTasks.length > 0 ? (
              <View style={styles.tasksList}>
                {userTasks.map(task => (
                  <TaskItem
                    key={`task-${task.id}`}
                    item={task}
                    onToggleStatus={handleToggleStatus}
                    currentUserId={user?.uid}
                    pendingTaskIds={[]}
                    onPress={handleTaskPress}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="checkbox" size={48} color={colors.primary.light} />
                <Text style={styles.emptyStateText}>
                  Você não tem tarefas pendentes
                </Text>
                <TouchableOpacity 
                  style={styles.createButton}
                  onPress={() => navigateWithTimeout('/(panel)/tasks', '/(panel)/tasks/new')}
                >
                  <Text style={styles.createButtonText}>Nova Tarefa</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        
        {/* Seção de Eventos (simplificada) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Agenda</Text>
            <TouchableOpacity onPress={() => navigateWithTimeout('/(panel)/events')}>
              <Text style={styles.sectionAction}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.simpleEventsContainer}>
            {loadingEvents ? (
              <View style={styles.loadingSectionContainer}>
                <ActivityIndicator size="small" color={colors.primary.main} />
                <Text style={styles.loadingSectionText}>Carregando eventos...</Text>
              </View>
            ) : filteredEvents && filteredEvents.length > 0 ? (
              <>
                {filteredEvents.map(event => (
                  <SimpleEventCard
                    key={`event-${event.id}`}
                    title={event.title}
                    date={event.startDate}
                    onPress={() => navigateWithTimeout('/(panel)/events', `/(panel)/events/${event.id}`)}
                  />
                ))}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar" size={48} color={colors.primary.light} />
                <Text style={styles.emptyStateText}>
                  Não há eventos programados
                </Text>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => navigateWithTimeout('/(panel)/events', '/(panel)/events/new')}
                >
                  <Text style={styles.createButtonText}>Novo Evento</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Animated.ScrollView>
      
      {/* Centro de Notificações */}
      {showNotifications && (
        <NotificationCenter 
          onClose={handleCloseNotifications}
          visible={showNotifications}
        />
      )}
      
      {/* Botão de ação flutuante (FAB) */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigateWithTimeout('/(panel)/quick-actions')}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222', // Fundo escuro como na imagem
  },
  header: {
    backgroundColor: '#2A2A2A',
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 20,
    paddingHorizontal: 20,
    paddingBottom: 0,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
    zIndex: 10,
    overflow: 'hidden',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  userInfoContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(123, 104, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error.main,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#444',
  },
  notificationCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primary.light,
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
  },
  profilePhotoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePhotoInitial: {
    color: colors.primary.main,
    fontSize: 22,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  loadingSectionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    marginHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  loadingSectionText: {
    color: '#CED4DA',
    marginTop: 10,
    fontSize: 14,
  },
  summaryCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    overflow: 'hidden',
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  summaryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  summaryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#CED4DA',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionAction: {
    fontSize: 14,
    color: colors.primary.main,
  },
  sectionContent: {
    // Padding já vem dentro dos componentes de item
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    marginHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  emptyStateText: {
    color: '#CED4DA',
    fontSize: 16,
    marginVertical: 16,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#7B68EE',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(123, 104, 238, 0.3)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  
  // Resumo financeiro
  financeSummaryCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: '#7B68EE',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  financeSummaryContent: {
    padding: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#CED4DA',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  positiveBalance: {
    color: '#4CAF50',
  },
  negativeBalance: {
    color: '#FF6347',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 16,
  },
  financeStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  financeStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  financeIconContainerRed: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6347',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  financeIconContainerGreen: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  financeStatText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  financeStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  expenseValue: {
    color: colors.error.main,
  },
  incomeValue: {
    color: colors.success.main,
  },
  
  // Eventos simplificados
  simpleEventsContainer: {
    paddingHorizontal: 16,
  },
  simpleEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  eventDateBadge: {
    width: 45,
    height: 45,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  eventDateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  eventMonthText: {
    fontSize: 12,
    color: '#4A90E2',
    textTransform: 'uppercase',
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 13,
    color: '#CED4DA',
  },
  fab: {
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
        shadowColor: 'rgba(123, 104, 238, 0.5)',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  tasksList: {
    marginHorizontal: 16,
  },
});

export default HomeScreen;