// app/(panel)/finances/expenses/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFinances, ExpenseFilterType } from '../../../../src/hooks/useFinances';
import ExpenseItem from '../../../../components/Finances/ExpenseItem';
import ExpenseFilters from '../../../../components/Finances/ExpenseFilters';
import { Expense } from '../../../../src/models/finances.model';

// Define the filter option interface
interface FilterOption {
  key: ExpenseFilterType;
  label: string;
}

// The available filter options
const availableFilters: FilterOption[] = [
  { key: 'ALL', label: 'Todas' },
  { key: 'PENDING', label: 'Pendentes' },
  { key: 'APPROVED', label: 'Aprovadas' },
  { key: 'REJECTED', label: 'Rejeitadas' },
  { key: 'REIMBURSED', label: 'Reembolsadas' }
];

const ExpensesScreen = () => {
  const router = useRouter();
  const { filter: urlFilter } = useLocalSearchParams<{ filter?: string }>();
  const [refreshing, setRefreshing] = useState(false);

  // Get expenses and related functions from useFinances hook
  const {
    expenses,
    loadingExpenses,
    expensesError,
    fetchExpenses,
    applyExpenseFilter,
    expenseFilter
  } = useFinances({
    initialFilter: (urlFilter as ExpenseFilterType) || 'ALL'
  });

  // Update filter from URL
  useEffect(() => {
    if (urlFilter && urlFilter !== expenseFilter) {
      applyExpenseFilter(urlFilter as ExpenseFilterType);
    }
  }, [urlFilter, applyExpenseFilter, expenseFilter]);

  // Refresh expenses
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchExpenses();
    } catch (error) {
      console.error('Erro ao recarregar despesas:', error);
      Alert.alert('Erro', 'Não foi possível atualizar as despesas.');
    } finally {
      setRefreshing(false);
    }
  }, [fetchExpenses]);

  // Navigate to expense details
  const handleExpensePress = useCallback((expense: Expense) => {
    router.push(`/(panel)/finances/expenses/${expense.id}`);
  }, [router]);

  // Handle filter change
  const handleFilterChange = useCallback((newFilter: ExpenseFilterType) => {
    applyExpenseFilter(newFilter);
    // Update URL without reloading the page
    router.setParams({ filter: newFilter });
  }, [applyExpenseFilter, router]);

  // Navigate to create expense
  const navigateToCreateExpense = useCallback(() => {
    router.push('/(panel)/finances/expenses/create');
  }, [router]);

  // Render the empty state
  const renderEmptyState = useCallback(() => {
    if (loadingExpenses) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#7B68EE" />
          <Text style={styles.loadingText}>Carregando despesas...</Text>
        </View>
      );
    }
    
    if (expensesError) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#FF6347" />
          <Text style={styles.errorText}>{expensesError}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRefresh}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons 
          name="cash-remove" 
          size={64} 
          color="#7B68EE" 
          style={{ opacity: 0.6 }} 
        />
        <Text style={styles.emptyText}>
          Nenhuma despesa {expenseFilter !== 'ALL' ? `com status '${getStatusLabel(expenseFilter)}'` : ''}
        </Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={navigateToCreateExpense}
        >
          <Text style={styles.createButtonText}>Registrar Despesa</Text>
        </TouchableOpacity>
      </View>
    );
  }, [loadingExpenses, expensesError, expenseFilter, handleRefresh, navigateToCreateExpense]);

  // Get the status label for empty message
  const getStatusLabel = (filter: ExpenseFilterType): string => {
    const filterOption = availableFilters.find(f => f.key === filter);
    return filterOption ? filterOption.label.toLowerCase() : '';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#7B68EE" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Despesas</Text>
        
        <TouchableOpacity 
          style={styles.headerActionButton}
          onPress={navigateToCreateExpense}
        >
          <Ionicons name="add-circle-outline" size={24} color="#7B68EE" />
        </TouchableOpacity>
      </View>
      
      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ExpenseFilters
          filters={availableFilters}
          activeFilter={expenseFilter}
          onFilterChange={handleFilterChange}
        />
      </View>
      
      {/* Expenses List */}
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ExpenseItem 
            expense={item}
            onPress={() => handleExpensePress(item)}
          />
        )}
        contentContainerStyle={[
          styles.listContainer,
          expenses.length === 0 && styles.emptyListContainer
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#7B68EE']}
            tintColor={'#7B68EE'}
          />
        }
      />
      
      {/* Floating action button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={navigateToCreateExpense}
      >
        <Ionicons name="add" size={28} color="#fff" />
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActionButton: {
    padding: 8,
  },
  filtersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    backgroundColor: '#2A2A2A',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6347',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 99, 71, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 99, 71, 0.5)',
  },
  retryButtonText: {
    color: '#FF6347',
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#7B68EE',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  floatingButton: {
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

export default ExpensesScreen;