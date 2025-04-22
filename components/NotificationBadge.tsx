import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors, createShadow } from '@/src/styles/sharedStyles';
import notificationApiService from '@/src/services/notificationApiService';
import { useAuth } from '@/src/context/AuthContext';

interface NotificationBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showPulse?: boolean;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ 
  size = 'medium',
  showPulse = true
}) => {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Busca a contagem de notificações não lidas
  const fetchUnreadCount = async () => {
    if (!user || !user.uid) return;
    
    try {
      const unreadCount = await notificationApiService.countUnreadNotifications();
      
      // Se o contador mudou para um valor maior que 0, animar a entrada
      if (unreadCount > 0 && count === 0) {
        animateBadgeEntrance();
      }
      
      setCount(unreadCount);
    } catch (error) {
      console.error('Erro ao buscar contagem de notificações não lidas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Animar entrada do badge
  const animateBadgeEntrance = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 300,
      useNativeDriver: true
    }).start(() => {
      if (showPulse) {
        startPulseAnimation();
      }
    });
  };

  // Animação de pulso para chamar atenção
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true
        }),
        // Pausa entre pulsos
        Animated.delay(2000)
      ])
    ).start();
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

  // Redefinir animação quando o contador muda para zero
  useEffect(() => {
    if (count === 0) {
      scaleAnim.setValue(0.6);
      pulseAnim.setValue(1);
    }
  }, [count]);

  // Definir tamanhos com base na propriedade size
  const getBadgeSize = () => {
    switch (size) {
      case 'small':
        return { width: 16, height: 16, fontSize: 10, top: -4, right: -4 };
      case 'large':
        return { width: 24, height: 24, fontSize: 14, top: -8, right: -8 };
      default: // medium
        return { width: 20, height: 20, fontSize: 12, top: -6, right: -6 };
    }
  };
  
  const { width, height, fontSize, top, right } = getBadgeSize();
  
  // Não renderiza nada se não houver notificações não lidas ou estiver carregando
  if ((count === 0 && !loading) || !user) {
    return null;
  }
  
  return (
    <Animated.View 
      style={[
        styles.badge, 
        { 
          width, 
          height, 
          borderRadius: height / 2,
          top,
          right,
          transform: [
            { scale: scaleAnim },
            { scale: pulseAnim }
          ]
        }
      ]}
    >
      <Text style={[styles.badgeText, { fontSize }]}>
        {count > 99 ? '99+' : count}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.error.main || '#FF5252',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    ...createShadow(2),
    elevation: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    // Adicionando sombreamento interno para efeito 3D
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  }
});

export default NotificationBadge; 