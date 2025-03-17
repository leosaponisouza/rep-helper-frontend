// app/(panel)/finances/index.tsx - Versão Redesenhada
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
  FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFinances } from '../../../src/hooks/useFinances';
import { PendingAction, Transaction } from '../../../src/models/finances.model';

// Componentes
import FinancialSummary from '../../../components/Finances/FinancialSummary';
import MonthlyChart from '../../../components/Finances/MonthlyChart';

const FinancesDashboardScreen = () => {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'expenses', 'incomes'
  
  const {
    dashboardSummary,
    monthlyData,
    expenses,
    incomes,
    pendingActions,
    loadingDashboard,
    loadingExpenses,
    loadingIncomes,
    dashboardError,
    refreshFinancialData
  } = useFinances();

  // Ação de refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshFinancialData();
    setRefreshing(false);
  };

  // Navegação
  const navigateToExpenseDetails = (id: number) => {
    router.push(`/(panel)/finances/expenses/${id}`);
  };

  const navigateToIncomeDetails = (id: number) => {
    router.push(`/(panel)/finances/incomes/${id}`);
  };

  const navigateToCreateExpense = () => {
    router.push('/(panel)/finances/expenses/create');
  };

  const navigateToCreateIncome = () => {
    router.push('/(panel)/finances/incomes/create');
  };

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Renderizar item de transação
  const renderTransactionItem = useCallback(({ item }: { item: Transaction }) => {
    const isExpense = item.type === 'EXPENSE';
    
    return (
      <TouchableOpacity 
        style={styles.transactionItem}
        onPress={() => isExpense ? navigateToExpenseDetails(item.id as number) : navigateToIncomeDetails(item.id as number)}
      >
        <View style={[
          styles.transactionTypeIndicator, 
          { backgroundColor: isExpense ? '#FF6347' : '#4CAF50' }
        ]} />
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
            <Text style={styles.transactionDate}>
              {new Date(item.date).toLocaleDateString('pt-BR')}
            </Text>
            {isExpense && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {(item as any).status}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }, []);

  // Renderizar item de ação pendente
  const renderPendingActionItem = useCallback(({ item }: { item: PendingAction }) => {
    return (
      <TouchableOpacity 
        style={styles.pendingItem}
        onPress={() => navigateToExpenseDetails(item.id)}
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
            <View style={[
              styles.pendingItemStatus,
              { backgroundColor: item.status === 'PENDING' ? 'rgba(255, 193, 7, 0.2)' : 'rgba(76, 175, 80, 0.2)' }
            ]}>
              <Text style={[
                styles.pendingItemStatusText,
                { color: item.status === 'PENDING' ? '#FFC107' : '#4CAF50' }
              ]}>
                {item.status === 'PENDING' ? 'Pendente' : 'Aprovada'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, []);

  // Renderizar conteúdo com base na tab ativa
  const renderContent = () => {
    if (activeTab === 'dashboard') {
      return (
        <>
          {/* Resumo Financeiro */}
          <FinancialSummary
            currentBalance={dashboardSummary?.currentBalance || 0}
            pendingExpenses={dashboardSummary?.pendingExpenses || 0}
            approvedExpenses={dashboardSummary?.approvedExpenses || 0}
            totalIncomes={dashboardSummary?.totalIncomes || 0}
            loading={loadingDashboard}
            error={dashboardError}
            onRetry={handleRefresh}
          />
          
          {/* Ações Rápidas */}
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
          
          {/* Gráfico Mensal */}
          <MonthlyChart 
            data={monthlyData}
            title="Movimentação Financeira"
          />
          
          {/* Ações Pendentes */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ações Pendentes</Text>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => setActiveTab('expenses')}
              >
                <Text style={styles.viewAllButtonText}>Ver Todas</Text>
                <Ionicons name="chevron-forward" size={16} color="#7B68EE" />
              </TouchableOpacity>
            </View>
            
            {pendingActions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="check-circle" size={40} color="#7B68EE" style={{ opacity: 0.6 }} />
                <Text style={styles.emptyText}>Nenhuma ação pendente</Text>
              </View>
            ) : (
              <FlatList
                data={pendingActions.slice(0, 3)} // Mostrar apenas 3 itens
                keyExtractor={item => item.id.toString()}
                renderItem={renderPendingActionItem}
                style={styles.pendingList}
              />
            )}
          </View>
        </>
      );
    } else if (activeTab === 'expenses') {
      return (
        <View style={styles.listContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Despesas</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={navigateToCreateExpense}
            >
              <Ionicons name="add-circle-outline" size={24} color="#7B68EE" />
            </TouchableOpacity>
          </View>
          
          {expenses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="cash-remove" size={40} color="#7B68EE" style={{ opacity: 0.6 }} />
              <Text style={styles.emptyText}>Nenhuma despesa cadastrada</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={navigateToCreateExpense}
              >
                <Text style={styles.emptyButtonText}>Criar Despesa</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={expenses}
              keyExtractor={item => item.id.toString()}
              renderItem={renderTransactionItem}
              style={styles.transactionsList}
              contentContainerStyle={styles.transactionsListContent}
            />
          )}
        </View>
      );
    } else {
      return (
        <View style={styles.listContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Receitas</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={navigateToCreateIncome}
            >
              <Ionicons name="add-circle-outline" size={24} color="#7B68EE" />
            </TouchableOpacity>
          </View>
          
          {incomes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="cash-plus" size={40} color="#7B68EE" style={{ opacity: 0.6 }} />
              <Text style={styles.emptyText}>Nenhuma receita cadastrada</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={navigateToCreateIncome}
              >
                <Text style={styles.emptyButtonText}>Criar Receita</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={incomes}
              keyExtractor={item => item.id.toString()}
              renderItem={renderTransactionItem}
              style={styles.transactionsList}
              contentContainerStyle={styles.transactionsListContent}
            />
          )}
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Finanças</Text>
      </View>
      
      {/* Tabs de navegação */}
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
        {renderContent()}
      </ScrollView>
      
      {/* Botão flutuante contextual com base na tab ativa */}
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
  // Ações rápidas
  actionsSection: {
    padding: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
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
  // Seções
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
    marginBottom: 4,
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
  // Listas
  listContainer: {
    padding: 16,
  },
  pendingList: {
    maxHeight: 280,
  },
  transactionsList: {
    marginTop: 8,
  },
  transactionsListContent: {
    paddingBottom: 80,
  },
  // Items da lista
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
  pendingItemStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  pendingItemStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Transações
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
  transactionDate: {
    fontSize: 12,
    color: '#aaa',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFC107',
  },
  // Estados vazios
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#333',
    borderRadius: 12,
    marginTop: 8,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#7B68EE',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Outros
  addButton: {
    padding: 8,
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