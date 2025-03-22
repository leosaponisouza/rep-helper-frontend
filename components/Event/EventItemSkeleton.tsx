// components/EventItemSkeleton.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';

interface EventItemSkeletonProps {
  count?: number;
}

const EventItemSkeleton: React.FC<EventItemSkeletonProps> = ({ count = 3 }) => {
  // Criar um array com o número de skeletons desejado
  const skeletons = Array(count).fill(0);

  return (
    <View style={styles.container}>
      {skeletons.map((_, index) => (
        <View key={index} style={styles.eventItemSkeleton}>
          <View style={styles.skeletonBar} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonTime} />
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonLocation} />
            <View style={styles.skeletonAttendees} />
          </View>
          <View style={styles.skeletonBadge} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  eventItemSkeleton: {
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#555',
    height: 100,
  },
  skeletonBar: {
    width: 5,
    height: '100%',
    backgroundColor: '#444',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  skeletonContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  skeletonTime: {
    width: '30%',
    height: 14,
    backgroundColor: '#444',
    borderRadius: 7,
    marginBottom: 8,
  },
  skeletonTitle: {
    width: '90%',
    height: 16,
    backgroundColor: '#444',
    borderRadius: 8,
    marginBottom: 12,
  },
  skeletonLocation: {
    width: '60%',
    height: 14,
    backgroundColor: '#444',
    borderRadius: 7,
    marginBottom: 8,
  },
  skeletonAttendees: {
    width: '40%',
    height: 14,
    backgroundColor: '#444',
    borderRadius: 7,
  },
  skeletonBadge: {
    width: 60,
    height: 20,
    backgroundColor: '#444',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
});

export default EventItemSkeleton;