// app/(panel)/finances/expenses/edit.tsx
import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import CreateExpenseScreen from './create';

// Este componente simplesmente redireciona para a tela de criação
// passando o ID da despesa como parâmetro
export default function EditExpenseScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  
  if (!params.id) {
    // Se não houver ID, redireciona para a lista de despesas
    return <Redirect href="/(panel)/finances/expenses" />;
  }

  // Redireciona para a tela de criação com o ID como parâmetro
  return <CreateExpenseScreen />;
}