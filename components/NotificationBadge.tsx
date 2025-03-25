import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/src/styles/sharedStyles';
import notificationApiService from '@/src/services/notificationApiService';
import { useAuth } from '@/src/context/AuthContext';

interface NotificationBadgeProps {
  size?: 'small' | 'medium' | 'large';
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ size = 'medium' }) => {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();

  // Busca a contagem de notificações não lidas
  const fetchUnreadCount = async () => {
    if (!user || !user.uid) return;
    
    try {
      const unreadCount = await notificationApiService.countUnreadNotifications();
      setCount(unreadCount);
    } catch (error) {
      console.error('Erro ao buscar contagem de notificações não lidas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Atualiza a contagem de notificações quando o componente é montado
  useEffect(() => {
    fetchUnreadCount();
    
    // Intervalo para atualizações periódicas (a cada 30 segundos)
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Definir tamanhos com base na propriedade size
  const getBadgeSize = () => {
    switch (size) {
      case 'small':
        return { width: 16, height: 16, fontSize: 10 };
      case 'large':
        return { width: 24, height: 24, fontSize: 14 };
      default: // medium
        return { width: 20, height: 20, fontSize: 12 };
    }
  };
  
  const { width, height, fontSize } = getBadgeSize();
  
  // Não renderiza nada se não houver notificações não lidas ou estiver carregando
  if ((count === 0 && !loading) || !user) {
    return null;
  }
  
  return (
    <View 
      style={[
        styles.badge, 
        { width, height, borderRadius: height / 2 }
      ]}
    >
      <Text style={[styles.badgeText, { fontSize }]}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.error.main || '#FF5252',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -5,
    right: -5,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  }
});

export default NotificationBadge; 