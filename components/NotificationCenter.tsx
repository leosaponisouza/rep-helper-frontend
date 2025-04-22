// components/NotificationCenter.tsx
// Um centro de notificações completo que exibe notificações do aplicativo
// e permite interagir com elas, marcá-las como lidas ou navegar para conteúdo relacionado

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Modal,
  StatusBar,
  Platform,
  ActivityIndicator,
  ScrollView,
  RefreshControl
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, createShadow } from '@/src/styles/sharedStyles';
import { formatLocalDate, getRelativeTime } from '@/src/utils/dateUtils';
import { useNotifications, Notification, NotificationType } from '@/src/hooks/useNotifications';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedView, Animated } from '@/src/utils/animationCompat';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { RectButton } from 'react-native-gesture-handler';

// Para compatibilidade com tipos adicionais vindos da API
type NotificationWithRawType = Omit<Notification, 'type'> & {
  type: string;
}

// Props para o componente NotificationCenter
interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
}

// Componente para item de notificação
const NotificationItem = ({ 
  notification, 
  onPress, 
  onMarkAsRead 
}: { 
  notification: NotificationWithRawType,
  onPress: (notification: NotificationWithRawType) => void,
  onMarkAsRead: (id: string) => void
}) => {
  const swipeableRef = useRef<Swipeable>(null);
  
  // Formatar data da notificação
  const formattedDate = formatLocalDate(notification.timestamp, "dd MMM, HH:mm");
  const relativeTime = getRelativeTime(notification.timestamp);
  
  // Obter ícone com base no tipo
  const getTypeIcon = () => {
    const entityType = notification.entityType?.toLowerCase() || '';
    
    if (entityType === 'tasks') {
      return 'checkbox-marked-outline';
    } else if (entityType === 'events') {
      return 'calendar-month';
    } else if (entityType === 'expenses') {
      return 'cash-multiple';
    } else if (entityType === 'incomes') {
      return 'cash-plus';
    } else {
      return 'bell-outline';
    }
  };
  
  // Cor com base no tipo
  const getTypeColor = () => {
    const entityType = notification.entityType?.toLowerCase() || '';
    
    if (entityType === 'tasks') {
      return '#4CAF50';
    } else if (entityType === 'events') {
      return '#FF9800';
    } else if (entityType === 'expenses') {
      return '#FF5252';
    } else if (entityType === 'incomes') {
      return '#4CAF50';
    } else {
      return colors.primary.main;
    }
  };
  
  // Obter um nome mais amigável para o tipo de notificação
  const getFriendlyTypeName = () => {
    const type = notification.type;
    
    if (type === 'TASK_ASSIGNED') return 'Tarefa atribuída';
    if (type === 'TASK_COMPLETED') return 'Tarefa concluída';
    if (type === 'EXPENSE_CREATED') return 'Despesa criada';
    if (type === 'EXPENSE_ADDED') return 'Despesa adicionada';
    if (type === 'EXPENSE_APPROVED') return 'Despesa aprovada';
    if (type === 'EXPENSE_REIMBURSED') return 'Despesa reembolsada';
    
    // Fallback para outros tipos não mapeados explicitamente
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };
  
  // Texto de destino
  const getDestinationText = () => {
    if (!notification.entityId || !notification.entityType) return null;
    
    // Verificar o tipo de entidade
    const entityType = notification.entityType.toLowerCase();
    
    if (entityType === 'task') {
      return "Ver tarefa";
    } else if (entityType === 'events') {
      return "Ver evento";
    } else if (entityType === 'expenses') {
      return "Ver despesa";
    } else if (entityType === 'incomes') {
      return "Ver receita";
    } else {
      return "Ver detalhes";
    }
  };
  
  const renderRightActions = () => {
    return (
      <RectButton
        style={[styles.swipeAction, { backgroundColor: colors.primary.main }]}
        onPress={() => {
          onMarkAsRead(notification.id);
          if (swipeableRef.current) {
            swipeableRef.current.close();
          }
        }}
      >
        <MaterialCommunityIcons name="check" size={28} color="#fff" />
        <Text style={styles.swipeActionText}>Lida</Text>
      </RectButton>
    );
  };
  
  const typeColor = getTypeColor();
  const destinationText = getDestinationText();
  
  return (
    <Swipeable
      ref={swipeableRef}
      enabled={!notification.read}
      renderRightActions={!notification.read ? renderRightActions : undefined}
      friction={2}
      overshootRight={false}
    >
      <AnimatedView
        style={[
          styles.notificationItem,
          !notification.read && styles.unreadNotification
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onPress(notification)}
          disabled={!notification.entityId}
        >
          <LinearGradient
            colors={!notification.read ? 
              ['rgba(123, 104, 238, 0.05)', 'rgba(123, 104, 238, 0.08)'] : 
              ['#252525', '#222']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.notificationGradient}
          >
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <View style={styles.titleRow}>
                  <View style={[
                    styles.iconContainer,
                    { backgroundColor: `${typeColor}20` }
                  ]}>
                    <MaterialCommunityIcons 
                      name={getTypeIcon()} 
                      size={22} 
                      color={typeColor} 
                    />
                  </View>
                  
                  <Text 
                    style={[
                      styles.notificationTitle,
                      !notification.read && styles.unreadTitle
                    ]}
                    numberOfLines={1}
                  >
                    {notification.title}
                  </Text>
                </View>
                
                <View style={styles.timeRow}>
                  <Text style={styles.notificationTime}>{relativeTime}</Text>
                  {!notification.read && (
                    <View style={styles.unreadDot} />
                  )}
                </View>
              </View>
              
              <View style={styles.typeContainer}>
                <Text style={[styles.typeText, { color: typeColor }]}>
                  {getFriendlyTypeName()}
                </Text>
              </View>
              
              <Text 
                style={styles.notificationMessage} 
                numberOfLines={2}
              >
                {notification.message}
              </Text>
              
              <View style={styles.actionRow}>
                {notification.entityId && (
                  <View style={styles.entityIdContainer}>
                    <Text style={styles.entityIdText}>
                      ID: {notification.entityId}
                    </Text>
                  </View>
                )}
                
                <View style={styles.buttonsContainer}>
                  {destinationText && (
                    <TouchableOpacity 
                      style={[styles.viewButton, { backgroundColor: `${typeColor}15` }]}
                      onPress={() => onPress(notification)}
                    >
                      <Text style={[styles.viewButtonText, { color: typeColor }]}>
                        {destinationText}
                      </Text>
                      <MaterialCommunityIcons name="arrow-right" size={16} color={typeColor} />
                    </TouchableOpacity>
                  )}
                  
                  {!notification.read && (
                    <TouchableOpacity 
                      style={styles.readButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        onMarkAsRead(notification.id);
                      }}
                    >
                      <MaterialCommunityIcons name="check-circle-outline" size={20} color={colors.text.secondary} />
                      <Text style={styles.readButtonText}>Marcar como lida</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </AnimatedView>
    </Swipeable>
  );
};

const NotificationCenter: React.FC<NotificationCenterProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState<NotificationType>('unread');
  const [refreshing, setRefreshing] = useState(false);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  
  // Usar o hook de notificações
  const { 
    notifications, 
    unreadCount, 
    loading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();
  
  // Animação de entrada
  useEffect(() => {
    if (visible) {
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
        })
      ]).start();
      
      // Carregar notificações quando o centro é aberto
      fetchNotifications(activeTab);
    } else {
      // A animação de saída será feita no onClose
    }
  }, [visible, slideAnim, opacityAnim, activeTab, fetchNotifications]);
  
  // Efeito para recarregar notificações quando a tab muda
  useEffect(() => {
    if (visible) {
      fetchNotifications(activeTab);
    }
  }, [activeTab, visible, fetchNotifications]);
  
  // Marcar notificação como lida
  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };
  
  // Marcar todas como lidas
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };
  
  // Manipular clique em uma notificação
  const handleNotificationPress = async (notification: NotificationWithRawType) => {
    // Marcar como lida
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Navegar com base no tipo de entidade e ID
    if (notification.entityId && notification.entityType) {
      // Fechar o painel de notificações primeiro
      onClose();
      
      // Definir rotas principais e específicas
      let mainRoute = '';
      let detailRoute = '';
      
      if (notification.entityType === 'task') {
        mainRoute = '/(panel)/tasks';
        detailRoute = `/(panel)/tasks/${notification.entityId}`;
      } else if (notification.entityType === 'event') {
        mainRoute = '/(panel)/events';
        detailRoute = `/(panel)/events/${notification.entityId}`;
      } else if (notification.entityType === 'expense') {
        mainRoute = '/(panel)/finances/expenses';
        detailRoute = `/(panel)/finances/expenses/${notification.entityId}`;
      } else if (notification.entityType === 'income') {
        mainRoute = '/(panel)/finances/incomes';
        detailRoute = `/(panel)/finances/incomes/${notification.entityId}`;
      }
      
      // Navegar para a tela principal primeiro
      if (mainRoute) {
        router.push(mainRoute as any);
        
        // Depois de um curto delay, navegar para a tela específica
        setTimeout(() => {
          router.push(detailRoute as any);
        }, 100); // 100ms de delay para garantir que a primeira navegação seja concluída
      }
      
      return; // Retornar mais cedo, pois já chamamos onClose()
    }
    
    // Fechar o painel de notificações se não houver navegação
    onClose();
  };
  
  // Função para fechar com animação
  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').width,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => {
      onClose();
    });
  };
  
  // Função para atualizar
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications(activeTab);
    setRefreshing(false);
  };
  
  // Renderizar conteúdo vazio
  const renderEmptyContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.emptyText}>Carregando notificações...</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons 
          name={activeTab === 'unread' ? "bell-check-outline" : "bell-off-outline"} 
          size={64} 
          color={colors.text.tertiary} 
        />
        <Text style={styles.emptyTitle}>
          {activeTab === 'unread' ? 'Sem notificações não lidas' : 'Nenhuma notificação'}
        </Text>
        <Text style={styles.emptyText}>
          {activeTab === 'unread' 
            ? 'Você não tem notificações não lidas'
            : 'Você não tem notificações para visualizar'}
        </Text>
        
        {activeTab === 'unread' && (
          <TouchableOpacity 
            style={styles.emptyActionButton}
            onPress={() => setActiveTab('all')}
          >
            <Text style={styles.emptyActionButtonText}>Ver todas as notificações</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="rgba(0,0,0,0.5)" 
      />
      
      <Animated.View 
        style={[
          styles.modalOverlay,
          { opacity: opacityAnim }
        ]}
      >
        <TouchableOpacity 
          style={styles.dismissArea}
          activeOpacity={1}
          onPress={handleClose}
        />
        
        <Animated.View 
          style={[
            styles.container,
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          {/* Cabeçalho */}
          <LinearGradient
            colors={['#1a1a1a', '#222']}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Notificações</Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <MaterialCommunityIcons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {/* Contador de não lidas */}
            {unreadCount > 0 && (
              <View style={styles.unreadCountContainer}>
                <MaterialCommunityIcons name="bell-badge" size={16} color={colors.primary.main} />
                <Text style={styles.unreadCountText}>
                  {unreadCount} {unreadCount === 1 ? 'notificação não lida' : 'notificações não lidas'}
                </Text>
              </View>
            )}
            
            {/* Abas */}
            <View style={styles.tabs}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'unread' && styles.activeTab]}
                onPress={() => setActiveTab('unread')}
              >
                <Text 
                  style={[
                    styles.tabText, 
                    activeTab === 'unread' && styles.activeTabText
                  ]}
                >
                  Não lidas
                </Text>
                {activeTab === 'unread' && <View style={styles.activeTabIndicator} />}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'all' && styles.activeTab]}
                onPress={() => setActiveTab('all')}
              >
                <Text 
                  style={[
                    styles.tabText, 
                    activeTab === 'all' && styles.activeTabText
                  ]}
                >
                  Todas
                </Text>
                {activeTab === 'all' && <View style={styles.activeTabIndicator} />}
              </TouchableOpacity>
            </View>
          </LinearGradient>
          
          {/* Ações */}
          {notifications.some(n => !n.read) && (
            <View style={styles.actions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleMarkAllAsRead}
              >
                <MaterialCommunityIcons 
                  name="check-all" 
                  size={20} 
                  color={colors.primary.main} 
                />
                <Text style={styles.actionButtonText}>
                  Marcar todas como lidas
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Lista de notificações */}
          {notifications.length === 0 ? (
            renderEmptyContent()
          ) : (
            <ScrollView
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[colors.primary.main]}
                  tintColor={colors.primary.main}
                  title="Atualizando..."
                  titleColor={colors.text.secondary}
                />
              }
            >
              {(notifications as NotificationWithRawType[]).map(item => (
                <NotificationItem
                  key={item.id}
                  notification={item}
                  onPress={handleNotificationPress}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
              
              {notifications.length > 0 && (
                <Text style={styles.endOfListText}>
                  {activeTab === 'unread' 
                    ? 'Sem mais notificações não lidas' 
                    : 'Fim das notificações'}
                </Text>
              )}
            </ScrollView>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// Estilos para o componente
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  dismissArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '90%',
    maxWidth: 450,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    overflow: 'hidden',
    ...createShadow(15),
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  unreadCountContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
    padding: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadCountText: {
    color: colors.primary.main,
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 8,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    backgroundColor: 'transparent',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: colors.primary.main,
    borderRadius: 1.5,
  },
  tabText: {
    fontSize: 15,
    color: '#aaa',
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary.main,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 15,
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(123, 104, 238, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  actionButtonText: {
    fontSize: 14,
    color: colors.primary.main,
    marginLeft: 8,
    fontWeight: '500',
  },
  disabledText: {
    color: '#666',
  },
  listContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  notificationItem: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    ...createShadow(5),
  },
  notificationGradient: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary.main,
  },
  notificationContent: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary.main,
    marginLeft: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 16,
    color: '#ddd',
    fontWeight: '500',
    flex: 1,
  },
  unreadTitle: {
    color: '#fff',
    fontWeight: 'bold',
  },
  notificationTime: {
    fontSize: 12,
    color: '#888',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 21,
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },
  readButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  readButtonText: {
    fontSize: 13,
    color: colors.text.secondary,
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  emptyActionButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
    borderRadius: 20,
  },
  emptyActionButtonText: {
    color: colors.primary.main,
    fontWeight: '600',
    fontSize: 14,
  },
  entityIdContainer: {
    padding: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  entityIdText: {
    fontSize: 12,
    color: '#aaa',
  },
  typeContainer: {
    marginBottom: 10,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  swipeAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    backgroundColor: colors.primary.main,
  },
  swipeActionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginTop: 4,
  },
  endOfListText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 13,
    marginTop: 10,
    marginBottom: 20,
    fontStyle: 'italic',
  },
});

export default NotificationCenter;