// src/styles/sharedStyles.ts
import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

/**
 * Estilos compartilhados para uso em toda a aplicação
 * Implementa o tema escuro e a identidade visual consistente do app
 */
export const sharedStyles = StyleSheet.create({
  // Containers principais
  safeArea: {
    flex: 1,
    backgroundColor: '#222',
  },
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#222',
    padding: 20,
  },

  // Headers
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerBackButton: {
    marginRight: 15,
    padding: 5,
  },
  headerActionButton: {
    padding: 8,
  },

  // Cards e items
  card: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  // Textos
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  text: {
    color: '#fff',
    fontSize: 16,
  },
  secondaryText: {
    color: '#ccc',
    fontSize: 14,
  },
  infoText: {
    color: '#aaa',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    marginTop: 8,
  },

  // Inputs e Forms
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#fff',
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
    height: 56,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  inputFocused: {
    borderColor: '#7B68EE',
    backgroundColor: '#393939',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: '100%',
  },
  textArea: {
    textAlignVertical: 'top',
    paddingTop: 12,
    minHeight: 120,
  },
  textAreaContainer: {
    height: 120,
    alignItems: 'flex-start',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },

  // Buttons
  button: {
    flexDirection: 'row',
    backgroundColor: '#7B68EE',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#7B68EE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  buttonSecondary: {
    backgroundColor: 'rgba(123, 104, 238, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(123, 104, 238, 0.3)',
  },
  buttonDanger: {
    backgroundColor: '#FF6347',
    borderWidth: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextSecondary: {
    color: '#7B68EE',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonDisabled: {
    backgroundColor: '#5a5a5a',
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7B68EE',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#7B68EE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  // Badges e Chips
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  confirmedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  confirmedText: {
    color: '#4CAF50',
  },
  pendingBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
  },
  pendingText: {
    color: '#FFC107',
  },
  cancelledBadge: {
    backgroundColor: 'rgba(255, 99, 71, 0.2)',
  },
  cancelledText: {
    color: '#FF6347',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#444',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
  },
  chipSelected: {
    backgroundColor: 'rgba(123, 104, 238, 0.2)',
  },
  chipText: {
    color: '#ccc',
    fontSize: 14,
  },
  chipTextSelected: {
    color: '#7B68EE',
    fontWeight: 'bold',
  },

  // Layouts de calendário
  calendarContainer: {
    backgroundColor: '#333',
    borderRadius: 12,
    margin: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'capitalize',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  calendarDay: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 20,
  },
  calendarDayText: {
    color: '#fff',
    fontSize: 16,
  },
  calendarDaySelected: {
    backgroundColor: '#7B68EE',
  },

  // Estados de UI
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
    padding: 20,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },

  // Utilidades diversas
  divider: {
    height: 1,
    backgroundColor: '#444',
    marginVertical: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  flexCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mt8: { marginTop: 8 },
  mt16: { marginTop: 16 },
  mb8: { marginBottom: 8 },
  mb16: { marginBottom: 16 },
  ml8: { marginLeft: 8 },
  mr8: { marginRight: 8 },
  p16: { padding: 16 },
});

/**
 * Tema para o componente Calendar do react-native-calendars
 */
export const calendarTheme = {
  backgroundColor: '#333',
  calendarBackground: '#333',
  textSectionTitleColor: '#7B68EE',
  selectedDayBackgroundColor: '#7B68EE',
  selectedDayTextColor: '#ffffff',
  todayTextColor: '#7B68EE',
  todayBackgroundColor: 'rgba(123, 104, 238, 0.1)',
  dayTextColor: '#ffffff',
  textDisabledColor: '#666',
  dotColor: '#7B68EE',
  selectedDotColor: '#ffffff',
  arrowColor: '#7B68EE',
  disabledArrowColor: '#666',
  monthTextColor: '#ffffff',
  indicatorColor: '#7B68EE',
  textDayFontWeight: '400',
  textMonthFontWeight: 'bold',
  textDayHeaderFontWeight: '500',
  textDayFontSize: 16,
  textMonthFontSize: 18,
  textDayHeaderFontSize: 14
};

/**
 * Cores principais do app para fácil referência
 */
export const colors = {
  background: {
    primary: '#222',
    secondary: '#333',
    tertiary: '#444'
  },
  text: {
    primary: '#fff',
    secondary: '#ccc',
    tertiary: '#aaa',
    disabled: '#666'
  },
  primary: {
    main: '#7B68EE',
    light: 'rgba(123, 104, 238, 0.2)',
    dark: '#6A5ACD'
  },
  success: {
    main: '#4CAF50',
    light: 'rgba(76, 175, 80, 0.2)',
    dark: '#388E3C'
  },
  warning: {
    main: '#FFC107',
    light: 'rgba(255, 193, 7, 0.2)',
    dark: '#FFA000'
  },
  error: {
    main: '#FF6347',
    light: 'rgba(255, 99, 71, 0.2)',
    dark: '#E53935'
  },
  grey: {
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121'
  }
};

/**
 * Função para criar sombras consistentes
 */
export const createShadow = (elevation: number = 2, color: string = '#000') => {
  return Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: elevation },
      shadowOpacity: elevation * 0.08,
      shadowRadius: elevation * 0.8,
    },
    android: {
      elevation: elevation,
    },
    default: {}
  });
};

/**
 * Espaçamento consistente
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};

export default {
  sharedStyles,
  calendarTheme,
  colors,
  createShadow,
  spacing
};