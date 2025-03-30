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
  subtitle?: string;
  value: string;
  iconName: string;
  iconColor: string;
  backgroundColor: string;
  valueColor?: string;
  onPress?: () => void;
  showAdjustOption?: boolean;
  onAdjust?: () => void;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  subtitle,
  value,
  iconName,
  iconColor,
  backgroundColor,
  valueColor,
  onPress,
  showAdjustOption,
  onAdjust
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
        <View style={styles.titleContainer}>
          <Text style={styles.cardTitle}>{title}</Text>
          {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
        </View>
        {showAdjustOption && (
          <TouchableOpacity 
            style={styles.adjustButton} 
            onPress={onAdjust}
          >
            <Ionicons name="pencil" size={16} color="rgba(255, 255, 255, 0.8)" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.cardValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </Card>
  );
};

interface FinancialSummaryProps {
  currentBalance: number;
  pendingExpenses: number; 
  approvedExpenses: number;
  totalIncomes: number;
  totalExpensesCurrentMonth?: number;
  totalIncomesCurrentMonth?: number;
  loading?: boolean;
  error?: string | null;
  isAdmin?: boolean;
  onRetry?: () => void;
  onPressBalance?: () => void;
  onPressExpenses?: () => void;
  onPressIncomes?: () => void;
  onAdjustBalance?: () => void;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  currentBalance,
  pendingExpenses,
  approvedExpenses,
  totalIncomes,
  totalExpensesCurrentMonth,
  totalIncomesCurrentMonth,
  loading = false,
  error = null,
  isAdmin = false,
  onRetry,
  onPressBalance,
  onPressExpenses,
  onPressIncomes,
  onAdjustBalance
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
        title="Saldo Total"
        value={formatCurrency(currentBalance)}
        iconName="wallet"
        iconColor="#64B5F6"
        backgroundColor="#243447"
        valueColor={currentBalance >= 0 ? "#4CAF50" : "#FF6347"}
        onPress={onPressBalance}
        showAdjustOption={isAdmin}
        onAdjust={onAdjustBalance}
      />
      
      <View style={styles.row}>
        <SummaryCard
          title="Despesas"
          subtitle="Neste mês"
          value={formatCurrency(totalExpensesCurrentMonth ?? (approvedExpenses + pendingExpenses))}
          iconName="cash-minus"
          iconColor="#FF6347"
          backgroundColor="#4F2220"
          onPress={onPressExpenses}
        />
        
        <SummaryCard
          title="Receitas"
          subtitle="Neste mês"
          value={formatCurrency(totalIncomesCurrentMonth ?? totalIncomes)}
          iconName="cash-plus"
          iconColor="#4CAF50"
          backgroundColor="#1F4F22"
          onPress={onPressIncomes}
        />
      </View>
      
      <View style={styles.row}>
        <SummaryCard
          title="Pendentes"
          subtitle="Neste mês"
          value={formatCurrency(pendingExpenses)}
          iconName="clock-time-four"
          iconColor="#FFC107"
          backgroundColor="#4F3F1F"
          onPress={onPressExpenses}
        />
        
        <SummaryCard
          title="Aprovadas"
          subtitle="Neste mês"
          value={formatCurrency(approvedExpenses)}
          iconName="check-circle"
          iconColor="#2196F3"
          backgroundColor="#1F334F"
          onPress={onPressExpenses}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'transparent',
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
    gap: 12,
  },
  summaryCard: {
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
        elevation: 0,
      },
    }),
    flex: 1,
    marginHorizontal: 0,
    minHeight: 100,
    justifyContent: 'space-between',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
  },
  titleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  cardSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  cardValue: {
    color: '#fff',
    fontSize: 19,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  adjustButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  }
});

export default FinancialSummary;