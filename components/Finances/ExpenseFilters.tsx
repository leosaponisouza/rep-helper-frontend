// components/Finances/ExpenseFilters.tsx
import React, { memo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Dimensions
} from 'react-native';
import { ExpenseFilterType } from '../../src/hooks/useFinances';
import { Ionicons } from '@expo/vector-icons';

// Define the filter option interface
interface FilterOption {
  key: ExpenseFilterType;
  label: string;
  icon?: string;  // Optional icon for each filter
}

interface ExpenseFiltersProps {
  filters: FilterOption[];
  activeFilter: ExpenseFilterType;
  onFilterChange: (filter: ExpenseFilterType) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

const ExpenseFilters: React.FC<ExpenseFiltersProps> = ({ 
  filters, 
  activeFilter, 
  onFilterChange 
}) => {
  // Get icon for filter
  const getFilterIcon = (filterKey: ExpenseFilterType): string => {
    switch (filterKey) {
      case 'ALL':
        return 'list';
      case 'PENDING':
        return 'time-outline';
      case 'APPROVED':
        return 'checkmark-circle-outline';
      case 'REJECTED':
        return 'close-circle-outline';
      case 'REIMBURSED':
        return 'cash-outline';
      default:
        return 'filter';
    }
  };

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      snapToInterval={SCREEN_WIDTH / 3} // Snap to approximately 3 items per screen
      decelerationRate="fast"
    >
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.filterButton,
            activeFilter === filter.key && styles.activeFilterButton
          ]}
          onPress={() => onFilterChange(filter.key)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={(filter.icon || getFilterIcon(filter.key)) as any} 
            size={16} 
            color={activeFilter === filter.key ? '#fff' : '#aaa'} 
            style={styles.filterIcon}
          />
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
    paddingVertical: 8
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
  filterIcon: {
    marginRight: 6,
  },
  filterButtonText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

// Use memo to prevent unnecessary re-renders
export default memo(ExpenseFilters);