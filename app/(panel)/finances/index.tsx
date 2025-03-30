// app/(panel)/finances/index.tsx - Correção das abas e navegação
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
  Animated,
  TouchableWithoutFeedback,
  Modal,
  Platform,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFinances } from '../../../src/hooks/useFinances';
import { PendingAction, Transaction } from '../../../src/models/finances.model';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../src/context/AuthContext';
import * as financesService from '../../../src/services/financesService';

// Components
import FinancialSummary from '../../../components/Finances/FinancialSummary';
import MonthlyChart from '../../../components/Finances/MonthlyChart';
import CategoryChart from '../../../components/Finances/CategoryChart';
import ExpensesScreen from './expenses/index';
import IncomesScreen from './incomes/index';
import RecentTransactions from '@/components/Finances/RecentTransactions';
import PendingActions from '@/components/Finances/PendingActions';
import AdjustBalanceModal from '@/components/Finances/AdjustBalanceModal';

// Types for tabs
type TabType = 'dashboard' | 'expenses' | 'incomes';

// Main component
const FinancesDashboardScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showSubmenu, setShowSubmenu] = useState(false);
  const [showAdjustBalanceModal, setShowAdjustBalanceModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { user } = useAuth();

  // Set active tab from URL parameter
  useEffect(() => {
    if (params.tab && ['dashboard', 'expenses', 'incomes'].includes(params.tab)) {
      setActiveTab(params.tab as TabType);
    }
  }, [params.tab]);

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

  // Check if user is admin
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch user role
  useEffect(() => {
    if (user?.isAdmin) {
      setIsAdmin(true);
    }
  }, [user]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshFinancialData();
    setRefreshing(false);
  }, [refreshFinancialData]);

  // Tab change handler
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    // Atualize a URL para refletir a aba atual, mas sem criar uma nova entrada na pilha de navegação
    router.setParams({ tab: tab });
  }, [router]);

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

  // Tab navigation handlers
  const navigateToExpensesList = useCallback(() => {
    handleTabChange('expenses');
  }, [handleTabChange]);

  const navigateToIncomesList = useCallback(() => {
    handleTabChange('incomes');
  }, [handleTabChange]);

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

  // Toggle submenu visibility
  const toggleSubmenu = useCallback(() => {
    if (showSubmenu) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowSubmenu(false));
    } else {
      setShowSubmenu(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showSubmenu, fadeAnim]);

  // Close submenu
  const closeSubmenu = useCallback(() => {
    if (showSubmenu) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowSubmenu(false));
    }
  }, [showSubmenu, fadeAnim]);

  // Handle balance adjustment
  const handleAdjustBalance = useCallback(() => {
    if (isAdmin) {
      setShowAdjustBalanceModal(true);
    } else {
      Alert.alert(
        'Permissão Necessária', 
        'Apenas administradores podem ajustar o saldo da república.'
      );
    }
  }, [isAdmin]);

  // Handle balance adjustment submission
  const handleAdjustBalanceSubmit = useCallback(async (newBalance: number, description: string) => {
    if (!user?.currentRepublicId) {
      Alert.alert('Erro', 'Não foi possível identificar sua república. Tente novamente mais tarde.');
      return false;
    }

    try {
      await financesService.adjustBalance(user.currentRepublicId, newBalance, description);
      await refreshFinancialData();
      Alert.alert('Sucesso', 'Saldo da república atualizado com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao ajustar saldo:', error);
      Alert.alert('Erro', 'Não foi possível ajustar o saldo. Tente novamente mais tarde.');
      return false;
    }
  }, [user?.currentRepublicId, refreshFinancialData]);

  const renderPendingActionsSection = () => {
    // Add debugging to help identify issues
    console.log("Rendering pending actions section with: ", {
      pendingActionsLength: pendingActions?.length,
      safePendingActionsLength: safePendingActions?.length,
      isArray: Array.isArray(safePendingActions)
    });
    
    // Check if we have any pending actions to show
    if (Array.isArray(safePendingActions) && safePendingActions.length === 0 && !loadingDashboard) {
      console.log("No pending actions to display");
      return null; // Não renderizar nada se não houver ações pendentes
    }
    
    return (
      <PendingActions
        actions={safePendingActions}
        loading={loadingDashboard}
        error={dashboardError}
        onRetry={handleRefresh}
        onPressAction={handlePendingActionPress}
        onPressViewAll={navigateToExpensesList}
      />
    );
  };

  // Renderizar conteúdo com base na aba ativa
  const renderContent = () => {
    switch (activeTab) {
      case 'expenses':
        return <ExpensesScreen hideHeader={true} />;
      case 'incomes':
        return <IncomesScreen hideHeader={true} />;
      default:
        return (
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
            {/* Financial Summary */}
            <FinancialSummary
              currentBalance={dashboardSummary?.currentBalance ?? 0}
              pendingExpenses={dashboardSummary?.pendingExpensesAmount ?? 0}
              approvedExpenses={dashboardSummary?.approvedExpensesAmount ?? 0}
              totalIncomes={dashboardSummary?.totalIncomes ?? 0}
              totalExpensesCurrentMonth={dashboardSummary?.totalExpensesCurrentMonth}
              totalIncomesCurrentMonth={dashboardSummary?.totalIncomesCurrentMonth}
              loading={loadingDashboard}
              error={dashboardError}
              isAdmin={isAdmin}
              onRetry={handleRefresh}
              onPressBalance={handleAdjustBalance}
              onPressExpenses={navigateToExpensesList}
              onPressIncomes={navigateToIncomesList}
              onAdjustBalance={handleAdjustBalance}
            />
            
            {/* Recent Transactions */}
            <RecentTransactions
              transactions={recentTransactions || []}
              loading={loadingDashboard}
              error={dashboardError}
              onRetry={handleRefresh}
              onPressTransaction={handleTransactionPress}
              onPressViewAll={() => {
                // Você pode decidir qual aba mostrar ao clicar em "Ver todas" 
                // ou adicionar uma nova rota para uma visão completa de transações
                handleTabChange('dashboard'); // Ou qualquer outra navegação apropriada
              }}
            />
            
            {/* Pending Actions */}
            {renderPendingActionsSection()}
            
            {/* Monthly Chart */}
            <MonthlyChart
              data={monthlyData || undefined}
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
          </ScrollView>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />

      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Finanças</Text>
        <TouchableOpacity 
          style={styles.addButtonContainer} 
          onPress={toggleSubmenu}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#9370DB', '#7B68EE', '#6A5ACD']}
            style={styles.addButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add" size={22} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Novo</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Submenu Modal */}
      <Modal
        transparent={true}
        visible={showSubmenu}
        animationType="none"
        onRequestClose={closeSubmenu}
      >
        <TouchableWithoutFeedback onPress={closeSubmenu}>
          <View style={styles.modalOverlay}>
            <Animated.View 
              style={[
                styles.submenuContainer,
                {
                  opacity: fadeAnim,
                  transform: [{
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0]
                    })
                  }]
                }
              ]}
            >
              <TouchableOpacity 
                style={[styles.submenuItem, styles.expenseItem]}
                onPress={() => {
                  closeSubmenu();
                  navigateToCreateExpense();
                }}
              >
                <Ionicons name="add-circle-outline" size={20} color="#FF6347" />
                <Text style={[styles.submenuItemText, styles.expenseItemText]}>Nova Despesa</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.submenuItem, styles.incomeItem]}
                onPress={() => {
                  closeSubmenu();
                  navigateToCreateIncome();
                }}
              >
                <Ionicons name="add-circle-outline" size={20} color="#4CAF50" />
                <Text style={[styles.submenuItemText, styles.incomeItemText]}>Nova Receita</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Adjust Balance Modal */}
      <AdjustBalanceModal
        visible={showAdjustBalanceModal}
        currentBalance={dashboardSummary?.currentBalance ?? 0}
        onClose={() => setShowAdjustBalanceModal(false)}
        onSubmit={handleAdjustBalanceSubmit}
      />

      {/* Navigation tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
          onPress={() => handleTabChange('dashboard')}
        >
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>
            Visão Geral
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
          onPress={() => handleTabChange('expenses')}
        >
          <Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>
            Despesas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'incomes' && styles.activeTab]}
          onPress={() => handleTabChange('incomes')}
        >
          <Text style={[styles.tabText, activeTab === 'incomes' && styles.activeTabText]}>
            Receitas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Renderiza o conteúdo da aba atual */}
      <View style={styles.container}>
        {renderContent()}
      </View>
    </SafeAreaView>
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

    switch (status) {
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
    fontSize: 28,
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
  addButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#7B68EE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  addButton: {
    width: 100,
    height: 40,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  submenuContainer: {
    backgroundColor: '#333',
    borderRadius: 12,
    marginTop: 80, // Posicionado abaixo do cabeçalho
    marginRight: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  submenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  expenseItem: {
    backgroundColor: 'rgba(255, 99, 71, 0.1)',
  },
  incomeItem: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  submenuItemText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  expenseItemText: {
    color: '#FF6347',
  },
  incomeItemText: {
    color: '#4CAF50',
  },
});

export default FinancesDashboardScreen;