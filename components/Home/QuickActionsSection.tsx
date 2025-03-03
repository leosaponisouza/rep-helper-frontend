// components/Home/QuickActionsSection.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  bgColor: string;
  onPress: () => void;
}

interface QuickActionsSectionProps {
  actions: QuickAction[];
}

const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({ actions }) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name="flash" size={20} color="#7B68EE" />
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        </View>
      </View>
      
      <View style={styles.quickActionsContainer}>
        {actions.map(action => (
          <TouchableOpacity 
            key={action.id}
            style={[styles.quickActionButton, { backgroundColor: action.bgColor }]}
            onPress={action.onPress}
          >
            <MaterialCommunityIcons 
              name={action.icon as any} 
              size={28} 
              color={action.color} 
            />
            <Text style={[styles.quickActionText, { color: action.color }]}>
              {action.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
    backgroundColor: 'transparent',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '31%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1, // Forçar formato quadrado
  },
  quickActionText: {
    fontWeight: '600',
    marginTop: 8,
    fontSize: 13,
    textAlign: 'center',
  },
});

export default QuickActionsSection;