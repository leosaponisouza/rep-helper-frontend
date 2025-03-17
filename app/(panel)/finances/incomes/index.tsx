// app/(panel)/finances/incomes/index.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFinances } from '../../../../src/hooks/useFinances';
import IncomeItem from '../../../../components/Finances/IncomeItem';
import { Income } from '../../../../src/models/finances.model';

const IncomesScreen = () => {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  
  // Get incomes data from the hook
  const {
    incomes,
    loadingIncomes,
    incomesError,
    fetchIncomes
  } = useFinances();

  // Refresh incomes
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchIncomes();
    } catch (error) {
      console.error('Erro ao recarregar receitas:', error);
      Alert.alert('Erro', 'Não foi possível atualizar as receitas.');
    } finally {
      setRefreshing(false);
    }
  }, [fetchIncomes]);

  // Navigate to income details
  const handleIncomePress = useCallback((income: Income) => {
    router.push(`/(panel)/finances/incomes/${income.id}`);
  }, [router]);

  // Navigate to create income
  const navigateToCreateIncome = useCallback(() => {
    router.push('/(panel)/finances/incomes/create');
  }, [router]);

  // Render empty state
  const renderEmptyState = useCallback(() => {
    if (loadingIncomes) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Carregando receitas...</Text>
        </View>
      );
    }
    
    if (incomesError) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#FF6347" />
          <Text style={styles.errorText}>{incomesError}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRefresh}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons 
          name="cash-plus" 
          size={64} 
          color="#4CAF50" 
          style={{ opacity: 0.6 }} 
        />
        <Text style={styles.emptyText}>
          Nenhuma receita cadastrada
        </Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={navigateToCreateIncome}
        >
          <Text style={styles.createButtonText}>Registrar Receita</Text>
        </TouchableOpacity>
      </View>
    );
  }, [loadingIncomes, incomesError, handleRefresh, navigateToCreateIncome]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#7B68EE" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receitas</Text>
        
        <TouchableOpacity 
          style={styles.headerActionButton}
          onPress={navigateToCreateIncome}
        >
          <Ionicons name="add-circle-outline" size={24} color="#7B68EE" />
        </TouchableOpacity>
      </View>
      
      {/* Incomes List */}
      <FlatList
        data={incomes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <IncomeItem 
            income={item}
            onPress={() => handleIncomePress(item)}
          />
        )}
        contentContainerStyle={[
          styles.listContainer,
          incomes.length === 0 && styles.emptyListContainer
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4CAF50']}
            tintColor={'#4CAF50'}
          />
        }
      />
      
      {/* Floating action button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={navigateToCreateIncome}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#222',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActionButton: {
    padding: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6347',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 99, 71, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 99, 71, 0.5)',
  },
  retryButtonText: {
    color: '#FF6347',
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});

export default IncomesScreen;