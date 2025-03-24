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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, createShadow } from '@/src/styles/sharedStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const insets = useSafeAreaInsets();
  
  // Configurações baseadas no tipo de notificação
  const getTypeConfig = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          color: '#4CAF50', // Verde
          background: 'rgba(76, 175, 80, 0.1)'
        };
      case 'error':
        return {
          icon: 'alert-circle',
          color: '#FF6347', // Vermelho
          background: 'rgba(255, 99, 71, 0.1)'
        };
      case 'warning':
        return {
          icon: 'warning',
          color: '#FFC107', // Amarelo
          background: 'rgba(255, 193, 7, 0.1)'
        };
      case 'info':
      default:
        return {
          icon: 'information-circle',
          color: '#7B68EE', // Roxo (cor primária)
          background: 'rgba(123, 104, 238, 0.1)'
        };
    }
  };
  
  const typeConfig = getTypeConfig(notification.type);
  
  // Mostrar a notificação com animação
  const showNotification = () => {
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
      }),
    ]).start();
  };
  
  // Esconder a notificação com animação
  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
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
      }, notification.duration || 3000);
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
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: typeConfig.background,
          borderLeftColor: typeConfig.color,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
          marginTop: insets.top + 10
        },
      ]}
    >
      <TouchableOpacity 
        style={styles.content}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={[styles.iconContainer, { backgroundColor: typeConfig.color }]}>
          <Ionicons name={typeConfig.icon as any} size={22} color="#fff" />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
          <Text style={styles.message} numberOfLines={2}>{notification.message}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => hideNotification()}
        >
          <Ionicons name="close" size={18} color={colors.text.tertiary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '92%',
    alignSelf: 'center',
    borderRadius: 12,
    borderLeftWidth: 4,
    overflow: 'hidden',
    zIndex: 9999,
    ...createShadow(5),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  closeButton: {
    padding: 6,
  },
});

export default NotificationToast;