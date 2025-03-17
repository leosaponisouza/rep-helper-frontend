// app/(panel)/finances/incomes/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFinances } from '../../../../src/hooks/useFinances';
import IncomeItem from '../../../../components/Finances/IncomeItem';
import { Income } from '@/src/models/finances.model';

const IncomesScreen = () => {
  const router = useRouter();
  
  const {
    incomes,
    loadingIncomes,
    incomesError,
    fetchIncomes
  } = useFinances();

  // Função para recarregar receitas
  const handleRefresh = useCallback(async () => {
    try {
      await fetchIncomes();
      return true;
    } catch (error) {
      console.error('Erro ao recarregar receitas:', error);
      return false;
    }
  }, [fetchIncomes]);

  // Navegação para detalhes da receita
  const handleIncomePress = (income: Income) => {
    router.push(`/(panel)/finances/incomes/${income.id}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
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
          onPress={() => router.push('/(panel)/finances/incomes/create')}
        >
          <Ionicons name="add-circle-outline" size={24} color="#7B68EE" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={incomes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <IncomeItem 
            income={item}
            onPress={handleIncomePress}
          />
        )}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            {loadingIncomes ? (
              <ActivityIndicator size="large" color="#7B68EE" />
            ) : incomesError ? (
              <View>
                <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#FF6347" />
                <Text style={styles.emptyText}>{incomesError}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={handleRefresh}
                >
                  <Text style={styles.retryButtonText}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <MaterialCommunityIcons name="cash-plus" size={64} color="#7B68EE" style={{ opacity: 0.6 }} />
                <Text style={styles.emptyText}>
                  Nenhuma receita cadastrada
                </Text>
                <TouchableOpacity 
                  style={styles.createButton}
                  onPress={() => router.push('/(panel)/finances/incomes/create')}
                >
                  <Text style={styles.createButtonText}>Registrar Receita</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={loadingIncomes}
            onRefresh={handleRefresh}
            colors={['#7B68EE']}
            tintColor={'#7B68EE'}
          />
        }
      />
      
      {/* Botão flutuante para criar receita */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => router.push('/(panel)/finances/incomes/create')}
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
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
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