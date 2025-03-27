import { Platform } from 'react-native';

export const createShadow = (elevation: number = 2, color: string = '#000') => {
  if (Platform.OS === 'ios') {
    return {
      shadowColor: color,
      shadowOffset: {
        width: 0,
        height: elevation * 0.5,
      },
      shadowOpacity: elevation * 0.1,
      shadowRadius: elevation * 1.5,
    };
  }

  return {
    elevation: elevation * 1.5,
  };
}; 