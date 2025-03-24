// src/context/NotificationContext.tsx
// Um contexto que gerencia as notificações em toda a aplicação
// Permite adicionar, remover e controlar notificações de qualquer componente

import React, { createContext, useContext, useReducer, ReactNode, useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import NotificationToast, { ToastNotification, NotificationType } from '@/components/NotificationToast';

// Interface para o estado do contexto
interface NotificationContextState {
  notifications: ToastNotification[];
  // Funções que compõem a API do contexto
  showNotification: (
    title: string, 
    message: string, 
    type?: NotificationType, 
    options?: Partial<ToastNotification>
  ) => string;
  hideNotification: (id: string) => void;
  clearAllNotifications: () => void;
  // Funções de conveniência (shortcuts)
  showSuccess: (title: string, message: string, options?: Partial<ToastNotification>) => string;
  showError: (title: string, message: string, options?: Partial<ToastNotification>) => string;
  showWarning: (title: string, message: string, options?: Partial<ToastNotification>) => string;
  showInfo: (title: string, message: string, options?: Partial<ToastNotification>) => string;
}

// Ações possíveis para o reducer
type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; notification: ToastNotification }
  | { type: 'REMOVE_NOTIFICATION'; id: string }
  | { type: 'CLEAR_ALL' };

// Reducer para gerenciar o estado das notificações
const notificationReducer = (
  state: ToastNotification[], 
  action: NotificationAction
): ToastNotification[] => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      // Adiciona a notificação no topo (índice 0) do array
      return [action.notification, ...state];
    case 'REMOVE_NOTIFICATION':
      // Remove a notificação com o ID específico
      return state.filter(notif => notif.id !== action.id);
    case 'CLEAR_ALL':
      // Remove todas as notificações
      return [];
    default:
      return state;
  }
};

// Cria o contexto
const NotificationContext = createContext<NotificationContextState | undefined>(undefined);

// Componente provedor do contexto
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, dispatch] = useReducer(notificationReducer, []);
  const [activeNotifications, setActiveNotifications] = useState<ToastNotification[]>([]);

  // Limita o número de notificações visíveis simultaneamente
  const MAX_VISIBLE_NOTIFICATIONS = 3;

  // Atualiza as notificações ativas quando o estado muda
  useEffect(() => {
    // Limita ao número máximo de notificações visíveis
    setActiveNotifications(notifications.slice(0, MAX_VISIBLE_NOTIFICATIONS));
  }, [notifications]);

  // Gera um ID único para cada notificação
  const generateId = (): string => {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Função para exibir uma nova notificação
  const showNotification = (
    title: string,
    message: string,
    type: NotificationType = 'info',
    options: Partial<ToastNotification> = {}
  ): string => {
    const id = options.id || generateId();
    
    const notification: ToastNotification = {
      id,
      title,
      message,
      type,
      autoHide: options.autoHide !== false,
      duration: options.duration || 3000,
      onPress: options.onPress,
    };
    
    dispatch({ type: 'ADD_NOTIFICATION', notification });
    
    return id;
  };

  // Função para esconder uma notificação específica
  const hideNotification = (id: string): void => {
    dispatch({ type: 'REMOVE_NOTIFICATION', id });
  };

  // Função para limpar todas as notificações
  const clearAllNotifications = (): void => {
    dispatch({ type: 'CLEAR_ALL' });
  };

  // Funções de conveniência
  const showSuccess = (
    title: string, 
    message: string, 
    options: Partial<ToastNotification> = {}
  ): string => {
    return showNotification(title, message, 'success', options);
  };

  const showError = (
    title: string, 
    message: string, 
    options: Partial<ToastNotification> = {}
  ): string => {
    return showNotification(title, message, 'error', options);
  };

  const showWarning = (
    title: string, 
    message: string, 
    options: Partial<ToastNotification> = {}
  ): string => {
    return showNotification(title, message, 'warning', options);
  };

  const showInfo = (
    title: string, 
    message: string, 
    options: Partial<ToastNotification> = {}
  ): string => {
    return showNotification(title, message, 'info', options);
  };

  // Calcula o deslocamento vertical para cada notificação
  const getVerticalOffset = (index: number): number => {
    return index * 85; // Ajuste este valor de acordo com a altura da sua notificação
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        hideNotification,
        clearAllNotifications,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
      
      {/* Renderiza as notificações ativas */}
      <View style={styles.notificationContainer}>
        {activeNotifications.map((notification, index) => (
          <View 
            key={notification.id} 
            style={[styles.toastContainer, { top: getVerticalOffset(index) }]}
          >
            <NotificationToast
              notification={notification}
              onDismiss={hideNotification}
            />
          </View>
        ))}
      </View>
    </NotificationContext.Provider>
  );
};

// Hook personalizado para usar o contexto
export const useNotification = (): NotificationContextState => {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  
  return context;
};

const styles = StyleSheet.create({
  notificationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  toastContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
  },
});

export default NotificationContext;