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
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, createShadow } from '@/src/styles/sharedStyles';
import { formatLocalDate } from '@/src/utils/dateUtils';
import { useNotifications, Notification, NotificationType } from '@/src/hooks/useNotifications';

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

const NotificationCenter: React.FC<NotificationCenterProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState<NotificationType>('all');
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;
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
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
      
      // Carregar notificações quando o centro é aberto
      fetchNotifications(activeTab);
    } else {
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').width,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim, activeTab, fetchNotifications]);
  
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
  const handleNotificationPress = async (notification: Notification) => {
    // Marcar como lida
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Navegar com base no tipo de notificação e ID da entidade
    if (notification.entityId) {
      switch (notification.type) {
        case 'task':
          router.push(`/(panel)/tasks/${notification.entityId}`);
          break;
        case 'event':
          router.push(`/(panel)/events/${notification.entityId}`);
          break;
        case 'finance':
          // Se for de tipo específico de finança, direcionar para tela apropriada
          if (notification.entityType === 'EXPENSE') {
            router.push(`/(panel)/finances/expenses/${notification.entityId}`);
          } else if (notification.entityType === 'INCOME') {
            router.push(`/(panel)/finances/incomes/${notification.entityId}`);
          } else {
            router.push('/(panel)/finances');
          }
          break;
        default:
          // Para notificações gerais, apenas fechar o centro
          break;
      }
    }
    
    // Fechar o painel de notificações
    onClose();
  };
  
  // Renderizar conteúdo vazio
  const renderEmptyContent = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.emptyText}>Carregando notificações...</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="notifications-off" size={48} color={colors.text.tertiary} />
        <Text style={styles.emptyText}>
          {activeTab === 'unread' 
            ? 'Você não tem notificações não lidas'
            : 'Nenhuma notificação encontrada'}
        </Text>
      </View>
    );
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="rgba(0,0,0,0.5)" 
      />
      
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.container,
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          {/* Cabeçalho */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Notificações</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {/* Abas */}
            <View style={styles.tabs}>
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
              </TouchableOpacity>
              
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
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Ações */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleMarkAllAsRead}
              disabled={!notifications.some(n => !n.read)}
            >
              <Ionicons 
                name="checkmark-done-circle" 
                size={18} 
                color={!notifications.some(n => !n.read) ? '#666' : colors.primary.main} 
              />
              <Text 
                style={[
                  styles.actionButtonText,
                  !notifications.some(n => !n.read) && styles.disabledText
                ]}
              >
                Marcar todas como lidas
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Lista de notificações */}
          {notifications.length === 0 ? (
            renderEmptyContent()
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <NotificationItem
                  notification={item}
                  onPress={handleNotificationPress}
                  onMarkAsRead={handleMarkAsRead}
                />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

// Estilos para o componente
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '85%',
    backgroundColor: '#222',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight,
    paddingBottom: 0,
    backgroundColor: '#111',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 5,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary.main,
  },
  tabText: {
    fontSize: 16,
    color: '#aaa',
  },
  activeTabText: {
    color: colors.primary.main,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: colors.primary.main,
    marginLeft: 5,
  },
  disabledText: {
    color: '#666',
  },
  listContent: {
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  unreadNotification: {
    backgroundColor: 'rgba(123, 104, 238, 0.05)',
  },
  notificationIcon: {
    marginRight: 15,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadIconContainer: {
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
  },
  taskIconContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  eventIconContainer: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
  },
  financeIconContainer: {
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
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
    marginLeft: 10,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
  },
  actionContainer: {
    marginTop: 8,
  },
  actionText: {
    fontSize: 13,
    color: colors.primary.main,
    fontWeight: '500',
  },
  readButton: {
    padding: 5,
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  }
});

export default NotificationCenter;