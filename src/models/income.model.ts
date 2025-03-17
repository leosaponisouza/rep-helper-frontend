// src/models/income.model.ts

export interface Income {
    id: number;
    description: string;
    amount: number;
    incomeDate: string; // ISO string date format
    source: string;
    republicId: string;
    republicName: string;
    contributorId: string;
    contributorName: string;
    contributorProfilePictureUrl?: string;
    createdAt: string;
  }
  
  export interface CreateIncomeRequest {
    description: string;
    amount: number;
    incomeDate: string;
    source: string;
    republicId: string;
  }
  
  export interface UpdateIncomeRequest {
    description?: string;
    amount?: number;
    incomeDate?: string;
    source?: string;
  }