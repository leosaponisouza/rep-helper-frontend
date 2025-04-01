import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCalendarSync } from '../src/hooks/useCalendarSync';
import { CalendarPicker } from './CalendarPicker';
import { Event } from '../src/services/events';

interface SyncCalendarButtonProps {
  type: 'all' | 'confirmed';
  style?: any;
  buttonStyle?: 'primary' | 'secondary';
  compact?: boolean; // Para controlar se é versão compacta ou não
  singleEvent?: Event; // Evento específico para sincronizar
  iconOnly?: boolean; // Exibir apenas o ícone sem fundo (para headerActions)
}

export const SyncCalendarButton: React.FC<SyncCalendarButtonProps> = ({ 
  type, 
  style,
  buttonStyle = 'primary',
  compact = false,
  singleEvent,
  iconOnly = false
}) => {
  const { 
    syncConfirmedEvents,
    syncAllEvents,
    syncEventWithCalendar,
    isLoading, 
    isCalendarPickerVisible, 
    setIsCalendarPickerVisible, 
    selectCalendar 
  } = useCalendarSync();

  // Sempre mostrar o seletor de calendário primeiro
  const handleSync = () => {
    setIsCalendarPickerVisible(true);
  };

  // Esta função será chamada quando um calendário for selecionado
  const handleCalendarSelect = (calendarId: string, calendarSource?: string) => {
    // Chamar a função selectCalendar do hook
    selectCalendar(calendarId, calendarSource);
    
    // Se temos um evento específico, sincronizamos apenas ele
    if (singleEvent) {
      syncEventWithCalendar(singleEvent);
    }
    // Caso contrário, sincronizamos com base no tipo escolhido
    else if (type === 'all') {
      syncAllEvents();
    } else {
      syncConfirmedEvents();
    }
  };

  // Se for apenas ícone, usamos um estilo diferente
  if (iconOnly) {
    return (
      <>
        <TouchableOpacity 
          onPress={handleSync} 
          disabled={isLoading}
          style={[styles.iconButton, style]}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#7B68EE" />
          ) : (
            <Ionicons name="calendar-outline" size={24} color="#7B68EE" />
          )}
        </TouchableOpacity>

        <CalendarPicker
          isVisible={isCalendarPickerVisible}
          onClose={() => setIsCalendarPickerVisible(false)}
          onSelect={handleCalendarSelect}
        />
      </>
    );
  }

  return (
    <>
      <TouchableOpacity 
        onPress={handleSync} 
        disabled={isLoading}
        style={[
          styles.button, 
          buttonStyle === 'secondary' ? styles.secondaryButton : styles.primaryButton,
          compact && styles.compactButton,
          style
        ]}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="calendar" size={22} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Sincronizar</Text>
          </>
        )}
      </TouchableOpacity>

      <CalendarPicker
        isVisible={isCalendarPickerVisible}
        onClose={() => setIsCalendarPickerVisible(false)}
        onSelect={handleCalendarSelect}
      />
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    width: '100%',
  },
  compactButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 40,
    borderRadius: 8,
  },
  iconButton: {
    padding: 8,
  },
  primaryButton: {
    backgroundColor: '#7B68EE',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  secondaryButton: {
    backgroundColor: '#555',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonIcon: {
    marginRight: 4,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
}); 