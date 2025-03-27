// components/Finances/ExpenseItem.tsx
import React, { memo } from 'react';
import { Expense } from '../../src/models/finances.model';
import FinanceItem from './FinanceItem';

interface ExpenseItemProps {
  expense: Expense;
  onPress: (expense: Expense) => void;
  currentUserId?: string;
}

const ExpenseItem: React.FC<ExpenseItemProps> = ({ expense, onPress, currentUserId }) => {
  // Wrapper para o item para manter a API atual
  const handlePress = (item: Expense | any) => {
    onPress(item as Expense);
  };

  return (
    <FinanceItem 
      item={expense}
      type="expense"
      onPress={handlePress}
      currentUserId={currentUserId}
    />
  );
};

export default memo(ExpenseItem);