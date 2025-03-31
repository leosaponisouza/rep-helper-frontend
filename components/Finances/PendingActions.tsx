// components/Finances/PendingActions.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { PendingAction, Expense } from '../../src/models/finances.model';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import FinanceItem from './FinanceItem';

interface PendingActionsProps {
  actions: PendingAction[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onPressAction: (action: PendingAction) => void;
  onPressViewAll: () => void;
  onApprove?: (id: number) => Promise<void>;
  onReject?: (id: number) => Promise<void>;
  maxItems?: number;
}

const PendingActionItem: React.FC<{ 
  item: PendingAction; 
  onPress: (action: PendingAction) => void;
  onApprove?: (id: number) => Promise<void>;
  onReject?: (id: number) => Promise<void>;
}> = ({ item, onPress, onApprove, onReject }) => {
  
  // Handle approve action
  const handleApprove = async () => {
    if (!onApprove) return;
    
    try {
      await onApprove(item.id);
    } catch (error) {
      console.error('Error approving expense:', error);
      Alert.alert('Erro', 'Não foi possível aprovar esta despesa. Tente novamente.');
    }
  };

  // Handle reject action
  const handleReject = async () => {
    if (!onReject) return;

    Alert.prompt(
      'Motivo da rejeição',
      'Informe o motivo para rejeitar esta despesa:',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Rejeitar',
          style: 'destructive',
          onPress: async (reason) => {
            if (!reason || reason.trim() === '') {
              Alert.alert('Erro', 'É necessário informar um motivo para rejeitar a despesa.');
              return;
            }

            try {
              // We would pass the reason here if onReject supported it
              await onReject(item.id);
            } catch (error) {
              console.error('Error rejecting expense:', error);
              Alert.alert('Erro', 'Não foi possível rejeitar esta despesa. Tente novamente.');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  return (
    <View style={styles.pendingItemWrapper}>
      <FinanceItem 
        item={item} 
        type="expense" 
        onPress={() => onPress(item)}
      />
      
      {/* Quick action buttons */}
      {(onApprove || onReject) && (
        <View style={styles.quickActions}>
          {onApprove && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.approveButton]}
              onPress={handleApprove}
            >
              <MaterialIcons name="check-circle" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Aprovar</Text>
            </TouchableOpacity>
          )}
          
          {onReject && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]}
              onPress={handleReject}
            >
              <MaterialIcons name="cancel" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Rejeitar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const PendingActions: React.FC<PendingActionsProps> = ({
  actions,
  loading,
  error,
  onRetry,
  onPressAction,
  onPressViewAll,
  onApprove,
  onReject,
  maxItems = 3 // Limitando a 3 itens por padrão
}) => {
  // Make sure actions is always an array
  const safeActions = Array.isArray(actions) ? actions : [];
  
  // Filter to include only PENDING status items and limit number of items
  const pendingActions = safeActions
    .filter(action => action.status === 'PENDING')
    .slice(0, maxItems);

  // Log for debugging
  console.log(`Rendering ${pendingActions.length} pending actions (from ${safeActions.length} total)`);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Ações Pendentes</Text>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#7B68EE" />
          <Text style={styles.loadingText}>Carregando ações pendentes...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Ações Pendentes</Text>
        </View>
        
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#FF6347" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={onRetry}
          >
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // If no pending actions, don't render the component at all
  if (pendingActions.length === 0) {
    return null;
  }

  // Calculate total pending actions not shown in this view
  const remainingCount = safeActions.filter(action => action.status === 'PENDING').length - pendingActions.length;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Ações Pendentes</Text>
        
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={onPressViewAll}
        >
          <Text style={styles.viewAllText}>Ver todas</Text>
          <Ionicons name="chevron-forward" size={16} color="#7B68EE" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.actionsList}>
        {pendingActions.map(item => (
          <PendingActionItem 
            key={`pending-${item.id}`}
            item={item} 
            onPress={onPressAction}
            onApprove={onApprove}
            onReject={onReject}
          />
        ))}
        
        {remainingCount > 0 && (
          <TouchableOpacity 
            style={styles.viewMoreButton}
            onPress={onPressViewAll}
          >
            <Text style={styles.viewMoreText}>
              Ver mais {remainingCount} ações pendentes
            </Text>
            <Ionicons name="chevron-down" size={16} color="#7B68EE" />
          </TouchableOpacity>
        )}
      </View>
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
  actionsList: {
    // Removendo a propriedade maxHeight, pois não estamos mais usando FlatList
  },
  actionsListContent: {
    // Isso pode ser removido, pois não estamos mais usando FlatList
  },
  pendingItemWrapper: {
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#FF6347',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
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

export default PendingActions;