// components/EventItemSkeleton.tsx
import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface EventItemSkeletonProps {
  count?: number;
}

const EventItemSkeleton: React.FC<EventItemSkeletonProps> = ({ count = 3 }) => {
  // Criar array com base na contagem desejada
  const items = Array(count).fill(0);
  
  // Animação de pulso para efeito de carregamento
  const fadeAnim = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    // Criar animação de pulso
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const renderItem = (index: number) => (
    <Animated.View 
      key={`skeleton-${index}`} 
      style={[styles.item, { opacity: fadeAnim }]}
    >
      <View style={styles.itemContent}>
        <View style={styles.leftSide}>
          <View style={styles.colorStrip}>
            <LinearGradient
              colors={['#7B68EE', '#6A5ACD']}
              style={{ flex: 1, borderRadius: 4 }}
            />
          </View>
          <View style={styles.textContainer}>
            {/* Header com horário e status */}
            <View style={styles.eventHeader}>
              <View style={styles.timeSkeleton} />
              {index % 2 === 0 && (
                <View style={styles.statusBadge} />
              )}
            </View>
            
            {/* Título */}
            <View style={styles.titleSkeleton} />
            
            {/* Localização */}
            <View style={styles.locationRow}>
              <View style={styles.locationIcon} />
              <View style={styles.locationSkeleton} />
            </View>
            
            {/* Footer com participantes */}
            <View style={styles.eventFooter}>
              <View style={styles.attendeesRow}>
                <View style={styles.attendeesIcon} />
                <View style={styles.attendeesSkeleton} />
              </View>
              
              <View style={styles.avatarsRow}>
                {[0, 1, 2].slice(0, Math.floor(Math.random() * 3) + 1).map((_, i) => (
                  <View 
                    key={`avatar-${i}`} 
                    style={[styles.avatarSkeleton, { marginLeft: i > 0 ? -6 : 0 }]} 
                  />
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {items.map((_, index) => renderItem(index))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    marginTop: 4,
  },
  item: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#7B68EE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemContent: {
    flexDirection: 'row',
  },
  leftSide: {
    flexDirection: 'row',
    flex: 1,
  },
  colorStrip: {
    width: 8,
    marginRight: 12,
    borderRadius: 4,
    height: '100%',
    opacity: 0, // Oculto porque já temos a borda esquerda
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeSkeleton: {
    height: 12,
    width: 80,
    backgroundColor: '#444',
    borderRadius: 3,
  },
  statusBadge: {
    height: 18,
    width: 60,
    backgroundColor: '#555',
    borderRadius: 4,
  },
  titleSkeleton: {
    height: 18,
    width: '75%',
    backgroundColor: '#444',
    borderRadius: 4,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIcon: {
    height: 14,
    width: 14,
    backgroundColor: '#444',
    borderRadius: 7,
    marginRight: 8,
  },
  locationSkeleton: {
    height: 12,
    width: '60%',
    backgroundColor: '#444',
    borderRadius: 3,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeesIcon: {
    height: 14,
    width: 14,
    backgroundColor: '#444',
    borderRadius: 7,
    marginRight: 8,
  },
  attendeesSkeleton: {
    height: 12,
    width: 70,
    backgroundColor: '#444',
    borderRadius: 3,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSkeleton: {
    height: 26,
    width: 26,
    backgroundColor: '#555',
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#2A2A2A',
  },
});

export default EventItemSkeleton;