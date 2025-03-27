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
  Platform
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
      <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
    </TouchableOpacity>
  );
};

const HomeScreen = () => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Estado local para armazenar a URL da imagem de perfil
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(user?.profilePictureUrl || null);
  
  // Estado para armazenar o nome da república
  const [republicName, setRepublicName] = useState<string>('Sua República');
  const [loadingRepublic, setLoadingRepublic] = useState<boolean>(false);

  // Atualiza a URL da imagem de perfil quando o usuário ou sua URL muda
  useEffect(() => {
    if (user?.profilePictureUrl) {
      setProfileImageUrl(user.profilePictureUrl);
    }
  }, [user, user?.profilePictureUrl]);
  
  // Buscar dados da república
  const fetchRepublicData = useCallback(async () => {
    if (!user?.currentRepublicId) return;

    try {
      setLoadingRepublic(true);
      const response = await api.get(`/api/v1/republics/${user.currentRepublicId}`);
      if (response.data && response.data.name) {
        setRepublicName(response.data.name);
      }
    } catch (error) {
      console.error('Erro ao buscar dados da república:', error);
    } finally {
      setLoadingRepublic(false);
    }
  }, [user?.currentRepublicId]);
  
  // Buscar dados da república quando o componente for montado ou o ID da república mudar
  useEffect(() => {
    fetchRepublicData();
  }, [fetchRepublicData]);
  
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
  
  // Animar altura do cabeçalho ao rolar
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [180, 100],
    extrapolate: 'clamp'
  });
  
  // Animar opacidade do conteúdo do cabeçalho
  const headerContentOpacity = scrollY.interpolate({
    inputRange: [0, 60, 100],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp'
  });
  
  // Função para lidar com o pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    
    try {
      // Atualizar os dados da home
      await refreshHomeData();
      
      // Buscar dados da república
      await fetchRepublicData();
      
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
  }, [refreshHomeData, fetchDashboardData, fetchNotifications, refreshEvents, fetchRepublicData]);
  
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
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>Olá,</Text>
            <Text style={styles.userName}>{getDisplayName(user)}</Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={toggleNotifications}
            >
              <Ionicons name="notifications" size={24} color={colors.primary.main} />
              {/* Badge de notificação somente se houver notificações não lidas */}
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationCount}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            
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
          </View>
        </View>
        
        <Animated.View style={[styles.republicInfo, { opacity: headerContentOpacity }]}>
          <View style={styles.republicNameContainer}>
            {loadingRepublic ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={[styles.republicName, { marginLeft: 8 }]}>
                  Carregando...
                </Text>
              </View>
            ) : user?.currentRepublicId ? (
              <>
                <MaterialCommunityIcons name="home-group" size={18} color="#fff" />
                <Text style={[styles.republicName, { marginLeft: 8 }]}>
                  {republicName}
                </Text>
              </>
            ) : (
              <Text style={styles.republicName}>Bem-vindo</Text>
            )}
          </View>
          <Text style={styles.lastUpdated}>
            Deslize para atualizar os dados
          </Text>
        </Animated.View>
      </Animated.View>
      
      {/* Conteúdo Principal - ScrollView animada */}
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
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
            style={[styles.summaryCard, styles.primaryCard]}
            onPress={() => navigateWithTimeout('/(panel)/tasks')}
          >
            <View style={styles.summaryCardContent}>
              <View style={styles.summaryIconContainer}>
                <Ionicons name="checkmark-circle-outline" size={28} color="#fff" />
              </View>
              <Text style={styles.summaryTitle}>Tarefas</Text>
              <Text style={styles.summaryValue}>
                {userTasks?.length || 0}
              </Text>
              <Text style={styles.summaryLabel}>pendentes</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.summaryCard, styles.secondaryCard]}
            onPress={() => navigateWithTimeout('/(panel)/events')}
          >
            <View style={styles.summaryCardContent}>
              <View style={styles.summaryIconContainer}>
                <Ionicons name="calendar-outline" size={28} color="#fff" />
              </View>
              <Text style={styles.summaryTitle}>Eventos</Text>
              <Text style={styles.summaryValue}>
                {filteredEvents.length}
              </Text>
              <Text style={styles.summaryLabel}>próximos</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Resumo Financeiro */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Resumo Financeiro mensal</Text>
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
              <>
                <View style={styles.balanceRow}>
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
                    <Text style={styles.financeStatValue}>
                      {formatCurrency(dashboardSummary.totalExpensesCurrentMonth || 0)}
                    </Text>
                    <Text style={styles.financeStatLabel}>Despesas</Text>
                  </View>
                  
                  <View style={styles.financeStatItem}>
                    <Text style={styles.financeStatValue}>
                      {formatCurrency(dashboardSummary.totalIncomesCurrentMonth || 0)}
                    </Text>
                    <Text style={styles.financeStatLabel}>Receitas</Text>
                  </View>
                  
                  <View style={styles.financeStatItem}>
                    <Text style={styles.financeStatValue}>
                      {formatCurrency(dashboardSummary.pendingExpensesAmount || 0)}
                    </Text>
                    <Text style={styles.financeStatLabel}>Pendentes</Text>
                  </View>
                </View>
                
                {pendingActions && pendingActions.length > 0 && (
                  <TouchableOpacity
                    style={styles.pendingActionsButton}
                    onPress={() => navigateWithTimeout('/(panel)/finances')}
                  >
                    <Ionicons name="alert-circle-outline" size={18} color={colors.warning.main} />
                    <Text style={styles.pendingActionsText}>
                      {pendingActions.length} ação(ões) pendente(s)
                    </Text>
                  </TouchableOpacity>
                )}
              </>
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
                  <Text style={styles.createButtonText}>Criar Tarefa</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        
        {/* Seção de Eventos (simplificada) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Próximos Eventos</Text>
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
              filteredEvents.map(event => (
                <SimpleEventCard
                  key={`event-${event.id}`}
                  title={event.title}
                  date={event.startDate}
                  onPress={() => navigateWithTimeout('/(panel)/events', `/(panel)/events/${event.id}`)}
                />
              ))
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
                  <Text style={styles.createButtonText}>Criar Evento</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {filteredEvents && filteredEvents.length > 0 && (
              <TouchableOpacity
                style={styles.createEventButton}
                onPress={() => navigateWithTimeout('/(panel)/events', '/(panel)/events/new')}
              >
                <Ionicons name="add-circle-outline" size={24} color={colors.primary.main} />
                <Text style={styles.createEventButtonText}>Criar Novo Evento</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Dicas e Informações */}
        <View style={styles.tipsContainer}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb-outline" size={20} color={colors.primary.main} />
            <Text style={styles.tipTitle}>Dica rápida</Text>
          </View>
          <Text style={styles.tipText}>
            Atribua tarefas para outros moradores utilizando o botão de 
            "Atribuir usuário" ao criar ou editar uma tarefa.
          </Text>
        </View>
        
        {/* Espaço extra no final para scroll */}
        <View style={styles.bottomSpacing} />
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
    backgroundColor: colors.background.primary,
  },
  header: {
    backgroundColor: colors.background.secondary,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 20,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...createShadow(5),
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    borderColor: colors.background.tertiary,
  },
  notificationCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  republicNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  republicInfo: {
    padding: 16,
    paddingTop: 0,
  },
  republicName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 2,
  },
  lastUpdated: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    color: colors.text.secondary,
    marginTop: 16,
    fontSize: 16,
  },
  loadingSectionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
  },
  loadingSectionText: {
    color: colors.text.secondary,
    marginTop: 10,
    fontSize: 14,
  },
  summaryCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  summaryCard: {
    width: '48%',
    minHeight: 140,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    overflow: 'hidden',
    ...createShadow(4),
  },
  primaryCard: {
    backgroundColor: colors.primary.main,
  },
  secondaryCard: {
    backgroundColor: '#4A90E2', // Azul
  },
  tertiaryCard: {
    backgroundColor: '#50C878', // Verde
  },
  summaryCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  summaryIconContainer: {
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
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
    color: colors.text.primary,
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
    padding: 40,
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    marginHorizontal: 16,
    ...createShadow(2),
  },
  emptyStateText: {
    color: colors.text.secondary,
    fontSize: 16,
    marginVertical: 16,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    ...createShadow(2),
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  
  // Resumo financeiro
  financeSummaryCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    ...createShadow(2),
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  positiveBalance: {
    color: colors.success.main,
  },
  negativeBalance: {
    color: colors.error.main,
  },
  divider: {
    height: 1,
    backgroundColor: colors.background.tertiary,
    marginBottom: 16,
  },
  financeStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  financeStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  financeStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  financeStatLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  pendingActionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 8,
  },
  pendingActionsText: {
    marginLeft: 8,
    color: colors.warning.main,
    fontWeight: '500',
  },
  
  // Eventos simplificados
  simpleEventsContainer: {
    paddingHorizontal: 16,
  },
  simpleEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    ...createShadow(2),
  },
  eventDateBadge: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventDateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary.main,
  },
  eventMonthText: {
    fontSize: 12,
    color: colors.primary.main,
    textTransform: 'uppercase',
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  createEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.light,
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
  },
  createEventButtonText: {
    color: colors.primary.main,
    fontWeight: '500',
    marginLeft: 8,
  },
  
  // Dicas
  tipsContainer: {
    backgroundColor: colors.primary.light,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(123, 104, 238, 0.2)',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipTitle: {
    color: colors.primary.main,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  tipText: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    ...createShadow(8, colors.primary.main),
  },
  tasksList: {
    marginHorizontal: 16,
  },
});

export default HomeScreen;