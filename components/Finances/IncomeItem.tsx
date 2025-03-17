// components/Finances/IncomeItem.tsx
import React, { memo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image 
} from 'react-native';
import { Income } from '../../src/models/finances.model';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';

interface IncomeItemProps {
  income: Income;
  onPress: (income: Income) => void;
}

const IncomeItem: React.FC<IncomeItemProps> = ({ income, onPress }) => {
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

  // Get source icon
  const getSourceIcon = (source: string | undefined): string => {
    if (!source) return 'cash';
    
    switch(source.toLowerCase()) {
      case 'contribuição':
      case 'contribuicao':
        return 'wallet';
      case 'evento':
        return 'calendar';
      case 'reembolso':
        return 'refresh-circle';
      default:
        return 'cash';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => onPress(income)}
      activeOpacity={0.7}
    >
      <View 
        style={styles.statusIndicator}
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {income.description}
            </Text>
            
            <View style={styles.sourceContainer}>
              <Ionicons 
                name={getSourceIcon(income.source) as any} 
                size={12} 
                color="#aaa" 
              />
              <Text style={styles.source}>
                {income.source || 'Sem fonte'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.amount}>
            {formatCurrency(income.amount)}
          </Text>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.creatorContainer}>
            {income.creatorProfilePictureUrl ? (
              <Image 
                source={{ uri: income.creatorProfilePictureUrl }} 
                style={styles.creatorAvatar}
              />
            ) : (
              <View style={styles.creatorAvatarPlaceholder}>
                <Text style={styles.creatorInitials}>
                  {income.creatorName?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <Text style={styles.creatorName} numberOfLines={1}>
              {income.creatorName}
            </Text>
          </View>
          
          <View style={styles.meta}>
            <Text style={styles.date}>
              {formatDate(income.incomeDate)}
            </Text>
            
            <View style={styles.statusBadge}>
              <Ionicons 
                name="checkmark-circle" 
                size={10} 
                color="#4CAF50" 
                style={styles.statusIcon}
              />
              <Text style={styles.statusText}>
                Recebido
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
    backgroundColor: '#4CAF50',
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
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  source: {
    fontSize: 12,
    color: '#aaa',
    marginLeft: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
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
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  statusIcon: {
    marginRight: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4CAF50',
  }
});

// Use memo to prevent unnecessary re-renders
export default memo(IncomeItem);