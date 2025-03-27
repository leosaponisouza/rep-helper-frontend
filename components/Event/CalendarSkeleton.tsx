// components/CalendarSkeleton.tsx
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Obter dimensões da tela
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
// Altura calculada para o container
const containerHeight = screenHeight - 120;

const CalendarSkeleton: React.FC = () => {
  const daySize = (screenWidth - 70) / 7; // Ajustado para melhor alinhamento
  
  // Array de 7 dias da semana
  const daysOfWeek = Array(7).fill(0);
  
  // Array para uma visualização mais compacta do calendário (5 semanas em vez de 6)
  const calendarDays = Array(35).fill(0);
  
  // Array para os eventos da agenda (4 eventos para usar mais espaço)
  const eventItems = Array(4).fill(0);

  return (
    <View style={[styles.container, { height: containerHeight }]}>
      {/* Parte do Calendário */}
      <View style={styles.calendarPart}>
        {/* Cabeçalho do mês */}
        <View style={styles.monthHeader}>
          <View style={styles.monthTextSkeleton} />
          <View style={styles.arrowsContainer}>
            <View style={styles.arrowSkeleton} />
            <View style={styles.arrowSkeleton} />
          </View>
        </View>
        
        {/* Dias da semana */}
        <View style={styles.daysOfWeek}>
          {daysOfWeek.map((_, index) => (
            <View key={`day-${index}`} style={styles.dayOfWeekSkeleton} />
          ))}
        </View>
        
        {/* Grade do calendário */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((_, index) => (
            <View 
              key={`cell-${index}`}
              style={[
                styles.calendarDaySkeleton,
                { width: daySize, height: daySize }
              ]}
            >
              {/* Alguns dias têm marcador de evento */}
              {index % 5 === 0 && (
                <View style={styles.eventIndicator} />
              )}
            </View>
          ))}
        </View>
      </View>
      
      {/* Parte dos Eventos */}
      <View style={styles.eventsPart}>
        {/* Cabeçalho dos eventos */}
        <View style={styles.eventsHeader}>
          <View style={styles.eventsDateSkeleton} />
        </View>
        
        {/* Lista de eventos */}
        {eventItems.map((_, index) => (
          <View key={`event-${index}`} style={styles.eventItem}>
            {/* Horário */}
            <View style={styles.eventTimeContainer}>
              <View style={styles.eventTimeSkeleton} />
            </View>
            
            {/* Conteúdo */}
            <View style={styles.eventContent}>
              {/* Título */}
              <View style={styles.eventTitleSkeleton} />
              
              {/* Local */}
              <View style={styles.eventDetailRow}>
                <View style={styles.eventDetailIconSkeleton} />
                <View style={styles.eventDetailTextSkeleton} />
              </View>
              
              {/* Participantes */}
              <View style={styles.eventDetailRow}>
                <View style={styles.eventDetailIconSkeleton} />
                <View style={styles.eventDetailTextSkeleton} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  calendarPart: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  monthTextSkeleton: {
    width: 120,
    height: 18,
    backgroundColor: '#444',
    borderRadius: 4,
  },
  arrowsContainer: {
    flexDirection: 'row',
    width: 60,
    justifyContent: 'space-between',
  },
  arrowSkeleton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#444',
  },
  daysOfWeek: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  dayOfWeekSkeleton: {
    width: 16,
    height: 14,
    backgroundColor: '#444',
    borderRadius: 4,
    opacity: 0.5,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  calendarDaySkeleton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    margin: 2,
    backgroundColor: '#333',
    position: 'relative',
  },
  eventIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#7B68EE',
    opacity: 0.7,
  },
  
  // Estilos para a parte dos eventos
  eventsPart: {
    flex: 1,
  },
  eventsHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  eventsDateSkeleton: {
    width: 150,
    height: 18,
    backgroundColor: '#444',
    borderRadius: 4,
  },
  
  // Estilos para os itens de evento
  eventItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  eventTimeContainer: {
    width: 100,
    paddingRight: 16,
  },
  eventTimeSkeleton: {
    width: 80,
    height: 16,
    backgroundColor: '#444',
    borderRadius: 4,
  },
  eventContent: {
    flex: 1,
  },
  eventTitleSkeleton: {
    width: '80%',
    height: 18,
    backgroundColor: '#444',
    borderRadius: 4,
    marginBottom: 10,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventDetailIconSkeleton: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#444',
    marginRight: 8,
  },
  eventDetailTextSkeleton: {
    width: '60%',
    height: 12,
    backgroundColor: '#444',
    borderRadius: 4,
  }
});

export default CalendarSkeleton;