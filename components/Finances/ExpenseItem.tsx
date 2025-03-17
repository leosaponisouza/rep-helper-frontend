// components/Finances/ExpenseItem.tsx
import React from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Expense } from '../../src/models/expense.model';

interface ExpenseItemProps {
  item: Expense;
  currentUserId?: string;
  pendingExpenseIds?: number[];
  onPress: (expenseId: number) => void;
}

const ExpenseItem: React.FC<ExpenseItemProps> = ({ 
  item, 
  currentUserId,
  pendingExpenseIds = [],
  onPress
}) => {
  const isCreator = item.creatorId === currentUserId;
  const isPending = pendingExpenseIds.includes(item.id);
  
  // Determinando a cor do status
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'APPROVED': return '#4CAF50';
      case 'PENDING': return '#FFC107';
      case 'REJECTED': return '#FF6347';
      case 'REIMBURSED': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  // Texto amigável do status
  const getStatusText = (status: string) => {
    switch(status) {
      case 'APPROVED': return 'Aprovada';
      case 'PENDING': return 'Pendente';
      case 'REJECTED': return 'Rejeitada';
      case 'REIMBURSED': return 'Reembolsada';
      default: return status;
    }
  };

  // Formatação de data
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    
    try {
      const date = parseISO(dateString);
      return format(date, "dd MMM yyyy", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };
  
  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <TouchableOpacity
      style={[
        styles.expenseItem, 
        isPending && styles.pendingExpenseItem,
        isCreator && styles.creatorExpenseItem
      ]}
      onPress={() => onPress(item.id)}
      disabled={isPending}
    >
      {/* Status indicator */}
      <View style={[styles.statusBar, { backgroundColor: getStatusColor(item.status) }]} />
      
      <View style={styles.expenseContent}>
        <View style={styles.expenseHeader}>
          <Text style={styles.expenseTitle} numberOfLines={1}>
            {item.description}
          </Text>
          
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
        
        <View style={styles.expenseDetails}>
          <View style={styles.expenseDateContainer}>
            <Ionicons name="calendar-outline" size={14} color="#aaa" />
            <Text style={styles.expenseDateText}>
              {formatDate(item.expenseDate)}
            </Text>
          </View>
          
          {item.category && (
            <View style={styles.categoryChip}>
              <FontAwesome5 name="tag" size={12} color="#7B68EE" />
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.expenseFooter}>
          <Text style={styles.expenseAmount}>{formatCurrency(item.amount)}</Text>
          
          <View style={styles.creatorContainer}>
            {item.creatorProfilePictureUrl ? (
              <Image 
                source={{ uri: item.creatorProfilePictureUrl }} 
                style={styles.creatorAvatar}
              />
            ) : (
              <View style={styles.creatorAvatarPlaceholder}>
                <Text style={styles.creatorInitials}>
                  {item.creatorName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.creatorName}>
              {item.creatorName}
              {isCreator ? ' (Você)' : ''}
            </Text>
          </View>
        </View>
      </View>
      
      {isPending && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#7B68EE" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  expenseItem: {
    backgroundColor: '#333',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    flexDirection: 'row',
    position: 'relative',
  },
  statusBar: {
    width: 5,
    height: '100%',
  },
  expenseContent: {
    flex: 1,
    padding: 16,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  expenseDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 10,
  },
  expenseDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseDateText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#ccc',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  categoryText: {
    color: '#7B68EE',
    fontSize: 12,
    marginLeft: 4,
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  pendingExpenseItem: {
    opacity: 0.7,
  },
  creatorExpenseItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#7B68EE',
    borderRadius: 10
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  creatorAvatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  creatorInitials: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  creatorName: {
    fontSize: 12,
    color: '#ccc',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  }
});

export default ExpenseItem;