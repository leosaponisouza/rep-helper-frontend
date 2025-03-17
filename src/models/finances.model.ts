// src/models/finances.model.ts

export interface RepublicFinances {
    id: number;
    republicId: string;
    republicName: string;
    currentBalance: number;
    lastUpdated: string;
  }
  
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
      type: 'EXPENSE' | 'INCOME';
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