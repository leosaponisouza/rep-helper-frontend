// components/Finances/RecentTransactions.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Transaction } from '@/src/models/finances.model';

interface RecentTransactionsProps {
  transactions: Transaction[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onPressTransaction?: (transaction: Transaction) => void;
  onPressViewAll?: () => void;
  maxItems?: number;
}

const TransactionItem: React.FC<{
  item: Transaction;
  onPress?: (transaction: Transaction) => void;
}> = ({ item, onPress }) => {
  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatação de data
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';

    try {
      const date = parseISO(dateString);
      return format(date, "dd MMM", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  // Ícone e cor com base no tipo
  const getIconAndColor = (type: 'EXPENSE' | 'INCOME') => {
    if (type === 'EXPENSE') {
      return {
        icon: 'arrow-down-circle',
        color: '#FF6347'
      };
    } else {
      return {
        icon: 'arrow-up-circle',
        color: '#4CAF50'
      };
    }
  };

  const { icon, color } = getIconAndColor(item.type);
  const isExpense = item.type === 'EXPENSE';

  return (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => onPress && onPress(item)}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>

      <View style={styles.transactionContent}>
        <Text style={styles.transactionDescription} numberOfLines={1}>
          {item.description}
        </Text>
        <View style={styles.transactionMeta}>
          <Text style={styles.transactionDate}>
            {formatDate(item.date)}
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: `${color}20` }]}>
            <Text style={[styles.typeText, { color }]}>
              {isExpense ? 'Despesa' : 'Receita'}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[
        styles.transactionAmount,
        { color: isExpense ? '#FF6347' : '#4CAF50' }
      ]}>
        {isExpense ? '-' : '+'}{formatCurrency(item.amount)}
      </Text>
    </TouchableOpacity>
  );
};

const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  loading = false,
  error = null,
  onRetry,
  onPressTransaction,
  onPressViewAll,
  maxItems = 5 // Limitando a 5 itens por padrão
}) => {
  const [filter, setFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');

  // Aplicar filtro às transações
  const filteredTransactions = transactions.filter(t =>
    filter === 'ALL' || t.type === filter
  ).slice(0, maxItems); // Limitar o número de itens renderizados

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Transações Recentes</Text>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#7B68EE" />
          <Text style={styles.loadingText}>Carregando transações...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Transações Recentes</Text>
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#FF6347" />
          <Text style={styles.errorText}>{error}</Text>
          {onRetry && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={onRetry}
            >
              <Text style={styles.retryText}>Tentar novamente</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Transações Recentes</Text>

        {onPressViewAll && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={onPressViewAll}
          >
            <Text style={styles.viewAllText}>Ver todas</Text>
            <Ionicons name="chevron-forward" size={16} color="#7B68EE" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'ALL' && styles.activeFilter]}
          onPress={() => setFilter('ALL')}
        >
          <Text style={[styles.filterText, filter === 'ALL' && styles.activeFilterText]}>
            Todos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'EXPENSE' && styles.activeFilter]}
          onPress={() => setFilter('EXPENSE')}
        >
          <Text style={[styles.filterText, filter === 'EXPENSE' && styles.activeFilterText]}>
            Despesas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'INCOME' && styles.activeFilter]}
          onPress={() => setFilter('INCOME')}
        >
          <Text style={[styles.filterText, filter === 'INCOME' && styles.activeFilterText]}>
            Receitas
          </Text>
        </TouchableOpacity>
      </View>

      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={40} color="#7B68EE" style={{ opacity: 0.6 }} />
          <Text style={styles.emptyText}>
            {filter === 'ALL'
              ? 'Nenhuma transação recente'
              : filter === 'EXPENSE'
                ? 'Nenhuma despesa recente'
                : 'Nenhuma receita recente'
            }
          </Text>
        </View>
      ) : (
        <View style={styles.transactionsList}>
          {filteredTransactions.map((item, index) => (
            <TransactionItem
              key={`transaction-${item.type}-${item.id}-${index}`}
              item={item}
              onPress={onPressTransaction}
            />
          ))}
          
          {transactions.length > maxItems && onPressViewAll && (
            <TouchableOpacity 
              style={styles.viewMoreButton}
              onPress={onPressViewAll}
            >
              <Text style={styles.viewMoreText}>
                Ver mais {transactions.length - maxItems} transações
              </Text>
              <Ionicons name="chevron-down" size={16} color="#7B68EE" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#333',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    marginTop: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#7B68EE',
    fontSize: 14,
    marginRight: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#444',
  },
  activeFilter: {
    backgroundColor: '#7B68EE',
  },
  filterText: {
    color: '#ccc',
    fontSize: 12,
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  transactionsList: {
    // Removendo a propriedade maxHeight, pois não estamos mais usando FlatList
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#aaa',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  viewMoreText: {
    color: '#7B68EE',
    fontSize: 14,
    marginRight: 4,
  },
});

export default RecentTransactions;