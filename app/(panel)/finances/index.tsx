// app/(panel)/finances/index.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFinances } from '../../../src/hooks/useFinances';

// Componentes
import FinancialSummary from '../../../components/Finances/FinancialSummary';
import MonthlyChart from '../../../components/Finances/MonthlyChart';
import PendingActions from '../../../components/Finances/PendingActions';
import ExpenseFilters from '../../../components/Finances/ExpenseFilters';

const FinancesDashboardScreen = () => {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    dashboardSummary,
    monthlyData,
    categoryExpenses,
    pendingActions,
    loadingDashboard,
    dashboardError,
    refreshFinancialData
  } = useFinances();

  // Filtros disponíveis para navegação direta
  const expenseFilters = [
    { key: 'ALL', label: 'Todas' },
    { key: 'PENDING', label: 'Pendentes' },
    { key: 'APPROVED', label: 'Aprovadas' },
    { key: 'REIMBURSED', label: 'Reembolsadas' }
  ];

  // Ação de refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshFinancialData();
    setRefreshing(false);
  };

  // Navegação
  const navigateToExpenses = (filter = 'ALL') => {
    router.push(`/(panel)/finances/expenses?filter=${filter}`);
  };

  const navigateToIncomes = () => {
    router.push('/(panel)/finances/incomes');
  };

  const navigateToExpenseDetails = (id: number) => {
    router.push(`/(panel)/finances/expenses/${id}`);
  };

  const navigateToCreateExpense = () => {
    router.push('/(panel)/finances/expenses/create');
  };

  const navigateToCreateIncome = () => {
    router.push('/(panel)/finances/incomes/create');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Finanças</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={navigateToCreateExpense}
          >
            <Ionicons name="add-circle-outline" size={24} color="#7B68EE" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#7B68EE']}
            tintColor={'#7B68EE'}
          />
        }
      >
        {/* Resumo Financeiro */}
        <FinancialSummary
          currentBalance={dashboardSummary?.currentBalance || 0}
          pendingExpenses={dashboardSummary?.pendingExpenses || 0}
          approvedExpenses={dashboardSummary?.approvedExpenses || 0}
          totalIncomes={dashboardSummary?.totalIncomes || 0}
          loading={loadingDashboard}
          error={dashboardError}
          onRetry={handleRefresh}
          onPressBalance={() => {}}
          onPressExpenses={() => navigateToExpenses()}
          onPressIncomes={() => navigateToIncomes()}
        />
        
        {/* Filtros de Navegação Rápida */}
        <View style={styles.filtersSection}>
          <Text style={styles.sectionTitle}>Filtrar Despesas</Text>
          <ExpenseFilters
            filters={expenseFilters}
            activeFilter="ALL"
            onFilterChange={(filter) => navigateToExpenses(filter)}
          />
        </View>
        
        {/* Ações Rápidas */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.expenseButton]}
            onPress={navigateToCreateExpense}
          >
            <Ionicons name="cash-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Nova Despesa</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.incomeButton]}
            onPress={navigateToCreateIncome}
          >
            <Ionicons name="trending-up" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Nova Receita</Text>
          </TouchableOpacity>
        </View>
        
        {/* Gráfico Mensal */}
        <MonthlyChart 
          data={monthlyData}
          title="Movimentação Financeira Mensal"
        />
        
        {/* Ações Pendentes */}
        <PendingActions
          actions={pendingActions}
          loading={loadingDashboard}
          error={dashboardError}
          onRetry={handleRefresh}
          onPressAction={(action) => navigateToExpenseDetails(action.id)}
          onPressViewAll={() => navigateToExpenses('PENDING')}
        />
      </ScrollView>
      
      {/* Botão de ação flutuante */}
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
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  contentContainer: {
    paddingBottom: 30,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    padding: 8,
  },
  filtersSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 6,
  },
  expenseButton: {
    backgroundColor: '#FF6347',
  },
  incomeButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
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

export default FinancesDashboardScreen;