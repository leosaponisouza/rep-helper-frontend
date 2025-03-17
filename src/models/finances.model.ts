// src/models/finances.model.ts

// Basic types and enums
export type TransactionType = 'EXPENSE' | 'INCOME';
export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REIMBURSED';

/**
 * Base transaction interface with common properties for both expense and income
 */
export interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string; // Generic date field for consistent access
  republicId: string;
  republicName?: string;
  creatorId: string;
  creatorName: string;
  creatorProfilePictureUrl?: string;
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  type: TransactionType;
}

/**
 * Expense interface extends Transaction with expense-specific fields
 */
export interface Expense extends Transaction {
  type: 'EXPENSE';
  expenseDate: string; // Original date field for expenses
  category: string;
  status: ExpenseStatus;
  approvalDate?: string;
  reimbursementDate?: string;
  rejectionReason?: string;
  approverId?: string;
  approverName?: string;
}

/**
 * Income interface extends Transaction with income-specific fields
 */
export interface Income extends Transaction {
  type: 'INCOME';
  incomeDate: string; // Original date field for incomes
  source: string;
  contributorId?: string;
  contributorName?: string;
}

/**
 * Republic finances information
 */
export interface RepublicFinances {
  id: number;
  republicId: string;
  republicName: string;
  currentBalance: number;
  lastUpdated: string;
}

/**
 * Financial dashboard summary
 */
export interface FinancialDashboardSummary {
  currentBalance: number;
  totalExpenses: number;
  totalIncomes: number;
  pendingExpenses: number;
  approvedExpenses: number;
  rejectedExpenses?: number;
  reimbursedExpenses?: number;
}

/**
 * Monthly financial data for charts
 */
export interface MonthlyExpenseData {
  month: string;
  expenses: number;
  incomes: number;
}

/**
 * Category expense data for charts
 */
export interface CategoryExpense {
  category: string;
  amount: number;
  percentage: number;
  color?: string;
}

/**
 * Pending action data for dashboard
 */
export interface PendingAction {
  id: number;
  description: string;
  amount: number;
  date: string;
  status: 'PENDING' | 'APPROVED';
  creatorId: string;
  creatorName: string;
  creatorProfilePictureUrl?: string;
}

// Request and response interfaces for API calls

/**
 * Create expense request
 */
export interface CreateExpenseRequest {
  description: string;
  amount: number;
  expenseDate: string;
  category: string;
  receiptUrl?: string;
  republicId: string;
  notes?: string;
}

/**
 * Update expense request
 */
export interface UpdateExpenseRequest {
  description?: string;
  amount?: number;
  expenseDate?: string;
  category?: string;
  receiptUrl?: string;
  notes?: string;
}

/**
 * Reject expense request
 */
export interface RejectExpenseRequest {
  reason: string;
}

/**
 * Create income request
 */
export interface CreateIncomeRequest {
  description: string;
  amount: number;
  incomeDate: string;
  source: string;
  republicId: string;
  notes?: string;
}

/**
 * Update income request
 */
export interface UpdateIncomeRequest {
  description?: string;
  amount?: number;
  incomeDate?: string;
  source?: string;
  notes?: string;
}

// Form data interfaces for component use

/**
 * Expense form data
 */
export interface ExpenseFormData {
  description: string;
  amount: number | string; // Allow string for user input
  date: string;
  category: string;
  receipt?: string;
  notes?: string;
}

/**
 * Income form data
 */
export interface IncomeFormData {
  description: string;
  amount: number | string; // Allow string for user input
  date: string;
  source: string;
  notes?: string;
}