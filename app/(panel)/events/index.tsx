// app/(panel)/events/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import EventsList from './events-list';
import CalendarScreen from './calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// Chave para armazenar a tab ativa
const EVENTS_ACTIVE_TAB_KEY = 'events_active_tab';

const EventsTabsScreen = () => {
  const [activeTab, setActiveTab] = useState('list'); // 'list' ou 'calendar'
  const [initialLoading, setInitialLoading] = useState(true);
  const router = useRouter();

  // Carregar a última tab ativa ao montar o componente
  useEffect(() => {
    const loadLastActiveTab = async () => {
      try {
        const savedTab = await AsyncStorage.getItem(EVENTS_ACTIVE_TAB_KEY);
        if (savedTab && (savedTab === 'list' || savedTab === 'calendar')) {
          setActiveTab(savedTab);
        }
      } catch (error) {
        console.error('Error loading active tab:', error);
      } finally {
        setInitialLoading(false);
      }
    };
    
    loadLastActiveTab();
  }, []);

  // Quando a tela receber foco, recarregar as preferências
  useFocusEffect(
    useCallback(() => {
      // Você pode adicionar aqui lógica adicional quando a tela receber foco
      // Por exemplo, atualizar dados de eventos se necessário
    }, [])
  );

  // Lidar com a mudança de tab e persistir a escolha
  const handleTabChange = useCallback(async (tab: string) => {
    setActiveTab(tab);
    
    // Persistir a escolha da tab para uso futuro
    try {
      await AsyncStorage.setItem(EVENTS_ACTIVE_TAB_KEY, tab);
    } catch (error) {
      console.error('Error saving active tab:', error);
    }
  }, []);

  // Função para navegar para a criação de evento
  const navigateToCreateEvent = useCallback(() => {
    router.push('/(panel)/events/create');
  }, [router]);

  // Renderiza o conteúdo da tab ativa
  const renderTabContent = () => {
    if (activeTab === 'calendar') {
      return <CalendarScreen />;
    } else {
      return <EventsList />;
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
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: '#444',
    padding: 4,
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