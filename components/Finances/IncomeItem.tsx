// components/Finances/IncomeItem.tsx
import React from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Income } from '../../src/models/income.model';

interface IncomeItemProps {
  item: Income;
  currentUserId?: string;
  onPress: (incomeId: number) => void;
}

const IncomeItem: React.FC<IncomeItemProps> = ({ 
  item, 
  currentUserId,
  onPress
}) => {
  const isContributor = item.contributorId === currentUserId;
  
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

  // Ícone para a fonte de receita
  const getSourceIcon = (source: string) => {
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
      style={[
        styles.incomeItem, 
        isContributor && styles.contributorIncomeItem
      ]}
      onPress={() => onPress(item.id)}
    >
      <View style={styles.incomeIconContainer}>
        <Ionicons 
          name={getSourceIcon(item.source) as any} 
          size={24} 
          color="#4CAF50" 
        />
      </View>
      
      <View style={styles.incomeContent}>
        <View style={styles.incomeHeader}>
          <Text style={styles.incomeTitle} numberOfLines={1}>
            {item.description}
          </Text>
        </View>
        
        <View style={styles.incomeDetails}>
          <View style={styles.incomeDateContainer}>
            <Ionicons name="calendar-outline" size={14} color="#aaa" />
            <Text style={styles.incomeDateText}>
              {formatDate(item.incomeDate)}
            </Text>
          </View>
          
          {item.source && (
            <View style={styles.sourceChip}>
              <Text style={styles.sourceText}>{item.source}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.incomeFooter}>
          <Text style={styles.incomeAmount}>{formatCurrency(item.amount)}</Text>
          
          <View style={styles.contributorContainer}>
            {item.contributorProfilePictureUrl ? (
              <Image 
                source={{ uri: item.contributorProfilePictureUrl }} 
                style={styles.contributorAvatar}
              />
            ) : (
              <View style={styles.contributorAvatarPlaceholder}>
                <Text style={styles.contributorInitials}>
                  {item.contributorName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.contributorName}>
              {item.contributorName}
              {isContributor ? ' (Você)' : ''}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  incomeItem: {
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
  },
  incomeIconContainer: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 10,
  },
  incomeContent: {
    flex: 1,
    padding: 16,
    paddingLeft: 10,
  },
  incomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  incomeTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  incomeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 10,
  },
  incomeDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  incomeDateText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#ccc',
  },
  sourceChip: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  sourceText: {
    color: '#4CAF50',
    fontSize: 12,
  },
  incomeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  incomeAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  contributorIncomeItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
    borderRadius: 10
  },
  contributorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contributorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  contributorAvatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  contributorInitials: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  contributorName: {
    fontSize: 12,
    color: '#ccc',
  }
});

export default IncomeItem;