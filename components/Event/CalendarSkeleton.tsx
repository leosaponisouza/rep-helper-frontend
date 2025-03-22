// components/CalendarSkeleton.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CalendarSkeleton: React.FC = () => {
  // Criar um array com 35 dias (5 semanas) para o skeleton do calendário
  const dummyDays = Array(35).fill(0);
  
  return (
    <>
      <View style={styles.daysOfWeek}>
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
          <Text key={index} style={styles.dayOfWeekText}>{day}</Text>
        ))}
      </View>
      <View style={styles.calendarGrid}>
        {dummyDays.map((_, index) => (
          <View key={index} style={styles.calendarDaySkeleton}>
            <View style={styles.dayNumberSkeleton} />
          </View>
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  daysOfWeek: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  dayOfWeekText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '500',
    width: 32,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  calendarDaySkeleton: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayNumberSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#444',
  },
});

export default CalendarSkeleton;