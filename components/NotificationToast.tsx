// components/NotificationToast.tsx
// Um componente para mostrar notificações toast no topo da tela
// que desaparecem automaticamente após um tempo

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Easing
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, createShadow } from '@/src/styles/sharedStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Tipos de notificações toast
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// Interface para o objeto de notificação
export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  autoHide?: boolean;
  duration?: number;
  onPress?: () => void;
}

interface NotificationToastProps {
  notification: ToastNotification;
  onDismiss: (id: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss
}) => {
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const insets = useSafeAreaInsets();
  
  // Configurações baseadas no tipo de notificação
  const getTypeConfig = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return {
          icon: 'check-circle-outline' as const,
          color: '#4CAF50', // Verde
          background: 'rgba(76, 175, 80, 0.1)',
          gradientColors: ['rgba(76, 175, 80, 0.2)', 'rgba(76, 175, 80, 0.05)'] as [string, string]
        };
      case 'error':
        return {
          icon: 'alert-circle-outline' as const,
          color: '#FF5252', // Vermelho
          background: 'rgba(255, 82, 82, 0.1)',
          gradientColors: ['rgba(255, 82, 82, 0.2)', 'rgba(255, 82, 82, 0.05)'] as [string, string]
        };
      case 'warning':
        return {
          icon: 'alert-outline' as const,
          color: '#FFC107', // Amarelo
          background: 'rgba(255, 193, 7, 0.1)',
          gradientColors: ['rgba(255, 193, 7, 0.2)', 'rgba(255, 193, 7, 0.05)'] as [string, string]
        };
      case 'info':
      default:
        return {
          icon: 'information-outline' as const,
          color: '#7B68EE', // Roxo (cor primária)
          background: 'rgba(123, 104, 238, 0.1)',
          gradientColors: ['rgba(123, 104, 238, 0.2)', 'rgba(123, 104, 238, 0.05)'] as [string, string]
        };
    }
  };
  
  const typeConfig = getTypeConfig(notification.type);
  
  // Mostrar a notificação com animação
  const showNotification = () => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
    
    // Adicionar animação de pulso para chamar atenção
    startPulseAnimation();
  };
  
  // Animação de pulso sutil para chamar atenção
  const startPulseAnimation = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.03,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      })
    ]).start();
  };
  
  // Esconder a notificação com animação
  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start(() => {
      onDismiss(notification.id);
    });
  };
  
  // Configurar timer para esconder automaticamente
  useEffect(() => {
    showNotification();
    
    if (notification.autoHide !== false) {
      timeoutRef.current = setTimeout(() => {
        hideNotification();
      }, notification.duration || 3500);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [notification]);
  
  // Função de clique
  const handlePress = () => {
    if (notification.onPress) {
      notification.onPress();
    }
    hideNotification();
  };
  
  // Calcular a largura da tela com margem
  const screenWidth = Dimensions.get('window').width;
  const toastWidth = screenWidth * 0.92;
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
            { perspective: 1000 }
          ],
          opacity: opacityAnim,
          marginTop: insets.top + 12,
          width: toastWidth,
          borderColor: typeConfig.color
        },
      ]}
    >
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <LinearGradient
          colors={typeConfig.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        >
          <TouchableOpacity 
            style={styles.content}
            onPress={handlePress}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, { backgroundColor: typeConfig.color }]}>
              <MaterialCommunityIcons name={typeConfig.icon} size={22} color="#fff" />
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
              <Text style={styles.message} numberOfLines={2}>{notification.message}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => hideNotification()}
            >
              <MaterialCommunityIcons name="close" size={18} color={colors.text.tertiary} />
            </TouchableOpacity>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: 16,
    borderLeftWidth: 4,
    overflow: 'hidden',
    zIndex: 9999,
    ...createShadow(8),
    elevation: 10,
  },
  gradientBackground: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    ...createShadow(3),
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  closeButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default NotificationToast;