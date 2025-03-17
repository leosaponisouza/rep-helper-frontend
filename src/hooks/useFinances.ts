// src/hooks/useFinances.ts
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { ErrorHandler } from '../utils/errorHandling';
import { useAuth } from '../context/AuthContext';
import { 
  Expense, 
  CreateExpenseRequest, 
  UpdateExpenseRequest, 
  RejectExpenseRequest 
} from '../models/expense.model';
import { 
  Income, 
  CreateIncomeRequest, 
  UpdateIncomeRequest 
} from '../models/income.model';
import { 
  RepublicFinances, 
  FinancialDashboardSummary, 
  MonthlyExpenseData, 
  CategoryExpense, 
  PendingAction 
} from '../models/finances.model';

export type ExpenseFilterType = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REIMBURSED';

interface UseFinancesOptions {
  initialFilter?: ExpenseFilterType;
}

export const useFinances = (options: UseFinancesOptions = {}) => {
  const { user } = useAuth();
  
  // Despesas
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [expensesError, setExpensesError] = useState<string | null>(null);
  const [expenseFilter, setExpenseFilter] = useState<ExpenseFilterType>(options.initialFilter || 'ALL');
  
  // Receitas
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loadingIncomes, setLoadingIncomes] = useState(true);
  const [incomesError, setIncomesError] = useState<string | null>(null);
  
  // Finanças da República
  const [finances, setFinances] = useState<RepublicFinances | null>(null);
  const [loadingFinances, setLoadingFinances] = useState(true);
  const [financesError, setFinancesError] = useState<string | null>(null);
  
  // Dashboard
  const [dashboardSummary, setDashboardSummary] = useState<FinancialDashboardSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyExpenseData[]>([]);
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Função para buscar despesas
  const fetchExpenses = useCallback(async () => {
    if (!user?.currentRepublicId) return;
    
    try {
      setLoadingExpenses(true);
      setExpensesError(null);
      
      const response = await api.get(`/api/v1/expenses`, {
        params: { republicId: user.currentRepublicId }
      });
      
      setExpenses(response.data);
      applyExpenseFilter(expenseFilter, response.data);
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      setExpensesError(parsedError.message);
      ErrorHandler.logError(parsedError);
    } finally {
      setLoadingExpenses(false);
    }
  }, [user?.currentRepublicId, expenseFilter]);
  
  // Função para buscar despesas por status
  const fetchExpensesByStatus = useCallback(async (status: string) => {
    if (!user?.currentRepublicId) return;
    
    try {
      setLoadingExpenses(true);
      setExpensesError(null);
      
      const response = await api.get(`/api/v1/expenses/status/${status}`, {
        params: { republicId: user.currentRepublicId }
      });
      
      return response.data;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      setExpensesError(parsedError.message);
      ErrorHandler.logError(parsedError);
      return [];
    } finally {
      setLoadingExpenses(false);
    }
  }, [user?.currentRepublicId]);

  // Função para buscar receitas
  const fetchIncomes = useCallback(async () => {
    if (!user?.currentRepublicId) return;
    
    try {
      setLoadingIncomes(true);
      setIncomesError(null);
      
      const response = await api.get(`/api/v1/incomes`, {
        params: { republicId: user.currentRepublicId }
      });
      
      setIncomes(response.data);
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      setIncomesError(parsedError.message);
      ErrorHandler.logError(parsedError);
    } finally {
      setLoadingIncomes(false);
    }
  }, [user?.currentRepublicId]);

  // Função para buscar resumo financeiro
  const fetchFinancialSummary = useCallback(async () => {
    if (!user?.currentRepublicId) return;
    
    try {
      setLoadingFinances(true);
      setFinancesError(null);
      
      const response = await api.get(`/api/v1/finances/${user.currentRepublicId}`);
      
      setFinances(response.data);
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      setFinancesError(parsedError.message);
      ErrorHandler.logError(parsedError);
    } finally {
      setLoadingFinances(false);
    }
  }, [user?.currentRepublicId]);
  
  // Implementação completa da função getIncomeById
  const getIncomeById = async (id: number) => {
    try {
      const response = await api.get(`/api/v1/incomes/${id}`);
      return response.data;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  // Função para buscar dados do dashboard
  const fetchDashboardData = useCallback(async () => {
    if (!user?.currentRepublicId) return;
    
    try {
      setLoadingDashboard(true);
      setDashboardError(null);
      
      // Buscar resumo do dashboard
      const summaryResponse = await api.get(`/api/v1/financial-dashboard/summary/${user.currentRepublicId}`);
      setDashboardSummary(summaryResponse.data);
      
      // Buscar dados mensais
      const monthlyResponse = await api.get(`/api/v1/financial-dashboard/expenses/monthly/${user.currentRepublicId}`, {
        params: { numberOfMonths: 6 }
      });
      setMonthlyData(monthlyResponse.data);
      
      // Buscar ações pendentes
      const pendingResponse = await api.get(`/api/v1/financial-dashboard/pending-actions/${user.currentRepublicId}`);
      setPendingActions(pendingResponse.data);
      
      // Calcular despesas por categoria usando as despesas já carregadas
      calculateCategoryExpenses();
      
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      setDashboardError(parsedError.message);
      ErrorHandler.logError(parsedError);
    } finally {
      setLoadingDashboard(false);
    }
  }, [user?.currentRepublicId]);
  
  // Nova função para calcular despesas por categoria
  const calculateCategoryExpenses = useCallback(() => {
    const categories = new Map<string, number>();
    const total = expenses.reduce((sum, expense) => {
      if (expense.status === 'APPROVED' || expense.status === 'REIMBURSED') {
        const category = expense.category || 'Outros';
        const current = categories.get(category) || 0;
        categories.set(category, current + expense.amount);
        return sum + expense.amount;
      }
      return sum;
    }, 0);
    
    // Converte Map em array de CategoryExpense
    const categoryData: CategoryExpense[] = Array.from(categories.entries()).map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0
    }));
    
    setCategoryExpenses(categoryData);
  }, [expenses]);

  // Aplicar filtro nas despesas
  const applyExpenseFilter = useCallback((filter: ExpenseFilterType, data: Expense[] = expenses) => {
    setExpenseFilter(filter);
    
    if (filter === 'ALL') {
      setFilteredExpenses(data);
    } else {
      setFilteredExpenses(data.filter(expense => expense.status === filter));
    }
  }, [expenses]);

  // Carregar dados iniciais
  useEffect(() => {
    if (user?.currentRepublicId) {
      fetchExpenses();
      fetchIncomes();
      fetchFinancialSummary();
    }
  }, [fetchExpenses, fetchIncomes, fetchFinancialSummary, user?.currentRepublicId]);

  // Atualizar dashboard quando outros dados mudarem
  useEffect(() => {
    if (user?.currentRepublicId) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, expenses, incomes, user?.currentRepublicId]);

  // Operações CRUD para Despesas
  const createExpense = async (data: CreateExpenseRequest) => {
    try {
      const response = await api.post('/api/v1/expenses', data);
      await fetchExpenses(); // Recarregar após criar
      await fetchFinancialSummary(); // Atualizar saldo
      return response.data;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  const getExpenseById = async (id: number) => {
    try {
      const response = await api.get(`/api/v1/expenses/${id}`);
      return response.data;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  const updateExpense = async (id: number, data: UpdateExpenseRequest) => {
    try {
      const response = await api.put(`/api/v1/expenses/${id}`, data);
      await fetchExpenses(); // Recarregar após atualizar
      return response.data;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  const approveExpense = async (id: number) => {
    try {
      const response = await api.post(`/api/v1/expenses/${id}/approve`);
      await fetchExpenses(); // Recarregar após aprovar
      await fetchFinancialSummary(); // Atualizar saldo
      return response.data;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  const rejectExpense = async (id: number, data: RejectExpenseRequest) => {
    try {
      const response = await api.post(`/api/v1/expenses/${id}/reject`, data);
      await fetchExpenses(); // Recarregar após rejeitar
      return response.data;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  const reimburseExpense = async (id: number) => {
    try {
      const response = await api.post(`/api/v1/expenses/${id}/reimburse`);
      await fetchExpenses(); // Recarregar após reembolsar
      await fetchFinancialSummary(); // Atualizar saldo
      return response.data;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };
  
  const resetExpenseStatus = async (id: number) => {
    try {
      const response = await api.post(`/api/v1/expenses/${id}/reset`);
      await fetchExpenses(); // Recarregar após resetar
      return response.data;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };
  
  const deleteExpense = async (id: number) => {
    try {
      await api.delete(`/api/v1/expenses/${id}`);
      await fetchExpenses(); // Recarregar após excluir
      await fetchFinancialSummary(); // Atualizar saldo
      return true;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  // Operações CRUD para Receitas
  const createIncome = async (data: CreateIncomeRequest) => {
    try {
      const response = await api.post('/api/v1/incomes', data);
      await fetchIncomes(); // Recarregar após criar
      await fetchFinancialSummary(); // Atualizar saldo
      return response.data;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  const updateIncome = async (id: number, data: UpdateIncomeRequest) => {
    try {
      const response = await api.put(`/api/v1/incomes/${id}`, data);
      await fetchIncomes(); // Recarregar após atualizar
      await fetchFinancialSummary(); // Atualizar saldo
      return response.data;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  const deleteIncome = async (id: number | string) => {
    try {
      await api.delete(`/api/v1/incomes/${id}`);
      await fetchIncomes(); // Recarregar após excluir
      await fetchFinancialSummary(); // Atualizar saldo
      return true;
    } catch (err) {
      const parsedError = ErrorHandler.parseError(err);
      ErrorHandler.handle(err);
      throw parsedError;
    }
  };

  // Função para recarregar todos os dados
  const refreshFinancialData = async () => {
    try {
      await Promise.all([
        fetchExpenses(),
        fetchIncomes(),
        fetchFinancialSummary(),
        fetchDashboardData()
      ]);
      return true;
    } catch (error) {
      console.error("Erro ao atualizar dados financeiros:", error);
      return false;
    }
  };

  return {
    // Dados
    expenses: filteredExpenses,
    allExpenses: expenses,
    incomes,
    finances,
    
    // Dashboard
    dashboardSummary,
    monthlyData,
    categoryExpenses,
    pendingActions,
    
    // Estados de Loading
    loadingExpenses,
    loadingIncomes,
    loadingFinances,
    loadingDashboard,
    
    // Erros
    expensesError,
    incomesError,
    financesError,
    dashboardError,
    
    // Funções de carregamento
    fetchExpenses,
    fetchExpensesByStatus,
    fetchIncomes,
    fetchFinancialSummary,
    fetchDashboardData,
    refreshFinancialData,
    
    // Funções de filtro
    applyExpenseFilter,
    expenseFilter,
    
    // Operações de despesas
    createExpense,
    getExpenseById,
    updateExpense,
    approveExpense,
    rejectExpense,
    reimburseExpense,
    resetExpenseStatus,
    deleteExpense,
    
    // Operações de receitas
    createIncome,
    getIncomeById,
    updateIncome,
    deleteIncome
  };
};