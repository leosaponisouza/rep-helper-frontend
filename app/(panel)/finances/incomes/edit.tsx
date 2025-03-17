// app/(panel)/finances/incomes/edit.tsx
import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import CreateIncomeScreen from './create';

// Este componente simplesmente redireciona para a tela de criação
// passando o ID da receita como parâmetro
export default function EditIncomeScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  
  if (!params.id) {
    // Se não houver ID, redireciona para a lista de receitas
    return <Redirect href="/(panel)/finances/incomes/[id]" />;
  }

  // Redireciona para a tela de criação com o ID como parâmetro
  return <CreateIncomeScreen />;
}