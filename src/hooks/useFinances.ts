// src/hooks/useFinances.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { ErrorHandler } from '../utils/errorHandling';
import { useAuth } from '../context/AuthContext';
import { 
  Expense, 
  Income,
  CreateExpenseRequest, 
  UpdateExpenseRequest, 
  RejectExpenseRequest,
  CreateIncomeRequest, 
  UpdateIncomeRequest,
  FinancialDashboardSummary,
  MonthlyExpenseData,
  CategoryExpense,
  PendingAction,
  Transaction
} from '../models/finances.model';

export type ExpenseFilterType = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REIMBURSED';

interface UseFinancesOptions {
  initialFilter?: ExpenseFilterType;
}

export const useFinances = (options: UseFinancesOptions = {}) => {
  const { user } = useAuth();
  const republicId = user?.currentRepublicId;
  
  // State for expenses
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseFilter, setExpenseFilter] = useState<ExpenseFilterType>(options.initialFilter || 'ALL');
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [expensesError, setExpensesError] = useState<string | null>(null);
  
  // State for incomes
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loadingIncomes, setLoadingIncomes] = useState(false);
  const [incomesError, setIncomesError] = useState<string | null>(null);
  
  // State for dashboard
  const [dashboardSummary, setDashboardSummary] = useState<FinancialDashboardSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyExpenseData[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  
  // Derived state
  const filteredExpenses = useMemo(() => {
    if (expenseFilter === 'ALL') {
      return expenses;
    }
    return expenses.filter(expense => expense.status === expenseFilter);
  }, [expenses, expenseFilter]);
  
  const categoryExpenses = useMemo(() => {
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
    
    return Array.from(categories.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount); // Sort by amount descending
  }, [expenses]);
  
  // Recent transactions (both expenses and incomes combined)
  const recentTransactions = useMemo<Transaction[]>(() => {
    const allTransactions: Transaction[] = [
      ...expenses.map(expense => ({
        ...expense,
        date: expense.expenseDate, // Normalize date field
      })),
      ...incomes.map(income => ({
        ...income,
        date: income.incomeDate, // Normalize date field
      }))
    ];
    
    return allTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10); // Get the 10 most recent transactions
  }, [expenses, incomes]);

  // API request functions with better error handling
  const fetchWithErrorHandling = async <T>(
    apiCall: () => Promise<T>,
    setLoading: (loading: boolean) => void,
    setError: (error: string | null) => void,
    errorMessage: string = "Ocorreu um erro ao buscar os dados"
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      return await apiCall();
    } catch (err) {
      const parsedError = await ErrorHandler.parseError(err);
      setError(parsedError.message || errorMessage);
      console.error(`${errorMessage}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch expenses
  const fetchExpenses = useCallback(async (): Promise<void> => {
    if (!republicId) return;
    
    const data = await fetchWithErrorHandling(
      () => api.get<Expense[]>(`/api/v1/expenses`, { params: { republicId } })
        .then(response => response.data),
      setLoadingExpenses,
      setExpensesError,
      "Não foi possível carregar as despesas"
    );
    
    if (data) {
      setExpenses(data);
    }
  }, [republicId]);

  // Fetch incomes
  const fetchIncomes = useCallback(async (): Promise<void> => {
    if (!republicId) return;
    
    const data = await fetchWithErrorHandling(
      () => api.get<Income[]>(`/api/v1/incomes`, { params: { republicId } })
        .then(response => response.data),
      setLoadingIncomes,
      setIncomesError,
      "Não foi possível carregar as receitas"
    );
    
    if (data) {
      setIncomes(data);
    }
  }, [republicId]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async (): Promise<void> => {
    if (!republicId) return;
    
    setLoadingDashboard(true);
    setDashboardError(null);
    
    try {
      // Use Promise.all to fetch dashboard data in parallel
      const [summaryResponse, monthlyResponse, pendingResponse] = await Promise.all([
        api.get<FinancialDashboardSummary>(`/api/v1/financial-dashboard/summary/${republicId}`),
        api.get<MonthlyExpenseData[]>(`/api/v1/financial-dashboard/expenses/monthly/${republicId}`, {
          params: { numberOfMonths: 6 }
        }),
        api.get<PendingAction[]>(`/api/v1/financial-dashboard/pending-actions/${republicId}`)
      ]);
      
      setDashboardSummary(summaryResponse.data);
      setMonthlyData(Array.isArray(monthlyResponse.data) ? monthlyResponse.data : []);
      setPendingActions(pendingResponse.data || []);
    } catch (err) {
      const parsedError = await ErrorHandler.parseError(err);
      setDashboardError(parsedError.message || "Não foi possível carregar os dados do dashboard");
      console.error("Dashboard error:", err);
      
      // Set default values on error
      setMonthlyData([]);
      setPendingActions([]);
    } finally {
      setLoadingDashboard(false);
    }
  }, [republicId]);

  // Apply expense filter
  const applyExpenseFilter = useCallback((filter: ExpenseFilterType) => {
    setExpenseFilter(filter);
  }, []);

  // CRUD Operations with improved error handling
  
  // Get expense by ID
  const getExpenseById = useCallback(async (id: number): Promise<Expense> => {
    try {
      const response = await api.get<Expense>(`/api/v1/expenses/${id}`);
      return response.data;
    } catch (err) {
      const error = await ErrorHandler.parseError(err);
      throw error;
    }
  }, []);

  // Get income by ID
  const getIncomeById = useCallback(async (id: number): Promise<Income> => {
    try {
      const response = await api.get<Income>(`/api/v1/incomes/${id}`);
      return response.data;
    } catch (err) {
      const error = await ErrorHandler.parseError(err);
      throw error;
    }
  }, []);

  // Create expense
  const createExpense = useCallback(async (data: CreateExpenseRequest): Promise<Expense> => {
    try {
      const response = await api.post<Expense>('/api/v1/expenses', data);
      await fetchExpenses(); // Refresh expenses
      await fetchDashboardData(); // Refresh dashboard
      return response.data;
    } catch (err) {
      const error = await ErrorHandler.parseError(err);
      throw error;
    }
  }, [fetchExpenses, fetchDashboardData]);

  // Update expense
  const updateExpense = useCallback(async (id: number, data: UpdateExpenseRequest): Promise<Expense> => {
    try {
      const response = await api.put<Expense>(`/api/v1/expenses/${id}`, data);
      await fetchExpenses(); // Refresh expenses
      return response.data;
    } catch (err) {
      const error = await ErrorHandler.parseError(err);
      throw error;
    }
  }, [fetchExpenses]);

  // Expense status operations
  const approveExpense = useCallback(async (id: number): Promise<Expense> => {
    try {
      const response = await api.post<Expense>(`/api/v1/expenses/${id}/approve`);
      await Promise.all([fetchExpenses(), fetchDashboardData()]);
      return response.data;
    } catch (err) {
      const error = await ErrorHandler.parseError(err);
      throw error;
    }
  }, [fetchExpenses, fetchDashboardData]);

  const rejectExpense = useCallback(async (id: number, data: RejectExpenseRequest): Promise<Expense> => {
    try {
      const response = await api.post<Expense>(`/api/v1/expenses/${id}/reject`, data);
      await Promise.all([fetchExpenses(), fetchDashboardData()]);
      return response.data;
    } catch (err) {
      const error = await ErrorHandler.parseError(err);
      throw error;
    }
  }, [fetchExpenses, fetchDashboardData]);

  const reimburseExpense = useCallback(async (id: number): Promise<Expense> => {
    try {
      const response = await api.post<Expense>(`/api/v1/expenses/${id}/reimburse`);
      await Promise.all([fetchExpenses(), fetchDashboardData()]);
      return response.data;
    } catch (err) {
      const error = await ErrorHandler.parseError(err);
      throw error;
    }
  }, [fetchExpenses, fetchDashboardData]);

  const resetExpenseStatus = useCallback(async (id: number): Promise<Expense> => {
    try {
      const response = await api.post<Expense>(`/api/v1/expenses/${id}/reset`);
      await Promise.all([fetchExpenses(), fetchDashboardData()]);
      return response.data;
    } catch (err) {
      const error = await ErrorHandler.parseError(err);
      throw error;
    }
  }, [fetchExpenses, fetchDashboardData]);

  const deleteExpense = useCallback(async (id: number): Promise<boolean> => {
    try {
      await api.delete(`/api/v1/expenses/${id}`);
      await Promise.all([fetchExpenses(), fetchDashboardData()]);
      return true;
    } catch (err) {
      const error = await ErrorHandler.parseError(err);
      throw error;
    }
  }, [fetchExpenses, fetchDashboardData]);

  // Income operations
  const createIncome = useCallback(async (data: CreateIncomeRequest): Promise<Income> => {
    try {
      const response = await api.post<Income>('/api/v1/incomes', data);
      await Promise.all([fetchIncomes(), fetchDashboardData()]);
      return response.data;
    } catch (err) {
      const error = await ErrorHandler.parseError(err);
      throw error;
    }
  }, [fetchIncomes, fetchDashboardData]);

  const updateIncome = useCallback(async (id: number, data: UpdateIncomeRequest): Promise<Income> => {
    try {
      const response = await api.put<Income>(`/api/v1/incomes/${id}`, data);
      await Promise.all([fetchIncomes(), fetchDashboardData()]);
      return response.data;
    } catch (err) {
      const error = await ErrorHandler.parseError(err);
      throw error;
    }
  }, [fetchIncomes, fetchDashboardData]);

  const deleteIncome = useCallback(async (id: number): Promise<boolean> => {
    try {
      await api.delete(`/api/v1/incomes/${id}`);
      await Promise.all([fetchIncomes(), fetchDashboardData()]);
      return true;
    } catch (err) {
      const error = await ErrorHandler.parseError(err);
      throw error;
    }
  }, [fetchIncomes, fetchDashboardData]);

  // Fetch expenses by status
  const fetchExpensesByStatus = useCallback(async (status: ExpenseFilterType): Promise<Expense[]> => {
    if (!republicId || status === 'ALL') return [];
    
    try {
      const response = await api.get<Expense[]>(`/api/v1/expenses/status/${status}`, {
        params: { republicId }
      });
      return response.data;
    } catch (err) {
      const error = await ErrorHandler.parseError(err);
      console.error("Error fetching expenses by status:", error);
      return [];
    }
  }, [republicId]);

  // Refresh all financial data
  const refreshFinancialData = useCallback(async (): Promise<boolean> => {
    if (!republicId) return false;
    
    try {
      await Promise.all([
        fetchExpenses(),
        fetchIncomes(),
        fetchDashboardData()
      ]);
      return true;
    } catch (error) {
      console.error("Error refreshing financial data:", error);
      return false;
    }
  }, [republicId, fetchExpenses, fetchIncomes, fetchDashboardData]);

  // Load initial data
  useEffect(() => {
    if (republicId) {
      // Initial fetch of all data
      refreshFinancialData();
    }
  }, [republicId, refreshFinancialData]);

  // Return all the hooks and functions
  return {
    // Data
    expenses: filteredExpenses,
    allExpenses: expenses,
    incomes,
    recentTransactions,
    
    // Dashboard
    dashboardSummary,
    monthlyData,
    categoryExpenses,
    pendingActions,
    
    // Loading states
    loadingExpenses,
    loadingIncomes,
    loadingDashboard,
    
    // Errors
    expensesError,
    incomesError,
    dashboardError,
    
    // Data fetching
    fetchExpenses,
    fetchIncomes,
    fetchDashboardData,
    fetchExpensesByStatus,
    refreshFinancialData,
    
    // Filter
    applyExpenseFilter,
    expenseFilter,
    
    // Expense operations
    createExpense,
    getExpenseById,
    updateExpense,
    approveExpense,
    rejectExpense,
    reimburseExpense,
    resetExpenseStatus,
    deleteExpense,
    
    // Income operations
    createIncome,
    getIncomeById,
    updateIncome,
    deleteIncome
  };
};