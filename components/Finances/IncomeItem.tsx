// components/Finances/IncomeItem.tsx
import React, { memo } from 'react';
import { Income } from '../../src/models/finances.model';
import FinanceItem from './FinanceItem';

interface IncomeItemProps {
  income: Income;
  onPress: (income: Income) => void;
  currentUserId?: string;
}

const IncomeItem: React.FC<IncomeItemProps> = ({ income, onPress, currentUserId }) => {
  // Wrapper para o item para manter a API atual
  const handlePress = (item: Income | any) => {
    onPress(item as Income);
  };

  return (
    <FinanceItem 
      item={income}
      type="income"
      onPress={handlePress}
      currentUserId={currentUserId}
    />
  );
};

export default memo(IncomeItem);