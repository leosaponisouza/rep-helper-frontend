import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import notificationApiService, { ApiNotification } from '../services/notificationApiService';

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'task' | 'event' | 'finance' | 'general';
  entityId?: number | string;
  entityType?: string;
  actionText?: string;
}

export type NotificationType = 'all' | 'unread' | 'task' | 'event' | 'finance' | 'general';

interface UseNotificationsReturnType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: (type?: NotificationType) => Promise<void>;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
}

// Mapeamento de tipos da API para tipos do componente
const mapNotificationType = (apiType: string): 'task' | 'event' | 'finance' | 'general' => {
  switch (apiType.toUpperCase()) {
    case 'TASK':
      return 'task';
    case 'EVENT':
      return 'event';
    case 'FINANCE':
      return 'finance';
    default:
      return 'general';
  }
};

// Obter texto de ação com base no tipo de notificação
const getActionTextFromType = (type: string, entityType?: string): string | undefined => {
  switch (type.toUpperCase()) {
    case 'TASK':
      return 'Ver tarefa';
    case 'EVENT':
      return 'Ver evento';
    case 'FINANCE':
      return 'Ver finança';
    default:
      return undefined;
  }
};

// Mapear notificações da API para o formato do componente
const mapApiNotifications = (apiNotifications: ApiNotification[]): Notification[] => {
  return apiNotifications.map(notification => ({
    id: notification.id.toString(),
    title: notification.title,
    message: notification.message,
    timestamp: new Date(notification.createdAt),
    read: notification.read,
    type: mapNotificationType(notification.type),
    entityId: notification.entityId,
    entityType: notification.entityType,
    actionText: getActionTextFromType(notification.type, notification.entityType)
  }));
};

export const useNotifications = (): UseNotificationsReturnType => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (type: NotificationType = 'all') => {
    if (!user?.uid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let apiNotifications: ApiNotification[] = [];
      
      switch (type) {
        case 'unread':
          apiNotifications = await notificationApiService.getUnreadNotifications();
          break;
        case 'task':
        case 'event':
        case 'finance':
        case 'general':
          // Buscar todas as notificações e filtrar pelo tipo
          const allNotifs = await notificationApiService.getNotifications();
          apiNotifications = allNotifs.filter(
            notif => mapNotificationType(notif.type) === type
          );
          break;
        default:
          apiNotifications = await notificationApiService.getNotifications();
          break;
      }
      
      setNotifications(mapApiNotifications(apiNotifications));
      
      // Atualizar contagem de não lidas
      const count = await notificationApiService.countUnreadNotifications();
      setUnreadCount(count);
    } catch (err) {
      console.error('Erro ao buscar notificações:', err);
      setError('Falha ao carregar notificações');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    try {
      const updatedNotification = await notificationApiService.markAsRead(Number(id));
      
      if (updatedNotification) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === id ? { ...notif, read: true } : notif
          )
        );
        
        // Atualizar contagem de não lidas
        setUnreadCount(prev => Math.max(0, prev - 1));
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err);
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    if (!user?.uid) return false;
    
    try {
      const success = await notificationApiService.markAllAsRead();
      
      if (success) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
        
        // Zerar contagem de não lidas
        setUnreadCount(0);
      }
      
      return success;
    } catch (err) {
      console.error('Erro ao marcar todas notificações como lidas:', err);
      return false;
    }
  }, [user?.uid]);

  // Carregar notificações iniciais e configurar polling
  useEffect(() => {
    if (user?.uid) {
      fetchNotifications();
      
      // Atualizar contagem a cada 1 minuto
      const interval = setInterval(() => {
        if (user?.uid) {
          notificationApiService.countUnreadNotifications()
            .then(setUnreadCount)
            .catch(err => console.error('Erro ao contar notificações:', err));
        }
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [user?.uid, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  };
}; 