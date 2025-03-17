// src/models/finances.model.ts

// Common transaction type for both expenses and incomes
export type TransactionType = 'EXPENSE' | 'INCOME';

// Status types
export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REIMBURSED';
export type TransactionStatus = ExpenseStatus | 'COMPLETED';

// Republic finances
export interface RepublicFinances {
  id: number;
  republicId: string;
  republicName: string;
  currentBalance: number;
  lastUpdated: string;
}

// Base transaction interface (common properties for both expense and income)
export interface Transaction {
  id: number | string;
  description: string;
  amount: number;
  date: string;
  republicId: string;
  republicName: string;
  creatorId: string;
  creatorName: string;
  creatorProfilePictureUrl?: string;
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  type: TransactionType;
}

// Expense specific interface
export interface Expense extends Transaction {
  type: 'EXPENSE';
  expenseDate: string;
  category: string;
  status: ExpenseStatus;
  approvalDate?: string;
  reimbursementDate?: string;
  rejectionReason?: string;
  approverId?: string;
  approverName?: string;
}

// Income specific interface
export interface Income extends Transaction {
  type: 'INCOME';
  incomeDate: string;
  source: string;
  contributorId?: string;
  contributorName?: string;
}

// Request interfaces for creating and updating transactions
export interface CreateExpenseRequest {
  description: string;
  amount: number;
  expenseDate: string;
  category: string;
  receiptUrl?: string;
  republicId: string;
  notes?: string;
}

export interface UpdateExpenseRequest {
  description?: string;
  amount?: number;
  expenseDate?: string;
  category?: string;
  receiptUrl?: string;
  notes?: string;
}

export interface RejectExpenseRequest {
  reason: string;
}

export interface CreateIncomeRequest {
  description: string;
  amount: number;
  incomeDate: string;
  source: string;
  republicId: string;
  notes?: string;
}

export interface UpdateIncomeRequest {
  description?: string;
  amount?: number;
  incomeDate?: string;
  source?: string;
  notes?: string;
}

// Form data interfaces
export interface ExpenseFormData {
  description: string;
  amount: number;
  date: string;
  category?: string;
  receipt?: string;
  notes?: string;
}

export interface IncomeFormData {
  description: string;
  amount: number;
  date: string;
  source?: string;
  receipt?: string;
  notes?: string;
}

// Dashboard and reporting interfaces
export interface FinancialDashboardSummary {
  currentBalance: number;
  totalExpenses: number;
  totalIncomes: number;
  pendingExpenses: number;
  approvedExpenses: number;
  recentTransactions: {
    id: number;
    description: string;
    amount: number;
    date: string;
    type: TransactionType;
  }[];
}

export interface MonthlyExpenseData {
  month: string;
  expenses: number;
  incomes: number;
}

export interface CategoryExpense {
  category: string;
  amount: number;
  percentage: number;
  color?: string;
}

export interface PendingAction {
  id: number;
  description: string;
  amount: number;
  date: string;
  status: 'PENDING' | 'APPROVED';
  creatorName: string;
  creatorProfilePictureUrl?: string;
}