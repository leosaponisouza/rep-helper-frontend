// app/(panel)/finances/expenses/edit.tsx
import React, { useEffect } from 'react';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { useFinances } from '../../../../src/hooks/useFinances';
import CreateExpenseScreen from './create';

/**
 * ExpenseEditScreen - This component handles redirection to the create expense screen
 * with proper parameter validation for editing an existing expense.
 */
export default function ExpenseEditScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getExpenseById } = useFinances();
  
  // Validate that the expense exists
  useEffect(() => {
    const validateExpense = async () => {
      if (!params.id) {
        return; // Will be handled by the redirect below
      }
      
      try {
        // Try to fetch the expense to make sure it exists
        await getExpenseById(Number(params.id));
      } catch (error) {
        // If expense doesn't exist, alert the user and redirect back
        console.error('Error fetching expense:', error);
        Alert.alert(
          'Erro',
          'Esta despesa não foi encontrada ou você não tem permissão para editá-la.',
          [
            { 
              text: 'OK', 
              onPress: () => router.replace('/(panel)/finances/expenses') 
            }
          ]
        );
      }
    };
    
    validateExpense();
  }, [params.id, getExpenseById, router]);
  
  // If no ID is provided, redirect to the expenses list
  if (!params.id) {
    return <Redirect href="/(panel)/finances/expenses" />;
  }

  // If ID is valid, render the CreateExpenseScreen which handles editing
  return <CreateExpenseScreen />;
}