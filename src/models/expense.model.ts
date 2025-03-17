// src/models/expense.model.ts

export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REIMBURSED';

export interface Expense {
  id: number;
  description: string;
  amount: number;
  expenseDate: string; // ISO string date format
  category: string;
  receiptUrl?: string;
  status: ExpenseStatus;
  approvalDate?: string;
  reimbursementDate?: string;
  rejectionReason?: string;
  republicId: string;
  republicName: string;
  creatorId: string;
  creatorName: string;
  creatorProfilePictureUrl?: string;
  createdAt: string;
}

export interface CreateExpenseRequest {
  description: string;
  amount: number;
  expenseDate: string;
  category: string;
  receiptUrl?: string;
  republicId: string;
}

export interface UpdateExpenseRequest {
  description?: string;
  amount?: number;
  expenseDate?: string;
  category?: string;
  receiptUrl?: string;
}

export interface RejectExpenseRequest {
  reason: string;
}