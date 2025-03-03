// app/(panel)/events/index.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import EventsList from './events-list';
import CalendarScreen from './calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// Constantes para armazenamento
const EVENTS_ACTIVE_TAB_KEY = 'events_active_tab';
const EVENTS_ACTIVE_FILTER_KEY = 'events_active_filter';

// Definição dos filtros
const EVENT_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'upcoming', label: 'Próximos' },
  { key: 'today', label: 'Hoje' },
  { key: 'confirmed', label: 'Confirmados' },
  { key: 'invited', label: 'Convites' },
  { key: 'past', label: 'Passados' }
];

const EventsTabsScreen = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [activeFilter, setActiveFilter] = useState('all');
  const [initialLoading, setInitialLoading] = useState(true);
  const router = useRouter();
  const scrollViewRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Carregar configurações salvas
  useEffect(() => {
    const loadLastActiveSettings = async () => {
      try {
        const savedTab = await AsyncStorage.getItem(EVENTS_ACTIVE_TAB_KEY);
        const savedFilter = await AsyncStorage.getItem(EVENTS_ACTIVE_FILTER_KEY);

        if (savedTab && (savedTab === 'list' || savedTab === 'calendar')) {
          setActiveTab(savedTab);
        }

        if (savedFilter) {
          setActiveFilter(savedFilter);
        }
      } catch (error) {
        console.error('Error loading active settings:', error);
      } finally {
        setInitialLoading(false);
      }
    };
    
    loadLastActiveSettings();
  }, []);

  // Handlers para mudança de tab e filtro
  const handleTabChange = useCallback(async (tab: string) => {
    setActiveTab(tab);
    
    try {
      await AsyncStorage.setItem(EVENTS_ACTIVE_TAB_KEY, tab);
    } catch (error) {
      console.error('Error saving active tab:', error);
    }
  }, []);

  const handleFilterChange = useCallback(async (filter: string) => {
    setActiveFilter(filter);
    
    try {
      await AsyncStorage.setItem(EVENTS_ACTIVE_FILTER_KEY, filter);
    } catch (error) {
      console.error('Error saving active filter:', error);
    }
  }, []);

  // Navegação para criação de evento
  const navigateToCreateEvent = useCallback(() => {
    router.push('/(panel)/events/create');
  }, [router]);

  // Renderizar conteúdo da tab ativa
  const renderTabContent = () => {
    if (activeTab === 'calendar') {
      return <CalendarScreen />;
    } else {
      return <EventsList initialFilter={activeFilter} />;
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#222" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B68EE" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Eventos</Text>
        <View style={styles.tabsContainer}>
          <View style={styles.tabRowContainer}>
            {/* Tabs */}
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'list' && styles.activeTabButton
              ]}
              onPress={() => handleTabChange('list')}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'list' }}
              accessibilityLabel="Lista de eventos"
            >
              <Ionicons 
                name="list" 
                size={20} 
                color={activeTab === 'list' ? '#7B68EE' : '#aaa'} 
              />
              <Text style={[
                styles.tabText,
                activeTab === 'list' && styles.activeTabText
              ]}>
                Lista
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'calendar' && styles.activeTabButton
              ]}
              onPress={() => handleTabChange('calendar')}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'calendar' }}
              accessibilityLabel="Calendário de eventos"
            >
              <Ionicons 
                name="calendar" 
                size={20} 
                color={activeTab === 'calendar' ? '#7B68EE' : '#aaa'} 
              />
              <Text style={[
                styles.tabText,
                activeTab === 'calendar' && styles.activeTabText
              ]}>
                Calendário
              </Text>
            </TouchableOpacity>
          </View>

          {/* Filters (only show when in list tab) */}
          {activeTab === 'list' && (
            <View style={styles.filtersWrapper}>
              <TouchableOpacity 
                style={styles.scrollButton} 
              >
                <Ionicons name="chevron-back" size={20} color="#7B68EE" />
              </TouchableOpacity>
              
              <ScrollView 
                ref={scrollViewRef}
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersContainer}
                snapToInterval={120}
                decelerationRate="fast"
                scrollEventThrottle={16}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                  { useNativeDriver: false }
                )}
              >
                {EVENT_FILTERS.map((filter) => (
                  <TouchableOpacity
                    key={filter.key}
                    style={[
                      styles.filterButton,
                      activeFilter === filter.key && styles.activeFilterButton
                    ]}
                    onPress={() => handleFilterChange(filter.key)}
                  >
                    <Text style={[
                      styles.filterText,
                      activeFilter === filter.key && styles.activeFilterText
                    ]}>
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <TouchableOpacity 
                style={styles.scrollButton} 
              >
                <Ionicons name="chevron-forward" size={20} color="#7B68EE" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      
      {/* Conteúdo da Tab Ativa */}
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>
      
      {/* Botão de criar evento */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={navigateToCreateEvent}
        accessibilityRole="button"
        accessibilityLabel="Criar novo evento"
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#222',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  tabsContainer: {
    borderRadius: 12,
    backgroundColor: '#444',
    padding: 4,
    marginBottom: 8,
  },
  tabRowContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  activeTabButton: {
    backgroundColor: '#333',
  },
  tabText: {
    color: '#aaa',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#7B68EE',
    fontWeight: 'bold',
  },
  filtersWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  scrollButton: {
    paddingHorizontal: 10,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(123, 104, 238, 0.3)',
  },
  activeFilterButton: {
    backgroundColor: 'rgba(123, 104, 238, 0.2)',
    borderColor: '#7B68EE',
  },
  filterText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#7B68EE',
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#222',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7B68EE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7B68EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});

export default EventsTabsScreen;