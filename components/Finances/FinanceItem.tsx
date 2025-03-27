import React, { memo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  Platform
} from 'react-native';
import { Income, Expense, PendingAction } from '../../src/models/finances.model';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type FinanceItemType = Income | Expense | PendingAction;

interface FinanceItemProps {
  item: FinanceItemType;
  type: 'income' | 'expense';
  onPress: (item: any) => void;
  currentUserId?: string;
}

const FinanceItem: React.FC<FinanceItemProps> = ({ item, type, onPress, currentUserId }) => {
  const isIncome = type === 'income';
  const isExpense = type === 'expense';
  const isPendingAction = 'status' in item && !('type' in item);
  
  // Primary color based on type
  const primaryColor = isIncome ? '#4CAF50' : '#FF5252';
  
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
      return format(date, "d 'de' MMMM", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  // Get category/source icon for expense or income
  const getCategoryIcon = (category: string | undefined): string => {
    if (!category) return 'cash';
    
    const lowerCategory = category.toLowerCase();
    
    // Income source icons
    if (isIncome) {
      switch(lowerCategory) {
        case 'contribuição':
        case 'contribuicao':
          return 'cash-plus';
        case 'evento':
          return 'calendar-star';
        case 'reembolso':
          return 'cash-refund';
        case 'mensalidade':
          return 'calendar-month';
        case 'doação':
        case 'doacao':
          return 'gift';
        case 'investimento':
          return 'trending-up';
        case 'vendas':
          return 'shopping';
        case 'repasse':
          return 'bank-transfer';
        default:
          return 'cash';
      }
    } 
    // Expense category icons
    else {
      switch(lowerCategory) {
        case 'alimentação':
        case 'alimentacao':
          return 'food';
        case 'aluguel':
          return 'home';
        case 'contas':
          return 'file-document';
        case 'manutenção':
        case 'manutencao':
          return 'tools';
        case 'limpeza':
          return 'water';
        case 'eventos':
          return 'calendar';
        case 'outros':
          return 'dots-horizontal-circle';
        default:
          return 'cash';
      }
    }
  };

  // Get status info for expenses
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { 
          color: '#FFA500', 
          text: 'Pendente',
          icon: 'clock-outline'
        };
      case 'APPROVED':
        return { 
          color: '#4CAF50', 
          text: 'Aprovada',
          icon: 'check-circle'
        };
      case 'REJECTED':
        return { 
          color: '#F44336', 
          text: 'Rejeitada',
          icon: 'close-circle'
        };
      case 'REIMBURSED':
        return { 
          color: '#2196F3', 
          text: 'Reembolsada',
          icon: 'cash'
        };
      default:
        return { 
          color: '#aaa', 
          text: status,
          icon: 'help-circle'
        };
    }
  };
  
  // Determine category/source field name based on type
  let categoryValue, dateValue, notes, statusInfo;
  
  if (isPendingAction) {
    // Para PendingAction
    categoryValue = (item as PendingAction).category || 'Outros';
    dateValue = (item as PendingAction).expenseDate;
    notes = 'notes' in item ? item.notes : undefined;
    statusInfo = getStatusInfo((item as PendingAction).status);
  } else if (isIncome) {
    // Para Income
    categoryValue = (item as Income).source;
    dateValue = (item as Income).incomeDate;
    notes = 'notes' in item ? item.notes : undefined;
    statusInfo = { color: primaryColor, text: 'Recebido', icon: 'check' };
  } else {
    // Para Expense
    categoryValue = (item as Expense).category;
    dateValue = (item as Expense).expenseDate;
    notes = 'notes' in item ? item.notes : undefined;
    statusInfo = getStatusInfo((item as Expense).status);
  }
  
  const categoryLabel = isIncome ? 'Sem fonte' : 'Sem categoria';
  
  // Determine user info
  let creatorName, creatorId, creatorProfilePictureUrl;
  
  if (isPendingAction) {
    creatorName = (item as PendingAction).creatorName;
    creatorId = (item as PendingAction).creatorId;
    creatorProfilePictureUrl = (item as PendingAction).creatorProfilePictureUrl;
  } else if (isIncome) {
    creatorName = (item as Income).contributorName || '';
    creatorId = (item as Income).contributorId || '';
    creatorProfilePictureUrl = (item as Income).contributorProfilePictureUrl;
  } else {
    creatorName = (item as Expense).creatorName;
    creatorId = (item as Expense).creatorId;
    creatorProfilePictureUrl = (item as Expense).creatorProfilePictureUrl;
  }
    
  // Verifica se o criador é o usuário atual
  const isCurrentUserCreator = currentUserId && creatorId === currentUserId;

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => onPress(item)}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['#2A2A2A', '#333']}
        style={styles.gradient}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {item.description}
            </Text>
            <View style={[
              styles.categoryBadge,
              { backgroundColor: `${primaryColor}20` }
            ]}>
              <MaterialCommunityIcons 
                name={getCategoryIcon(categoryValue) as any} 
                size={12} 
                color={primaryColor} 
              />
              <Text style={[styles.categoryText, { color: primaryColor }]}>
                {categoryValue || categoryLabel}
              </Text>
            </View>
          </View>
          
          <View style={styles.amountContainer}>
            <Text style={[styles.amount, { color: primaryColor }]}>
              {formatCurrency(item.amount)}
            </Text>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: `${statusInfo.color}20` }
            ]}>
              <MaterialCommunityIcons 
                name={statusInfo.icon as any} 
                size={12} 
                color={statusInfo.color} 
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
        
        {typeof notes === 'string' && notes.trim() !== '' && (
          <Text style={styles.notes} numberOfLines={2}>
            {notes}
          </Text>
        )}
        
        <View style={styles.footer}>
          <View style={styles.infoContainer}>
            {dateValue && (
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="calendar" size={16} color="#aaa" />
                <Text style={styles.infoText}>{formatDate(dateValue)}</Text>
              </View>
            )}
          </View>

          <View style={styles.creatorContainer}>
            {creatorProfilePictureUrl ? (
              <Image 
                source={{ uri: creatorProfilePictureUrl }} 
                style={styles.creatorAvatar}
              />
            ) : (
              <View style={styles.creatorAvatarPlaceholder}>
                <Text style={styles.creatorInitials}>
                  {creatorName?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <Text style={styles.creatorName} numberOfLines={1}>
              {isCurrentUserCreator ? 'Você' : creatorName}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  gradient: {
    padding: 20,
    paddingLeft: 16,
    minHeight: 150,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    marginLeft: 4,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  notes: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 16,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  infoContainer: {
    flex: 1,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#aaa',
    marginLeft: 8,
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
    color: '#ddd',
  },
});

export default memo(FinanceItem); 