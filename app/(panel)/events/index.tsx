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
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import EventsList from './events-list';
import CalendarScreen from './calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constantes para armazenamento
const EVENTS_ACTIVE_TAB_KEY = 'events_active_tab';
const EVENTS_ACTIVE_FILTER_KEY = 'events_active_filter';

// Definição de tipos para as tabs e filtros
type TabType = 'list' | 'calendar';
type FilterType = 'all' | 'upcoming' | 'today' | 'confirmed' | 'invited' | 'past';

// Definição dos filtros
const EVENT_FILTERS: Array<{key: FilterType, label: string}> = [
  { key: 'all', label: 'Todos' },
  { key: 'upcoming', label: 'Próximos' },
  { key: 'today', label: 'Hoje' },
  { key: 'confirmed', label: 'Confirmados' },
  { key: 'invited', label: 'Convites' },
  { key: 'past', label: 'Passados' }
];

// Valor padrão para filtro inicial (hoje em vez de todos)
const DEFAULT_FILTER = 'today';

// Interface para as props do componente de filtros
interface FiltersComponentProps {
  activeTab: TabType;
  activeFilter: FilterType;
  handleFilterChange: (filter: FilterType) => void;
}

// Componente para os filtros extraído para fora do componente principal
const FiltersComponent = React.memo(({ activeTab, activeFilter, handleFilterChange }: FiltersComponentProps) => {
  if (activeTab !== 'list') return null;
  
  return (
    <View style={styles.filtersSection}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
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
    </View>
  );
});

const EventsTabsScreen = () => {
  // Estados principais
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [activeFilter, setActiveFilter] = useState<FilterType>(DEFAULT_FILTER as FilterType);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Refs para controle de renderização
  const isInitialMount = useRef(true);
  const previousTab = useRef<TabType>(activeTab);
  const previousFilter = useRef<FilterType>(activeFilter);
  
  const router = useRouter();

  // Carregar configurações salvas - apenas uma vez na montagem
  useEffect(() => {
    const loadLastActiveSettings = async () => {
      try {
        const [savedTab, savedFilter] = await Promise.all([
          AsyncStorage.getItem(EVENTS_ACTIVE_TAB_KEY),
          AsyncStorage.getItem(EVENTS_ACTIVE_FILTER_KEY)
        ]);

        // Aplicar valores salvos se existirem
        if (savedTab && (savedTab === 'list' || savedTab === 'calendar')) {
          setActiveTab(savedTab as TabType);
          previousTab.current = savedTab as TabType;
        }

        if (savedFilter && EVENT_FILTERS.some(f => f.key === savedFilter)) {
          setActiveFilter(savedFilter as FilterType);
          previousFilter.current = savedFilter as FilterType;
        }
      } catch (error) {
        console.error('Error loading active settings:', error);
      } finally {
        setInitialLoading(false);
        isInitialMount.current = false;
      }
    };
    
    loadLastActiveSettings();
  }, []);

  // Efeito para salvar mudanças de tab no AsyncStorage
  useEffect(() => {
    // Não fazemos nada durante o carregamento inicial
    if (isInitialMount.current) return;
    
    // Só salvamos se o valor realmente mudou
    if (previousTab.current !== activeTab) {
      AsyncStorage.setItem(EVENTS_ACTIVE_TAB_KEY, activeTab)
        .catch(error => console.error('Error saving active tab:', error));
      
      previousTab.current = activeTab;
    }
  }, [activeTab]);

  // Efeito para salvar mudanças de filtro no AsyncStorage
  useEffect(() => {
    // Não fazemos nada durante o carregamento inicial
    if (isInitialMount.current) return;
    
    // Só salvamos se o valor realmente mudou
    if (previousFilter.current !== activeFilter) {
      AsyncStorage.setItem(EVENTS_ACTIVE_FILTER_KEY, activeFilter)
        .catch(error => console.error('Error saving active filter:', error));
      
      previousFilter.current = activeFilter;
    }
  }, [activeFilter]);

  // Handlers para mudança de tab e filtro - agora sem async/await
  const handleTabChange = useCallback((tab: TabType) => {
    if (tab === activeTab) return; // Evita re-renders desnecessários
    setActiveTab(tab);
  }, [activeTab]);

  const handleFilterChange = useCallback((filter: FilterType) => {
    if (filter === activeFilter) return; // Evita re-renders desnecessários
    setActiveFilter(filter);
  }, [activeFilter]);

  // Navegação para criação de evento
  const navigateToCreateEvent = useCallback(() => {
    router.push('/(panel)/events/create');
  }, [router]);

  // Componente para o conteúdo
  const renderContent = useCallback(() => {
    if (activeTab === 'calendar') {
      return <CalendarScreen />;
    } else {
      return <EventsList key={`events-list-${activeFilter}`} initialFilter={activeFilter} />;
    }
  }, [activeTab, activeFilter]);

  // Tela de loading
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

  // Tela principal
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Eventos</Text>
      </View>
      
      {/* Tabs de navegação (estilo finanças) */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'list' && styles.activeTab]}
          onPress={() => handleTabChange('list')}
        >
          <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>
            Lista
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
          onPress={() => handleTabChange('calendar')}
        >
          <Text style={[styles.tabText, activeTab === 'calendar' && styles.activeTabText]}>
            Calendário
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Filtros (apenas para a tab lista) */}
      <FiltersComponent 
        activeTab={activeTab} 
        activeFilter={activeFilter} 
        handleFilterChange={handleFilterChange} 
      />
      
      {/* Conteúdo da Tab Ativa */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
      
      {/* Botão de criar evento */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={navigateToCreateEvent}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Estilo de tabs (similar ao finances)
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#7B68EE',
  },
  tabText: {
    color: '#aaa',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#7B68EE',
    fontWeight: 'bold',
  },
  // Filtros
  filtersSection: {
    backgroundColor: '#2A2A2A',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#444',
  },
  activeFilterButton: {
    backgroundColor: '#7B68EE',
    borderColor: '#7B68EE',
  },
  filterText: {
    color: '#aaa',
    fontSize: 14,
  },
  activeFilterText: {
    color: '#fff',
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