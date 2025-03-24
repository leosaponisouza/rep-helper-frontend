// components/NotificationCenter.tsx
// Um centro de notificações completo que exibe notificações do aplicativo
// e permite interagir com elas, marcá-las como lidas ou navegar para conteúdo relacionado

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
  Modal,
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, createShadow } from '@/src/styles/sharedStyles';
import { formatLocalDate } from '@/src/utils/dateUtils';

// Tipo para representar uma notificação
interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'task' | 'event' | 'finance' | 'general';
  entityId?: number | string;
  actionText?: string;
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
  notification: Notification,
  onPress: (notification: Notification) => void,
  onMarkAsRead: (id: string) => void
}) => {
  // Formatar data da notificação
  const formattedDate = formatLocalDate(notification.timestamp, "dd MMM, HH:mm");
  
  // Obter ícone com base no tipo
  const getTypeIcon = () => {
    switch (notification.type) {
      case 'task':
        return 'checkbox';
      case 'event':
        return 'calendar';
      case 'finance':
        return 'cash';
      default:
        return 'notifications';
    }
  };
  
  return (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        !notification.read && styles.unreadNotification
      ]}
      onPress={() => onPress(notification)}
    >
      <View style={styles.notificationIcon}>
        <View style={[
          styles.iconContainer,
          !notification.read && styles.unreadIconContainer,
          notification.type === 'task' && styles.taskIconContainer,
          notification.type === 'event' && styles.eventIconContainer,
          notification.type === 'finance' && styles.financeIconContainer,
        ]}>
          <Ionicons 
            name={getTypeIcon()} 
            size={22} 
            color={notification.read ? colors.text.secondary : colors.text.primary} 
          />
        </View>
      </View>
      
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text 
            style={[
              styles.notificationTitle,
              !notification.read && styles.unreadTitle
            ]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          <Text style={styles.notificationTime}>{formattedDate}</Text>
        </View>
        
        <Text 
          style={styles.notificationMessage} 
          numberOfLines={2}
        >
          {notification.message}
        </Text>
        
        {notification.actionText && (
          <View style={styles.actionContainer}>
            <Text style={styles.actionText}>
              {notification.actionText}
            </Text>
          </View>
        )}
      </View>
      
      {!notification.read && (
        <TouchableOpacity 
          style={styles.readButton}
          onPress={() => onMarkAsRead(notification.id)}
        >
          <Ionicons name="checkmark-circle" size={22} color={colors.primary.main} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

// Dados de exemplo - Em um app real, viriam de um contexto ou API
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Nova tarefa atribuída',
    message: 'Você foi designado para realizar a limpeza da cozinha esta semana.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
    read: false,
    type: 'task',
    entityId: 123,
    actionText: 'Ver tarefa'
  },
  {
    id: '2',
    title: 'Pagamento pendente',
    message: 'Há uma nova despesa de R$157,82 aguardando sua aprovação.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
    read: false,
    type: 'finance',
    entityId: 456,
    actionText: 'Revisar despesa'
  },
  {
    id: '3',
    title: 'Evento hoje',
    message: 'Não esqueça do jantar coletivo às 20:00 hoje!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 horas atrás
    read: true,
    type: 'event',
    entityId: 789
  },
  {
    id: '4',
    title: 'Atualização do app',
    message: 'Uma nova versão do aplicativo está disponível com novas funcionalidades.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrás
    read: true,
    type: 'general'
  },
  {
    id: '5',
    title: 'Tarefa concluída',
    message: 'João marcou a tarefa "Comprar produtos de limpeza" como concluída.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 dias atrás
    read: true,
    type: 'task',
    entityId: 321
  }
];

const NotificationCenter: React.FC<NotificationCenterProps> = ({ visible, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;
  const router = useRouter();
  
  // Animação de entrada
  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').width,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);
  
  // Filtrar notificações com base na tab ativa
  const filteredNotifications = activeTab === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;
  
  // Marcar notificação como lida
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };
  
  // Marcar todas como lidas
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };
  
  // Excluir todas as notificações
  const clearAllNotifications = () => {
    // No app real, você enviaria uma solicitação para a API
    // Aqui apenas simulamos o comportamento
    setNotifications([]);
  };
  
  // Navegar para o detalhe relacionado à notificação
  const handleNotificationPress = (notification: Notification) => {
    // Marcar como lida
    handleMarkAsRead(notification.id);
    
    // Fechar o painel
    onClose();
    
    // Navegar para a tela apropriada
    setTimeout(() => {
      if (notification.entityId) {
        switch (notification.type) {
          case 'task':
            router.push(`/(panel)/tasks/${notification.entityId}`);
            break;
          case 'event':
            router.push(`/(panel)/events/${notification.entityId}`);
            break;
          case 'finance':
            router.push(`/(panel)/finances/expenses/${notification.entityId}`);
            break;
          default:
            // Notificações gerais não navegam
            break;
        }
      }
    }, 300);
  };
  
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.5)" />
      
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.backdropArea} onPress={onClose} activeOpacity={1}>
          <View style={{ flex: 1 }} />
        </TouchableOpacity>
        
        <Animated.View 
          style={[
            styles.notificationsPanel,
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Notificações</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'all' && styles.activeTab]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
                Todas
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'unread' && styles.activeTab]}
              onPress={() => setActiveTab('unread')}
            >
              <Text style={[styles.tabText, activeTab === 'unread' && styles.activeTabText]}>
                Não lidas
              </Text>
              {notifications.some(n => !n.read) && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {notifications.filter(n => !n.read).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={markAllAsRead}
              disabled={!notifications.some(n => !n.read)}
            >
              <Text style={[
                styles.actionText, 
                !notifications.some(n => !n.read) && styles.disabledActionText
              ]}>
                Marcar todas como lidas
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={clearAllNotifications}
              disabled={notifications.length === 0}
            >
              <Text style={[
                styles.actionText, 
                notifications.length === 0 && styles.disabledActionText
              ]}>
                Limpar tudo
              </Text>
            </TouchableOpacity>
          </View>
          
          {filteredNotifications.length > 0 ? (
            <FlatList
              data={filteredNotifications}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <NotificationItem
                  notification={item}
                  onPress={handleNotificationPress}
                  onMarkAsRead={handleMarkAsRead}
                />
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.notificationsList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={60} color={colors.text.tertiary} />
              <Text style={styles.emptyText}>
                {activeTab === 'all'
                  ? 'Você não tem notificações'
                  : 'Não há notificações não lidas'}
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdropArea: {
    flex: 1,
  },
  notificationsPanel: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: colors.background.secondary,
    height: '100%',
    alignSelf: 'flex-end',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
    marginTop: Platform.OS === 'ios' ? 50 : 0,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 5,
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary.light,
  },
  tabText: {
    color: colors.text.secondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary.main,
    fontWeight: 'bold',
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  actionButton: {
    padding: 5,
  },
  actionText: {
    color: colors.primary.main,
    fontSize: 14,
  },
  disabledActionText: {
    color: colors.text.tertiary,
  },
  notificationsList: {
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  unreadNotification: {
    backgroundColor: colors.primary.light + '15', // 15% opacity
  },
  notificationIcon: {
    marginRight: 12,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadIconContainer: {
    backgroundColor: colors.background.primary,
  },
  taskIconContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)', // Verde com opacidade
  },
  eventIconContainer: {
    backgroundColor: 'rgba(123, 104, 238, 0.2)', // Roxo com opacidade
  },
  financeIconContainer: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)', // Amarelo com opacidade
  },
  notificationContent: {
    flex: 1,
    marginRight: 10,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.secondary,
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  actionContainer: {
    marginTop: 8,
  },
  actionText: {
    color: colors.primary.main,
    fontSize: 14,
    fontWeight: '500',
  },
  readButton: {
    padding: 6,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: colors.text.tertiary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default NotificationCenter;