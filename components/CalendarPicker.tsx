import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CalendarService } from '../src/services/calendar/calendarService';
import * as Calendar from 'expo-calendar';

interface CalendarPickerProps {
  onSelect: (calendarId: string, calendarSource?: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  onSelect,
  isVisible,
  onClose
}) => {
  const [calendars, setCalendars] = useState<Calendar.Calendar[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar calendários disponíveis
  useEffect(() => {
    const loadCalendars = async () => {
      try {
        setLoading(true);
        const availableCalendars = await CalendarService.listAvailableCalendars();
        // Filtrar apenas calendários que permitem modificações
        const writableCalendars = availableCalendars.filter(cal => cal.allowsModifications);
        // Ordenar calendários (Samsung primeiro, depois Google, depois outros)
        const sortedCalendars = writableCalendars.sort((a, b) => {
          // Samsung primeiro
          if (a.source.name.includes('Samsung') && !b.source.name.includes('Samsung')) return -1;
          if (!a.source.name.includes('Samsung') && b.source.name.includes('Samsung')) return 1;
          // Google depois
          if (a.source.name === 'Google' && b.source.name !== 'Google') return -1;
          if (a.source.name !== 'Google' && b.source.name === 'Google') return 1;
          // Ordem alfabética para os demais
          return a.title.localeCompare(b.title);
        });
        setCalendars(sortedCalendars);
      } catch (error) {
        console.error('Erro ao carregar calendários:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isVisible) {
      loadCalendars();
    }
  }, [isVisible]);

  // Obter ícone apropriado para o tipo de calendário
  const getCalendarIcon = (calendar: Calendar.Calendar) => {
    if (calendar.source.name.includes('Samsung')) {
      return <Ionicons name="calendar" size={24} color="#1A73E8" />;
    } else if (calendar.source.name === 'Google') {
      return <Ionicons name="logo-google" size={24} color="#DB4437" />;
    } else {
      return <Ionicons name="calendar-outline" size={24} color="#7B68EE" />;
    }
  };

  // Função para formatar o nome do calendário
  const formatCalendarInfo = (calendar: Calendar.Calendar) => {
    let sourceName = calendar.source.name;
    let calendarName = calendar.name || calendar.title;
    
    if (calendar.source.name.includes('Samsung')) {
      sourceName = 'Samsung Calendar';
    } else if (calendar.source.name === 'Google' || calendar.source.name.includes('Google')) {
      sourceName = 'Google Calendar';
    }
    
    // Se o nome do calendário é igual ao nome da fonte, mostrar apenas um
    if (calendarName === sourceName) {
      return calendarName;
    }
    
    return `${calendarName} (${sourceName})`;
  };

  // Renderizar um item de calendário
  const renderCalendarItem = ({ item }: { item: Calendar.Calendar }) => (
    <TouchableOpacity
      style={styles.calendarItem}
      onPress={() => {
        onSelect(item.id, item.source.name);
        onClose();
      }}
      activeOpacity={0.7}
    >
      <View style={styles.calendarIconContainer}>
        {getCalendarIcon(item)}
        <View 
          style={[
            styles.calendarColorDot, 
            { backgroundColor: item.color || '#7B68EE' }
          ]}
        />
      </View>
      <View style={styles.calendarInfo}>
        <Text style={styles.calendarName}>{item.title || item.name || 'Calendário'}</Text>
        <Text style={styles.calendarSource}>
          {formatCalendarInfo(item)}
          {(item as any).isLocalAccount && " • Local"}
          {(item as any).isMainCalendar && " • Principal"}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#aaa" />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar Calendário</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#7B68EE" />
              <Text style={styles.loadingText}>Carregando calendários...</Text>
            </View>
          ) : calendars.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>
                Nenhum calendário disponível encontrado
              </Text>
              <Text style={styles.emptySubtext}>
                Verifique se você tem o Samsung Calendar ou Google Calendar instalado
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.instructionText}>
                Escolha um calendário para adicionar seus eventos
              </Text>
              <FlatList
                data={calendars}
                renderItem={renderCalendarItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#333',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#aaa',
    marginTop: 12,
    fontSize: 16,
  },
  instructionText: {
    color: '#aaa',
    padding: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#aaa',
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#666',
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  listContainer: {
    padding: 8,
  },
  calendarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  calendarIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  calendarColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    bottom: 0,
    right: -5,
  },
  calendarInfo: {
    flex: 1,
  },
  calendarName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  calendarSource: {
    fontSize: 14,
    color: '#aaa',
  },
}); 