// components/Finances/PendingActions.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { PendingAction } from '../../src/models/finances.model';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PendingActionsProps {
  actions: PendingAction[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onPressAction: (action: PendingAction) => void;
  onPressViewAll: () => void;
  onApprove?: (id: number) => Promise<void>;
  onReject?: (id: number) => Promise<void>;
}

const PendingActionItem: React.FC<{ 
  item: PendingAction; 
  onPress: (action: PendingAction) => void;
  onApprove?: (id: number) => Promise<void>;
  onReject?: (id: number) => Promise<void>;
}> = ({ item, onPress, onApprove, onReject }) => {
  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatação de data - supports both date and expenseDate fields
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = parseISO(dateString);
      return format(date, "dd MMM yyyy", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  // Get date from either date or expenseDate field
  const displayDate = item.expenseDate;

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
    <TouchableOpacity 
      style={styles.actionItem}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View 
        style={[
          styles.statusIndicator, 
          { backgroundColor: '#FFC107' }
        ]} 
      />
      
      <View style={styles.actionContent}>
        <View style={styles.actionHeader}>
          <Text style={styles.actionTitle} numberOfLines={1}>
            {item.description}
          </Text>
          
          <Text style={styles.actionAmount}>
            {formatCurrency(item.amount)}
          </Text>
        </View>
        
        <View style={styles.actionFooter}>
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
              {item.creatorNickname || item.creatorName}
            </Text>
          </View>
          
          <View style={styles.actionMeta}>
            <Text style={styles.actionDate}>
              {formatDate(displayDate)}
            </Text>
            
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                Pendente
              </Text>
            </View>
          </View>
        </View>

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
    </TouchableOpacity>
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
  onReject
}) => {
  // Make sure actions is always an array
  const safeActions = Array.isArray(actions) ? actions : [];
  
  // Filter to include only PENDING status items
  const pendingActions = safeActions.filter(action => action.status === 'PENDING');

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
      
      <FlatList
        data={pendingActions}
        keyExtractor={(item) => `pending-${item.id}`}
        renderItem={({ item }) => (
          <PendingActionItem 
            item={item} 
            onPress={onPressAction}
            onApprove={onApprove}
            onReject={onReject}
          />
        )}
        style={styles.actionsList}
        contentContainerStyle={styles.actionsListContent}
        showsVerticalScrollIndicator={false}
      />
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
    maxHeight: 300,
  },
  actionsListContent: {
    paddingBottom: 8,
  },
  actionItem: {
    flexDirection: 'row',
    backgroundColor: '#444',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  statusIndicator: {
    width: 4,
    height: '100%',
  },
  actionContent: {
    flex: 1,
    padding: 12,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  actionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  actionMeta: {
    alignItems: 'flex-end',
  },
  actionDate: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFC107',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)', // Green with opacity
  },
  rejectButton: {
    backgroundColor: 'rgba(255, 99, 71, 0.8)', // Red with opacity
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  }
});

export default PendingActions;