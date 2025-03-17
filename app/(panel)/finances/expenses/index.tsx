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
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFinances } from '../../../../src/hooks/useFinances';
import ExpenseItem from '../../../../components/Finances/ExpenseItem';
import ExpenseFilters from '../../../../components/Finances/ExpenseFilters';

const ExpensesScreen = () => {
  const router = useRouter();
  const { filter: urlFilter } = useLocalSearchParams<{ filter?: string }>();
  const [pendingExpenseIds, setPendingExpenseIds] = useState<number[]>([]);
  
  const {
    expenses,
    allExpenses,
    loadingExpenses,
    expensesError,
    fetchExpenses,
    applyExpenseFilter,
    expenseFilter
  } = useFinances({
    initialFilter: (urlFilter as any) || 'ALL'
  });

  // Atualizar filtro a partir da URL
  useEffect(() => {
    if (urlFilter && urlFilter !== expenseFilter) {
      applyExpenseFilter(urlFilter as any);
    }
  }, [urlFilter, applyExpenseFilter, expenseFilter]);

  // Configurar os filtros disponíveis
  const availableFilters = [
    { key: 'ALL', label: 'Todas' },
    { key: 'PENDING', label: 'Pendentes' },
    { key: 'APPROVED', label: 'Aprovadas' },
    { key: 'REJECTED', label: 'Rejeitadas' },
    { key: 'REIMBURSED', label: 'Reembolsadas' }
  ];

  // Função para recarregar despesas
  const handleRefresh = useCallback(async () => {
    try {
      await fetchExpenses();
      return true;
    } catch (error) {
      console.error('Erro ao recarregar despesas:', error);
      return false;
    }
  }, [fetchExpenses]);

  // Navegação para detalhes da despesa
  const handleExpensePress = (expenseId: number) => {
    router.push(`/(panel)/finances/expenses/${expenseId}`);
  };

  // Lidar com mudança de filtro
  const handleFilterChange = (newFilter: string) => {
    applyExpenseFilter(newFilter as any);
    
    // Atualiza a URL sem recarregar a página
    router.setParams({ filter: newFilter });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
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
          onPress={() => router.push('/(panel)/finances/expenses/create')}
        >
          <Ionicons name="add-circle-outline" size={24} color="#7B68EE" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.filtersContainer}>
        <ExpenseFilters
          filters={availableFilters}
          activeFilter={expenseFilter}
          onFilterChange={handleFilterChange}
        />
      </View>
      
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ExpenseItem 
            item={item}
            onPress={handleExpensePress}
            currentUserId={undefined} // Pode ser obtido do contexto de autenticação
            pendingExpenseIds={pendingExpenseIds}
          />
        )}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            {loadingExpenses ? (
              <ActivityIndicator size="large" color="#7B68EE" />
            ) : expensesError ? (
              <View>
                <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#FF6347" />
                <Text style={styles.emptyText}>{expensesError}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={handleRefresh}
                >
                  <Text style={styles.retryButtonText}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <MaterialCommunityIcons name="cash-remove" size={64} color="#7B68EE" style={{ opacity: 0.6 }} />
                <Text style={styles.emptyText}>
                  Nenhuma despesa {expenseFilter !== 'ALL' ? 'com este status' : ''}
                </Text>
                <TouchableOpacity 
                  style={styles.createButton}
                  onPress={() => router.push('/(panel)/finances/expenses/create')}
                >
                  <Text style={styles.createButtonText}>Registrar Despesa</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={loadingExpenses}
            onRefresh={handleRefresh}
            colors={['#7B68EE']}
            tintColor={'#7B68EE'}
          />
        }
      />
      
      {/* Botão flutuante para criar despesa */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => router.push('/(panel)/finances/expenses/create')}
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
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
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