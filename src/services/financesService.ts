import api from './api';
import { ErrorHandler } from '../utils/errorHandling';
import { 
  Expense, 
  Income, 
  CreateExpenseRequest, 
  CreateIncomeRequest,
  FinancialDashboardSummary,
  ExpenseStatus
} from '../models/finances.model';

/**
 * Serviço para gerenciamento de finanças
 */

/**
 * Busca resumo financeiro da república
 * @param republicId ID da república
 * @returns Resumo financeiro
 */
export const getFinancialSummary = async (republicId: string): Promise<FinancialDashboardSummary> => {
  try {
    const response = await api.get<FinancialDashboardSummary>(`/api/v1/financial-dashboard/summary/${republicId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar resumo financeiro:', error);
    const parsedError = await ErrorHandler.parseError(error);
    throw parsedError;
  }
};

/**
 * Busca despesas da república
 * @param republicId ID da república
 * @returns Lista de despesas
 */
export const getExpenses = async (republicId: string): Promise<Expense[]> => {
  try {
    const response = await api.get<Expense[]>(`/api/v1/expenses`, { params: { republicId } });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar despesas:', error);
    const parsedError = await ErrorHandler.parseError(error);
    throw parsedError;
  }
};

/**
 * Busca receitas da república
 * @param republicId ID da república
 * @returns Lista de receitas
 */
export const getIncomes = async (republicId: string): Promise<Income[]> => {
  try {
    const response = await api.get<Income[]>(`/api/v1/incomes`, { params: { republicId } });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar receitas:', error);
    const parsedError = await ErrorHandler.parseError(error);
    throw parsedError;
  }
};

/**
 * Cria uma nova despesa
 * @param expense Dados da despesa
 * @returns Despesa criada
 */
export const createExpense = async (expense: CreateExpenseRequest): Promise<Expense> => {
  try {
    const response = await api.post<Expense>(`/api/v1/expenses`, expense);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar despesa:', error);
    const parsedError = await ErrorHandler.parseError(error);
    throw parsedError;
  }
};

/**
 * Cria uma nova receita
 * @param income Dados da receita
 * @returns Receita criada
 */
export const createIncome = async (income: CreateIncomeRequest): Promise<Income> => {
  try {
    const response = await api.post<Income>(`/api/v1/incomes`, income);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar receita:', error);
    const parsedError = await ErrorHandler.parseError(error);
    throw parsedError;
  }
};

/**
 * Aprova uma despesa
 * @param expenseId ID da despesa
 * @returns Despesa atualizada
 */
export const approveExpense = async (expenseId: number): Promise<Expense> => {
  try {
    const response = await api.put<Expense>(`/api/v1/expenses/${expenseId}/approve`);
    return response.data;
  } catch (error) {
    console.error('Erro ao aprovar despesa:', error);
    const parsedError = await ErrorHandler.parseError(error);
    throw parsedError;
  }
};

/**
 * Rejeita uma despesa
 * @param expenseId ID da despesa
 * @param reason Motivo da rejeição
 * @returns Despesa atualizada
 */
export const rejectExpense = async (expenseId: number, reason: string): Promise<Expense> => {
  try {
    const response = await api.put<Expense>(`/api/v1/expenses/${expenseId}/reject`, { rejectionReason: reason });
    return response.data;
  } catch (error) {
    console.error('Erro ao rejeitar despesa:', error);
    const parsedError = await ErrorHandler.parseError(error);
    throw parsedError;
  }
};

/**
 * Ajusta o saldo da república
 * @param republicId ID da república
 * @param newBalance Novo saldo
 * @param description Descrição do ajuste (opcional)
 * @returns Resumo financeiro atualizado
 */
export const adjustBalance = async (republicId: string, newBalance: number, description?: string): Promise<FinancialDashboardSummary> => {
  try {
    const response = await api.post<FinancialDashboardSummary>(
      `/api/v1/finances/${republicId}/adjust-balance`, 
      { 
        amount: newBalance,
        description: description || ''
      }
    );
    return response.data;
  } catch (error) {
    console.error('Erro ao ajustar saldo:', error);
    const parsedError = await ErrorHandler.parseError(error);
    throw parsedError;
  }
}; 