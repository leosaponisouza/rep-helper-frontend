// components/Finances/ExpenseItem.tsx
import React from 'react';
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
      return format(date, "dd MMM yyyy", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  // Status da despesa
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#FFC107'; // Amarelo
      case 'APPROVED':
        return '#4CAF50'; // Verde
      case 'REJECTED':
        return '#FF6347'; // Vermelho
      default:
        return '#aaa';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendente';
      case 'APPROVED':
        return 'Aprovada';
      case 'REJECTED':
        return 'Rejeitada';
      default:
        return status;
    }
  };

  // Ícone da categoria
  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'alimentação':
      case 'alimentacao':
        return 'fast-food';
      case 'transporte':
        return 'car';
      case 'moradia':
        return 'home';
      case 'saúde':
      case 'saude':
        return 'medical';
      case 'educação':
      case 'educacao':
        return 'school';
      case 'lazer':
        return 'game-controller';
      case 'vestuário':
      case 'vestuario':
        return 'shirt';
      case 'utilidades':
        return 'bulb';
      case 'outros':
        return 'ellipsis-horizontal-circle';
      default:
        return 'cash';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => onPress(expense)}
    >
      <View 
        style={[
          styles.statusIndicator, 
          { backgroundColor: getStatusColor(expense.status) }
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
            <Text style={styles.creatorName}>
              {expense.creatorName}
            </Text>
          </View>
          
          <View style={styles.meta}>
            <Text style={styles.date}>
              {formatDate(expense.date)}
            </Text>
            
            <View style={[
              styles.statusBadge, 
              { backgroundColor: `${getStatusColor(expense.status)}20` }
            ]}>
              <Text style={[
                styles.statusText, 
                { color: getStatusColor(expense.status) }
              ]}>
                {getStatusText(expense.status)}
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
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  }
});

export default ExpenseItem;