/**
 * animationCompat.tsx
 * 
 * Este arquivo fornece uma camada de compatibilidade para usar as animações
 * padrão do React Native (Animated) em vez do react-native-reanimated.
 * Isso permite que o aplicativo continue funcionando mesmo sem a biblioteca
 * de animações avançadas.
 */

import React from 'react';
import {
  Animated,
  View,
  FlatList,
  ScrollView,
  Text,
  Image,
  ViewProps,
  FlatListProps,
  ScrollViewProps,
  TextProps,
  ImageProps
} from 'react-native';

// Re-exportar os componentes animados padrão
export const AnimatedView = Animated.View;
export const AnimatedScrollView = Animated.ScrollView;
export const AnimatedFlatList = Animated.FlatList;
export const AnimatedText = Animated.Text;
export const AnimatedImage = Animated.Image;

// Simplificação de funções do Reanimated
export const withTiming = (
  toValue: number,
  config: { duration?: number } = {},
  callback?: () => void
) => {
  return Animated.timing(new Animated.Value(0), {
    toValue,
    duration: config.duration || 300,
    useNativeDriver: false
  });
};

export const withSpring = (
  toValue: number,
  config: { damping?: number, stiffness?: number } = {},
  callback?: () => void
) => {
  return Animated.spring(new Animated.Value(0), {
    toValue,
    damping: config.damping,
    stiffness: config.stiffness,
    useNativeDriver: false
  });
};

export const useSharedValue = (initialValue: number) => {
  const animValue = React.useRef(new Animated.Value(initialValue)).current;
  
  return {
    value: initialValue,
    setValue: (newValue: number) => {
      animValue.setValue(newValue);
    },
    addListener: (callback: (value: { value: number }) => void) => {
      return animValue.addListener((state) => callback({ value: state.value }));
    },
    removeListener: (id: string) => {
      animValue.removeListener(id);
    },
    _animatedValue: animValue
  };
};

export const createAnimatedComponent = (Component: React.ComponentType<any>) => {
  return Animated.createAnimatedComponent(Component);
};

// Interface simplificada para animações
export const runAnimation = (animation: Animated.CompositeAnimation) => {
  animation.start();
};

// Exposição do objeto Animated original para casos não cobertos
export { Animated };

// Define um componente animado padrão para casos de uso comuns
export const AnimatedComponent: React.FC<ViewProps> = (props) => {
  return <Animated.View {...props} />;
};

export default {
  View: AnimatedView,
  ScrollView: AnimatedScrollView,
  FlatList: AnimatedFlatList,
  Text: AnimatedText,
  Image: AnimatedImage,
  withTiming,
  withSpring,
  useSharedValue,
  createAnimatedComponent,
  runAnimation,
  Animated
}; 