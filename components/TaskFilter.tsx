// src/components/TaskFilter.tsx
import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView 
} from 'react-native';

export interface FilterOption {
  key: string;
  label: string;
}

interface TaskFilterProps {
  filters: FilterOption[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const TaskFilter: React.FC<TaskFilterProps> = ({ 
  filters, 
  activeFilter, 
  onFilterChange 
}) => {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.filterButton,
            activeFilter === filter.key && styles.activeFilterButton
          ]}
          onPress={() => onFilterChange(filter.key)}
        >
          <Text 
            style={[
              styles.filterButtonText,
              activeFilter === filter.key && styles.activeFilterButtonText
            ]}
          >
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
    marginBottom: 10,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#444',
  },
  activeFilterButton: {
    backgroundColor: '#7B68EE',
    borderColor: '#7B68EE',
  },
  filterButtonText: {
    color: '#aaa',
    fontSize: 14,
  },
  activeFilterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default TaskFilter;