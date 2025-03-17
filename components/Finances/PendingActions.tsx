// components/Finances/PendingActions.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
}

const PendingActionItem: React.FC<{ 
  item: PendingAction; 
  onPress: (action: PendingAction) => void;
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
      return format(date, "dd MMM yyyy", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  // Status da ação
  const getStatusColor = (status: string) => {
    return status === 'APPROVED' ? '#4CAF50' : '#FFC107';
  };

  const getStatusText = (status: string) => {
    return status === 'APPROVED' ? 'Aprovada' : 'Pendente';
  };

  return (
    <TouchableOpacity 
      style={styles.actionItem}
      onPress={() => onPress(item)}
    >
      <View 
        style={[
          styles.statusIndicator, 
          { backgroundColor: getStatusColor(item.status) }
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
              {item.creatorName}
            </Text>
          </View>
          
          <View style={styles.actionMeta}>
            <Text style={styles.actionDate}>
              {formatDate(item.date)}
            </Text>
            
            <View style={[
              styles.statusBadge, 
              { backgroundColor: `${getStatusColor(item.status)}20` }
            ]}>
              <Text style={[
                styles.statusText, 
                { color: getStatusColor(item.status) }
              ]}>
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>
        </View>
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
  onPressViewAll
}) => {
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
      
      {actions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle" size={40} color="#7B68EE" style={{ opacity: 0.6 }} />
          <Text style={styles.emptyText}>
            Não há ações pendentes
          </Text>
        </View>
      ) : (
        <FlatList
          data={actions}
          keyExtractor={(item) => `${item.id}`}
          renderItem={({ item }) => (
            <PendingActionItem 
              item={item} 
              onPress={onPressAction} 
            />
          )}
          style={styles.actionsList}
        />
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
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  }
});

export default PendingActions;