// app/(panel)/events/index.tsx - Versão otimizada com melhor UX e performance
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Platform,
  Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EventsProvider } from '../../../src/hooks/useEvents';
import EventsListScreen from './events-list';
import CalendarScreen from './calendar';

// Componente principal de eventos com tabs
const EventsScreen: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list');
  
  // Animações para transição entre tabs
  const slideAnim = useState(new Animated.Value(0))[0];
  const listOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.3],
    extrapolate: 'clamp'
  });
  const calendarOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
    extrapolate: 'clamp'
  });
  
  // Alternar entre as tabs com animação
  const switchTab = useCallback((tab: 'list' | 'calendar') => {
    if (tab === activeTab) return;
    
    Animated.timing(slideAnim, {
      toValue: tab === 'list' ? 0 : 1,
      duration: 300,
      useNativeDriver: true
    }).start();
    
    setActiveTab(tab);
  }, [activeTab, slideAnim]);
  
  return (
    <EventsProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#222" />
        
        <View style={styles.container}>
          {/* Cabeçalho */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Eventos</Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => router.push('/(panel)/events/create')}
              accessibilityLabel="Criar evento"
              accessibilityHint="Cria um novo evento"
            >
              <Ionicons name="add-circle" size={24} color="#7B68EE" />
            </TouchableOpacity>
          </View>
          
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[
                styles.tabButton,
                activeTab === 'list' && styles.activeTabButton
              ]}
              onPress={() => switchTab('list')}
              accessibilityRole="tab"
              accessibilityLabel="Lista de eventos"
              accessibilityState={{ selected: activeTab === 'list' }}
            >
              <Animated.View style={[styles.tabContent, { opacity: listOpacity }]}>
                <Ionicons 
                  name="list" 
                  size={20} 
                  color={activeTab === 'list' ? '#7B68EE' : '#aaa'} 
                  style={styles.tabIcon}
                />
                <Text style={[
                  styles.tabText,
                  activeTab === 'list' && styles.activeTabText
                ]}>
                  Lista
                </Text>
              </Animated.View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.tabButton,
                activeTab === 'calendar' && styles.activeTabButton
              ]}
              onPress={() => switchTab('calendar')}
              accessibilityRole="tab"
              accessibilityLabel="Calendário de eventos"
              accessibilityState={{ selected: activeTab === 'calendar' }}
            >
              <Animated.View style={[styles.tabContent, { opacity: calendarOpacity }]}>
                <Ionicons 
                  name="calendar" 
                  size={20} 
                  color={activeTab === 'calendar' ? '#7B68EE' : '#aaa'} 
                  style={styles.tabIcon}
                />
                <Text style={[
                  styles.tabText,
                  activeTab === 'calendar' && styles.activeTabText
                ]}>
                  Calendário
                </Text>
              </Animated.View>
            </TouchableOpacity>
          </View>
          
          {/* Indicador de tab ativa */}
          <Animated.View 
            style={[
              styles.tabIndicator,
              {
                transform: [{
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 150]
                  })
                }]
              }
            ]}
          />
          
          {/* Conteúdo da tab ativa */}
          <View style={styles.tabContentContainer}>
            {activeTab === 'list' ? (
              <EventsListScreen />
            ) : (
              <CalendarScreen />
            )}
          </View>
        </View>
      </SafeAreaView>
    </EventsProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#222',
  },
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  createButton: {
    padding: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTabButton: {
    backgroundColor: 'transparent',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    marginRight: 8,
  },
  tabText: {
    fontSize: 16,
    color: '#aaa',
  },
  activeTabText: {
    color: '#7B68EE',
    fontWeight: 'bold',
  },
  tabIndicator: {
    position: 'absolute',
    top: 64 + 16 + 12 + 16, // header height + padding + tab padding
    left: 20,
    width: 150,
    height: 3,
    backgroundColor: '#7B68EE',
    borderRadius: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#7B68EE',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  tabContentContainer: {
    flex: 1,
  },
});

export default EventsScreen;