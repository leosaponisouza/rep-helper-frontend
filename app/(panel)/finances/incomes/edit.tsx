// app/(panel)/finances/incomes/edit.tsx
import React, { useEffect } from 'react';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { useFinances } from '../../../../src/hooks/useFinances';
import CreateIncomeScreen from './create';

/**
 * IncomeEditScreen - This component handles redirection to the create income screen
 * with proper parameter validation for editing an existing income.
 */
export default function IncomeEditScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getIncomeById } = useFinances();
  
  // Validate that the income exists
  useEffect(() => {
    const validateIncome = async () => {
      if (!params.id) {
        return; // Will be handled by the redirect below
      }
      
      try {
        // Try to fetch the income to make sure it exists
        await getIncomeById(Number(params.id));
      } catch (error) {
        // If income doesn't exist, alert the user and redirect back
        console.error('Error fetching income:', error);
        Alert.alert(
          'Erro',
          'Esta receita não foi encontrada ou você não tem permissão para editá-la.',
          [
            { 
              text: 'OK', 
              onPress: () => router.replace('/(panel)/finances/incomes') 
            }
          ]
        );
      }
    };
    
    validateIncome();
  }, [params.id, getIncomeById, router]);
  
  // If no ID is provided, redirect to the incomes list
  if (!params.id) {
    return <Redirect href="/(panel)/finances/incomes" />;
  }

  // If ID is valid, render the CreateIncomeScreen which handles editing
  return <CreateIncomeScreen />;
}