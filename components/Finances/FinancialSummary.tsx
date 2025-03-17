// components/Finances/FinancialSummary.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface SummaryCardProps {
  title: string;
  value: string;
  iconName: string;
  iconColor: string;
  backgroundColor: string;
  onPress?: () => void;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  iconName,
  iconColor,
  backgroundColor,
  onPress
}) => {
  const Card = onPress ? TouchableOpacity : View;
  
  return (
    <Card
      style={[styles.summaryCard, { backgroundColor }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.cardContent}>
        <MaterialCommunityIcons name={iconName as any} size={24} color={iconColor} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={styles.cardValue}>{value}</Text>
    </Card>
  );
};

interface FinancialSummaryProps {
  currentBalance: number;
  pendingExpenses: number; 
  approvedExpenses: number;
  totalIncomes: number;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onPressBalance?: () => void;
  onPressExpenses?: () => void;
  onPressIncomes?: () => void;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  currentBalance,
  pendingExpenses,
  approvedExpenses,
  totalIncomes,
  loading = false,
  error = null,
  onRetry,
  onPressBalance,
  onPressExpenses,
  onPressIncomes
}) => {
  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#7B68EE" />
        <Text style={styles.loadingText}>Carregando dados financeiros...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={24} color="#FF6347" />
        <Text style={styles.errorText}>{error}</Text>
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SummaryCard
        title="Saldo Atual"
        value={formatCurrency(currentBalance)}
        iconName="wallet"
        iconColor={currentBalance >= 0 ? "#4CAF50" : "#FF6347"}
        backgroundColor={currentBalance >= 0 ? "rgba(76, 175, 80, 0.15)" : "rgba(255, 99, 71, 0.15)"}
        onPress={onPressBalance}
      />
      
      <View style={styles.row}>
        <SummaryCard
          title="Despesas"
          value={formatCurrency(approvedExpenses + pendingExpenses)}
          iconName="cash-minus"
          iconColor="#FF6347"
          backgroundColor="rgba(255, 99, 71, 0.1)"
          onPress={onPressExpenses}
        />
        
        <SummaryCard
          title="Receitas"
          value={formatCurrency(totalIncomes)}
          iconName="cash-plus"
          iconColor="#4CAF50"
          backgroundColor="rgba(76, 175, 80, 0.1)"
          onPress={onPressIncomes}
        />
      </View>
      
      <View style={styles.row}>
        <SummaryCard
          title="Pendentes"
          value={formatCurrency(pendingExpenses)}
          iconName="clock-time-four"
          iconColor="#FFC107"
          backgroundColor="rgba(255, 193, 7, 0.1)"
          onPress={onPressExpenses}
        />
        
        <SummaryCard
          title="Aprovadas"
          value={formatCurrency(approvedExpenses)}
          iconName="check-circle"
          iconColor="#2196F3"
          backgroundColor="rgba(33, 150, 243, 0.1)"
          onPress={onPressExpenses}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#aaa',
    marginTop: 10,
    fontSize: 14,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF6347',
    marginTop: 10,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 99, 71, 0.15)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  retryText: {
    color: '#FF6347',
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  summaryCard: {
    backgroundColor: '#333',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
    flex: 1,
    marginHorizontal: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  cardValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});

export default FinancialSummary;