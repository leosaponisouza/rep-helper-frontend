// components/Finances/ExpenseItem.tsx
import React, { memo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image 
} from 'react-native';
import { Expense } from '../../src/models/finances.model';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';

interface ExpenseItemProps {
  expense: Expense;
  onPress: (expense: Expense) => void;
}

const ExpenseItem: React.FC<ExpenseItemProps> = ({ expense, onPress }) => {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = parseISO(dateString);
      return format(date, "dd MMM yyyy", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  // Get status info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { 
          color: '#FFC107', 
          text: 'Pendente',
          icon: 'time-outline'
        };
      case 'APPROVED':
        return { 
          color: '#4CAF50', 
          text: 'Aprovada',
          icon: 'checkmark-circle-outline'
        };
      case 'REJECTED':
        return { 
          color: '#FF6347', 
          text: 'Rejeitada',
          icon: 'close-circle-outline'
        };
      case 'REIMBURSED':
        return { 
          color: '#2196F3', 
          text: 'Reembolsada',
          icon: 'cash-outline'
        };
      default:
        return { 
          color: '#aaa', 
          text: status,
          icon: 'help-circle-outline'
        };
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'alimentação':
      case 'alimentacao':
        return 'fast-food';
      case 'aluguel':
        return 'home';
      case 'contas':
        return 'document-text';
      case 'manutenção':
      case 'manutencao':
        return 'construct';
      case 'limpeza':
        return 'water';
      case 'eventos':
        return 'calendar';
      case 'outros':
        return 'ellipsis-horizontal-circle';
      default:
        return 'cash';
    }
  };

  const statusInfo = getStatusInfo(expense.status);

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => onPress(expense)}
      activeOpacity={0.7}
    >
      <View 
        style={[
          styles.statusIndicator, 
          { backgroundColor: statusInfo.color }
        ]} 
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {expense.description}
            </Text>
            
            <View style={styles.categoryContainer}>
              <Ionicons 
                name={getCategoryIcon(expense.category) as any} 
                size={12} 
                color="#aaa" 
              />
              <Text style={styles.category}>
                {expense.category || 'Sem categoria'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.amount}>
            {formatCurrency(expense.amount)}
          </Text>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.creatorContainer}>
            {expense.creatorProfilePictureUrl ? (
              <Image 
                source={{ uri: expense.creatorProfilePictureUrl }} 
                style={styles.creatorAvatar}
              />
            ) : (
              <View style={styles.creatorAvatarPlaceholder}>
                <Text style={styles.creatorInitials}>
                  {expense.creatorName?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <Text style={styles.creatorName} numberOfLines={1}>
              {expense.creatorName}
            </Text>
          </View>
          
          <View style={styles.meta}>
            <Text style={styles.date}>
              {formatDate(expense.expenseDate)}
            </Text>
            
            <View style={[
              styles.statusBadge, 
              { backgroundColor: `${statusInfo.color}20` }
            ]}>
              <Ionicons 
                name={statusInfo.icon as any} 
                size={10} 
                color={statusInfo.color} 
                style={styles.statusIcon}
              />
              <Text style={[
                styles.statusText, 
                { color: statusInfo.color }
              ]}>
                {statusInfo.text}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusIndicator: {
    width: 4,
    height: '100%',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    fontSize: 12,
    color: '#aaa',
    marginLeft: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '50%',
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
  meta: {
    alignItems: 'flex-end',
  },
  date: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusIcon: {
    marginRight: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  }
});

// Use memo to prevent unnecessary re-renders
export default memo(ExpenseItem);