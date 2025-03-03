// app/(panel)/events/index.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar 
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import EventsList from './events-list';
import CalendarScreen from './calendar';

const EventsTabsScreen = () => {
  const [activeTab, setActiveTab] = useState('list'); // 'list' ou 'calendar'
  const router = useRouter();
  const pathname = usePathname();

  const renderTabContent = () => {
    if (activeTab === 'calendar') {
      return <CalendarScreen />;
    } else {
      return <EventsList />;
    }
  };

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
            onPress={() => setActiveTab('list')}
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
            onPress={() => setActiveTab('calendar')}
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
        onPress={() => router.push('/(panel)/events/create')}
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