// app/(panel)/finances/index.tsx - Fix for pendingActions
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  ActivityIndicator,
  useWindowDimensions,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFinances } from '../../../src/hooks/useFinances';
import { PendingAction, Transaction } from '../../../src/models/finances.model';

// Components
import FinancialSummary from '../../../components/Finances/FinancialSummary';
import MonthlyChart from '../../../components/Finances/MonthlyChart';
import CategoryChart from '../../../components/Finances/CategoryChart';

// Types for tabs
type TabType = 'dashboard' | 'expenses' | 'incomes';

// Main component
const FinancesDashboardScreen = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  const {
    // Data
    dashboardSummary,
    monthlyData,
    categoryExpenses,
    expenses,
    incomes,
    pendingActions,
    recentTransactions,
    
    // Loading states
    loadingDashboard,
    loadingExpenses,
    loadingIncomes,
    
    // Errors
    dashboardError,
    expensesError,
    incomesError,
    
    // Actions
    refreshFinancialData
  } = useFinances();

  // Ensure pendingActions is always an array, even if the API returns undefined
  const safePendingActions = Array.isArray(pendingActions) ? pendingActions : [];

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshFinancialData();
    setRefreshing(false);
  }, [refreshFinancialData]);

  // Navigation handlers
  const navigateToExpenseDetails = useCallback((id: number) => {
    router.push(`/(panel)/finances/expenses/${id}`);
  }, [router]);

  const navigateToIncomeDetails = useCallback((id: number) => {
    router.push(`/(panel)/finances/incomes/${id}`);
  }, [router]);

  const navigateToCreateExpense = useCallback(() => {
    router.push('/(panel)/finances/expenses/create');
  }, [router]);

  const navigateToCreateIncome = useCallback(() => {
    router.push('/(panel)/finances/incomes/create');
  }, [router]);

  const navigateToExpensesList = useCallback(() => {
    router.push('/(panel)/finances/expenses');
  }, [router]);

  const navigateToIncomesList = useCallback(() => {
    router.push('/(panel)/finances/incomes');
  }, [router]);

  // Handle item press
  const handleTransactionPress = useCallback((item: Transaction) => {
    if (item.type === 'EXPENSE') {
      navigateToExpenseDetails(item.id);
    } else {
      navigateToIncomeDetails(item.id);
    }
  }, [navigateToExpenseDetails, navigateToIncomeDetails]);

  const handlePendingActionPress = useCallback((action: PendingAction) => {
    navigateToExpenseDetails(action.id);
  }, [navigateToExpenseDetails]);

  // Render dashboard section with pending actions
  const renderPendingActionsSection = () => {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ações Pendentes</Text>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={navigateToExpensesList}
          >
            <Text style={styles.viewAllButtonText}>Ver Todas</Text>
            <Ionicons name="chevron-forward" size={16} color="#7B68EE" />
          </TouchableOpacity>
        </View>
        
        {loadingDashboard ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#7B68EE" />
            <Text style={styles.loadingText}>Carregando ações pendentes...</Text>
          </View>
        ) : safePendingActions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="check-circle" size={40} color="#7B68EE" style={{ opacity: 0.6 }} />
            <Text style={styles.emptyText}>Nenhuma ação pendente</Text>
          </View>
        ) : (
          <FlatList
            data={safePendingActions.slice(0, 3)} // Show only 3 items
            keyExtractor={item => `pending-${item.id}`}
            renderItem={({ item }) => (
              <PendingActionItem 
                item={item} 
                onPress={handlePendingActionPress} 
              />
            )}
            style={styles.pendingList}
            scrollEnabled={false} // Disable scrolling inside the list
          />
        )}
      </View>
    );
  };

  // Render dashboard content
  const renderDashboardContent = () => (
    <>
      {/* Financial Summary */}
      <FinancialSummary
        currentBalance={dashboardSummary?.currentBalance ?? 0}
        pendingExpenses={dashboardSummary?.pendingExpenses ?? 0}
        approvedExpenses={dashboardSummary?.approvedExpenses ?? 0}
        totalIncomes={dashboardSummary?.totalIncomes ?? 0}
        loading={loadingDashboard}
        error={dashboardError}
        onRetry={handleRefresh}
        onPressExpenses={() => setActiveTab('expenses')}
        onPressIncomes={() => setActiveTab('incomes')}
      />
      
      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.expenseButton]}
            onPress={navigateToCreateExpense}
          >
            <Ionicons name="add-circle-outline" size={22} color="#fff" />
            <Text style={styles.actionButtonText}>Nova Despesa</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.incomeButton]}
            onPress={navigateToCreateIncome}
          >
            <Ionicons name="add-circle-outline" size={22} color="#fff" />
            <Text style={styles.actionButtonText}>Nova Receita</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Monthly Chart */}
      <MonthlyChart
        data={monthlyData || []}
        title="Movimentação Financeira"
        loading={loadingDashboard}
      />
      
      {/* Category Chart - only show if we have category data */}
      {categoryExpenses.length > 0 && (
        <CategoryChart
          data={categoryExpenses}
          title="Despesas por Categoria"
        />
      )}
      
      {/* Pending Actions */}
      {renderPendingActionsSection()}
      
      {/* Recent Transactions */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transações Recentes</Text>
          <View style={styles.viewMoreButtons}>
            <TouchableOpacity 
              style={styles.viewExpensesButton}
              onPress={navigateToExpensesList}
            >
              <Text style={styles.viewExpensesText}>Despesas</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.viewIncomesButton}
              onPress={navigateToIncomesList}
            >
              <Text style={styles.viewIncomesText}>Receitas</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {loadingDashboard ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#7B68EE" />
            <Text style={styles.loadingText}>Carregando transações...</Text>
          </View>
        ) : (!recentTransactions || recentTransactions.length === 0) ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="cash-register" size={40} color="#7B68EE" style={{ opacity: 0.6 }} />
            <Text style={styles.emptyText}>Nenhuma transação recente</Text>
          </View>
        ) : (
          <FlatList
            data={recentTransactions.slice(0, 5)} // Show only 5 transactions
            keyExtractor={item => `transaction-${item.id}`}
            renderItem={({ item }) => (
              <TransactionItem 
                item={item} 
                onPress={handleTransactionPress} 
              />
            )}
            style={styles.transactionsList}
            scrollEnabled={false} // Disable scrolling inside the list
          />
        )}
      </View>
    </>
  );

  /* Other render methods and component definitions... */

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Finanças</Text>
      </View>
      
      {/* Navigation tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>
            Visão Geral
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
          onPress={() => setActiveTab('expenses')}
        >
          <Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>
            Despesas
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'incomes' && styles.activeTab]}
          onPress={() => setActiveTab('incomes')}
        >
          <Text style={[styles.tabText, activeTab === 'incomes' && styles.activeTabText]}>
            Receitas
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'dashboard' ? (
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
          {renderDashboardContent()}
        </ScrollView>
      ) : (
        <View style={styles.container}>
          {/* Other tabs content - would be renderedExpensesContent() or renderedIncomesContent() */}
        </View>
      )}
      
      {/* Floating action button */}
      {activeTab !== 'dashboard' && (
        <TouchableOpacity 
          style={[
            styles.floatingButton,
            activeTab === 'incomes' ? styles.incomeFloatingButton : styles.expenseFloatingButton
          ]}
          onPress={activeTab === 'incomes' ? navigateToCreateIncome : navigateToCreateExpense}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

// PendingActionItem component 
const PendingActionItem = ({ 
  item, 
  onPress 
}: { 
  item: PendingAction;
  onPress: (item: PendingAction) => void;
}) => {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch (error) {
      return dateString;
    }
  };

  // Get status color
  const statusColor = item.status === 'PENDING' ? '#FFC107' : '#4CAF50';
  const statusText = item.status === 'PENDING' ? 'Pendente' : 'Aprovada';

  return (
    <TouchableOpacity 
      style={styles.pendingItem}
      onPress={() => onPress(item)}
    >
      <View style={styles.pendingItemContent}>
        <View style={styles.pendingItemHeader}>
          <Text style={styles.pendingItemTitle} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={styles.pendingItemAmount}>
            {formatCurrency(item.amount)}
          </Text>
        </View>
        
        <View style={styles.pendingItemFooter}>
          <Text style={styles.pendingItemCreator}>
            {item.creatorName}
          </Text>
          
          <View style={styles.pendingItemMeta}>
            <Text style={styles.pendingItemDate}>
              {formatDate(item.date)}
            </Text>
            
            <View style={[
              styles.pendingItemStatus,
              { backgroundColor: `${statusColor}20` }
            ]}>
              <Text style={[
                styles.pendingItemStatusText,
                { color: statusColor }
              ]}>
                {statusText}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// TransactionItem component
const TransactionItem = ({ 
  item, 
  onPress 
}: { 
  item: Transaction;
  onPress: (item: Transaction) => void;
}) => {
  const isExpense = item.type === 'EXPENSE';
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch (error) {
      return dateString;
    }
  };

  // Get status info for expenses
  const getStatusInfo = (status?: string) => {
    if (!status) return { color: '#aaa', text: '' };
    
    switch(status) {
      case 'PENDING': return { color: '#FFC107', text: 'Pendente' };
      case 'APPROVED': return { color: '#4CAF50', text: 'Aprovada' };
      case 'REJECTED': return { color: '#FF6347', text: 'Rejeitada' };
      case 'REIMBURSED': return { color: '#2196F3', text: 'Reembolsada' };
      default: return { color: '#aaa', text: status };
    }
  };

  // Expense has status, income doesn't
  const statusInfo = isExpense 
    ? getStatusInfo((item as any).status) 
    : { color: '#4CAF50', text: 'Recebida' };

  return (
    <TouchableOpacity 
      style={styles.transactionItem}
      onPress={() => onPress(item)}
    >
      <View 
        style={[
          styles.transactionTypeIndicator, 
          { backgroundColor: isExpense ? '#FF6347' : '#4CAF50' }
        ]} 
      />
      
      <View style={styles.transactionContent}>
        <View style={styles.transactionHeader}>
          <Text style={styles.transactionTitle} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={[
            styles.transactionAmount,
            { color: isExpense ? '#FF6347' : '#4CAF50' }
          ]}>
            {isExpense ? '-' : '+'}{formatCurrency(item.amount)}
          </Text>
        </View>
        
        <View style={styles.transactionFooter}>
          <Text style={styles.transactionMetaText}>
            {formatDate(item.date)}
          </Text>
          
          <View style={[
            styles.statusBadge, 
            { backgroundColor: `${statusInfo.color}20` }
          ]}>
            <Text style={[
              styles.statusText, 
              { color: statusInfo.color }
            ]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // All styles from the original component
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
  actionsSection: {
    padding: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    flex: 1,
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
  sectionContainer: {
    backgroundColor: '#333',
    borderRadius: 16,
    margin: 16,
    padding: 16,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllButtonText: {
    color: '#7B68EE',
    fontSize: 14,
    marginRight: 4,
  },
  viewMoreButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  viewExpensesButton: {
    backgroundColor: 'rgba(255, 99, 71, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  viewExpensesText: {
    color: '#FF6347',
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewIncomesButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  viewIncomesText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pendingList: {
    maxHeight: 280,
  },
  transactionsList: {
    maxHeight: 400,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#aaa',
    marginTop: 10,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  pendingItem: {
    backgroundColor: '#444',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  pendingItemContent: {
    padding: 12,
  },
  pendingItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pendingItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  pendingItemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  pendingItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingItemCreator: {
    fontSize: 12,
    color: '#ccc',
  },
  pendingItemMeta: {
    alignItems: 'flex-end',
  },
  pendingItemDate: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 4,
  },
  pendingItemStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  pendingItemStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  transactionItem: {
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  transactionTypeIndicator: {
    width: 4,
    height: '100%',
  },
  transactionContent: {
    flex: 1,
    padding: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionMetaText: {
    fontSize: 12,
    color: '#aaa',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  expenseFloatingButton: {
    backgroundColor: '#FF6347',
    shadowColor: '#FF6347',
  },
  incomeFloatingButton: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
  },
});

export default FinancesDashboardScreen;