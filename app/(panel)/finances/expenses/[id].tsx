// app/(panel)/finances/expenses/[id].tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Share,
  Linking,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinances } from '../../../../src/hooks/useFinances';
import { useAuth } from '../../../../src/context/AuthContext';
import { ErrorHandler } from '../../../../src/utils/errorHandling';
import { Expense } from '../../../../src/models/finances.model';

// Timeline status item component
const TimelineItem = ({ 
  title, 
  date, 
  isCompleted, 
  isRejected, 
  rejectionReason 
}: { 
  title: string; 
  date?: string | null; 
  isCompleted: boolean; 
  isRejected?: boolean;
  rejectionReason?: string;
}) => {
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    
    try {
      const date = parseISO(dateString);
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <View style={[
      styles.timelineItem,
      isRejected && styles.rejectedTimelineItem,
      !isCompleted && !isRejected && styles.pendingTimelineItem
    ]}>
      <View style={[
        styles.timelineDot,
        isCompleted && styles.completedTimelineDot,
        isRejected && styles.rejectedTimelineDot,
        !isCompleted && !isRejected && styles.pendingTimelineDot
      ]} />
      <View style={styles.timelineContent}>
        <Text style={[
          styles.timelineTitle,
          !isCompleted && !isRejected && styles.pendingTimelineText,
          isRejected && styles.rejectedTimelineText
        ]}>{title}</Text>
        
        {date && (
          <Text style={styles.timelineDate}>{formatDate(date)}</Text>
        )}
        
        {isRejected && rejectionReason && (
          <Text style={styles.rejectionReason}>
            Motivo: {rejectionReason}
          </Text>
        )}
      </View>
    </View>
  );
};

// Action Button component
const ActionButton = ({ 
  title, 
  iconName, 
  color, 
  onPress, 
  isLoading, 
  disabled 
}: { 
  title: string; 
  iconName: string; 
  color: string; 
  onPress: () => void; 
  isLoading?: boolean;
  disabled?: boolean;
}) => (
  <TouchableOpacity 
    style={[
      styles.actionButton, 
      { backgroundColor: color }, 
      (isLoading || disabled) && styles.disabledButton
    ]}
    onPress={onPress}
    disabled={isLoading || disabled}
  >
    {isLoading ? (
      <ActivityIndicator size="small" color="#fff" />
    ) : (
      <>
        <Ionicons name={iconName as any} size={20} color="#fff" style={styles.actionButtonIcon} />
        <Text style={styles.actionButtonText}>{title}</Text>
      </>
    )}
  </TouchableOpacity>
);

// Main Component
const ExpenseDetailsScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const { 
    getExpenseById, 
    approveExpense, 
    rejectExpense, 
    reimburseExpense,
    resetExpenseStatus,
    deleteExpense
  } = useFinances();

  // Fetch expense details
  const fetchExpenseDetails = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await getExpenseById(Number(id));
      setExpense(data);
    } catch (error) {
      ErrorHandler.handle(error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes da despesa.');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, getExpenseById, router]);

  // Initial data fetch
  useEffect(() => {
    fetchExpenseDetails();
  }, [fetchExpenseDetails]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    
    try {
      const date = parseISO(dateString);
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  // Status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'APPROVED': return '#4CAF50';
      case 'PENDING': return '#FFC107';
      case 'REJECTED': return '#FF6347';
      case 'REIMBURSED': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  // Status text
  const getStatusText = (status: string) => {
    switch(status) {
      case 'APPROVED': return 'Aprovada';
      case 'PENDING': return 'Pendente';
      case 'REJECTED': return 'Rejeitada';
      case 'REIMBURSED': return 'Reembolsada';
      default: return status;
    }
  };

  // Action handlers
  const handleApproveExpense = async () => {
    if (!expense) return;
    
    try {
      setActionLoading(true);
      await approveExpense(expense.id);
      await fetchExpenseDetails();
      Alert.alert('Sucesso', 'Despesa aprovada com sucesso!');
    } catch (error) {
      ErrorHandler.handle(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectExpense = async () => {
    if (!expense) return;
    
    Alert.prompt(
      'Rejeitar Despesa',
      'Por favor, informe o motivo da rejeição:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rejeitar',
          style: 'destructive',
          onPress: async (reason?: string) => {
            if (!reason) {
              Alert.alert('Erro', 'É necessário informar um motivo para rejeição.');
              return;
            }
            
            try {
              setActionLoading(true);
              await rejectExpense(expense.id, { reason });
              await fetchExpenseDetails();
              Alert.alert('Sucesso', 'Despesa rejeitada com sucesso!');
            } catch (error) {
              ErrorHandler.handle(error);
            } finally {
              setActionLoading(false);
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const handleReimburseExpense = async () => {
    if (!expense) return;
    
    try {
      setActionLoading(true);
      await reimburseExpense(expense.id);
      await fetchExpenseDetails();
      Alert.alert('Sucesso', 'Despesa marcada como reembolsada!');
    } catch (error) {
      ErrorHandler.handle(error);
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleResetExpenseStatus = async () => {
    if (!expense) return;
    
    try {
      setActionLoading(true);
      await resetExpenseStatus(expense.id);
      await fetchExpenseDetails();
      Alert.alert('Sucesso', 'Status da despesa redefinido para pendente!');
    } catch (error) {
      ErrorHandler.handle(error);
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleDeleteExpense = async () => {
    if (!expense) return;
    
    Alert.alert(
      'Excluir Despesa',
      'Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await deleteExpense(expense.id);
              Alert.alert('Sucesso', 'Despesa excluída com sucesso!');
              router.back();
            } catch (error) {
              ErrorHandler.handle(error);
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  // Share expense details
  const shareExpense = async () => {
    if (!expense) return;
    
    try {
      await Share.share({
        message: `Despesa: ${expense.description}\nValor: ${formatCurrency(expense.amount)}\nData: ${formatDate(expense.expenseDate)}\nStatus: ${getStatusText(expense.status)}`
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      Alert.alert('Erro', 'Não foi possível compartilhar esta despesa.');
    }
  };

  // View receipt in full screen
  const viewReceipt = () => {
    if (!expense?.receiptUrl) return;
    
    // Try to open the image in the device's default image viewer
    Linking.openURL(expense.receiptUrl).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o comprovante.');
    });
  };

  // Check permissions for different actions
  const canApprove = expense?.status === 'PENDING' && user?.isAdmin === true;
  const canReimburse = expense?.status === 'APPROVED' && user?.isAdmin === true;
  const canReset = (expense?.status === 'REJECTED' || expense?.status === 'APPROVED') && user?.isAdmin === true;
  const isCreator = expense?.creatorId === user?.uid;
  const canEdit = isCreator && (expense?.status === 'PENDING' || expense?.status === 'REJECTED');
  const canDelete = (isCreator || user?.isAdmin === true) && expense?.status !== 'REIMBURSED';

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#222" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B68EE" />
          <Text style={styles.loadingText}>Carregando detalhes da despesa...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (!expense) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#222" />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={80} color="#FF6347" />
          <Text style={styles.errorTitle}>Despesa não encontrada</Text>
          <TouchableOpacity 
            style={styles.errorButton}
            onPress={() => router.back()}
          >
            <Text style={styles.errorButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#7B68EE" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Despesa</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={shareExpense}
        >
          <Ionicons name="share-outline" size={24} color="#7B68EE" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.container}>
        {/* Expense Header Section */}
        <View style={styles.expenseHeaderSection}>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: `${getStatusColor(expense.status)}20` }
            ]}>
              <Text style={[styles.statusText, { color: getStatusColor(expense.status) }]}>
                {getStatusText(expense.status)}
              </Text>
            </View>
            
            {isCreator && (
              <View style={styles.creatorBadge}>
                <Text style={styles.creatorText}>Você criou esta despesa</Text>
              </View>
            )}

            {expense.category && (
              <View style={styles.categoryChip}>
                <FontAwesome5 name="tag" size={14} color="#7B68EE" />
                <Text style={styles.categoryText}>{expense.category}</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.expenseTitle}>{expense.description}</Text>
          <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
          
          <View style={styles.expenseMetaContainer}>
            <View style={styles.expenseMetaItem}>
              <Ionicons name="calendar-outline" size={16} color="#7B68EE" />
              <Text style={styles.expenseMetaText}>
                {formatDate(expense.expenseDate)}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Creator Info Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Criado por</Text>
          <View style={styles.creatorContainer}>
            {expense.creatorProfilePictureUrl ? (
              <Image 
                source={{ uri: expense.creatorProfilePictureUrl }} 
                style={styles.creatorAvatar}
              />
            ) : (
              <View style={styles.creatorAvatarPlaceholder}>
                <Text style={styles.creatorInitials}>
                  {expense.creatorName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            
            <View style={styles.creatorInfo}>
              <Text style={styles.creatorName}>
                {expense.creatorName}
                {isCreator ? ' (Você)' : ''}
              </Text>
              <Text style={styles.createdAt}>
                Em {formatDate(expense.createdAt)}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Status History Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Status da Despesa</Text>
          
          <View style={styles.timelineContainer}>
            {/* Created */}
            <TimelineItem 
              title="Criada" 
              date={expense.createdAt} 
              isCompleted={true} 
            />
            
            {/* Approved */}
            <TimelineItem 
              title="Aprovada" 
              date={expense.approvalDate} 
              isCompleted={['APPROVED', 'REIMBURSED'].includes(expense.status)} 
            />
            
            {/* Reimbursed */}
            <TimelineItem 
              title="Reembolsada" 
              date={expense.reimbursementDate} 
              isCompleted={expense.status === 'REIMBURSED'} 
            />
            
            {/* Rejected (only show if rejected) */}
            {expense.status === 'REJECTED' && (
              <TimelineItem 
                title="Rejeitada" 
                date={expense.updatedAt} 
                isCompleted={true} 
                isRejected={true}
                rejectionReason={expense.rejectionReason}
              />
            )}
          </View>
        </View>
        
        {/* Notes Section (if available) */}
        {expense.notes && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Observações</Text>
            <Text style={styles.notesText}>{expense.notes}</Text>
          </View>
        )}
        
        {/* Receipt Section (if available) */}
        {expense.receiptUrl && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Comprovante</Text>
            <TouchableOpacity 
              style={styles.receiptContainer}
              onPress={viewReceipt}
              activeOpacity={0.9}
            >
              <Image 
                source={{ uri: expense.receiptUrl }} 
                style={styles.receiptImage}
                resizeMode="contain"
              />
              <View style={styles.viewReceiptOverlay}>
                <Ionicons name="eye" size={24} color="#fff" />
                <Text style={styles.viewReceiptText}>Visualizar</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Action Buttons (based on permissions) */}
        <View style={styles.actionsContainer}>
          {/* Admin Actions */}
          {canApprove && (
            <View style={styles.actionGroup}>
              <ActionButton 
                title="Aprovar" 
                iconName="checkmark-circle" 
                color="#4CAF50" 
                onPress={handleApproveExpense} 
                isLoading={actionLoading} 
              />
              
              <ActionButton 
                title="Rejeitar" 
                iconName="close-circle" 
                color="#FF6347" 
                onPress={handleRejectExpense} 
                isLoading={actionLoading} 
              />
            </View>
          )}
          
          {canReimburse && (
            <ActionButton 
              title="Marcar como Reembolsada" 
              iconName="cash-outline" 
              color="#2196F3" 
              onPress={handleReimburseExpense} 
              isLoading={actionLoading} 
            />
          )}
          
          {canReset && (
            <ActionButton 
              title="Redefinir Status" 
              iconName="refresh" 
              color="#FFC107" 
              onPress={handleResetExpenseStatus} 
              isLoading={actionLoading} 
            />
          )}
          
          {/* Creator/User Actions */}
          {canEdit && (
            <ActionButton 
              title="Editar" 
              iconName="create-outline" 
              color="#7B68EE" 
              onPress={() => router.push(`/(panel)/finances/expenses/edit?id=${expense.id}`)} 
              disabled={actionLoading} 
            />
          )}
          
          {canDelete && (
            <ActionButton 
              title="Excluir" 
              iconName="trash-outline" 
              color="#FF6347" 
              onPress={handleDeleteExpense} 
              isLoading={actionLoading} 
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#222',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 16,
  },
  errorButton: {
    backgroundColor: '#7B68EE',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  errorButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  shareButton: {
    padding: 8,
  },
  container: {
    flex: 1,
  },
  expenseHeaderSection: {
    backgroundColor: '#333',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  creatorBadge: {
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  creatorText: {
    color: '#7B68EE',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  categoryText: {
    color: '#7B68EE',
    fontSize: 12,
    marginLeft: 6,
  },
  expenseTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  expenseAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 16,
  },
  expenseMetaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  expenseMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseMetaText: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 6,
  },
  sectionContainer: {
    backgroundColor: '#333',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7B68EE',
    marginBottom: 16,
  },
  notesText: {
    color: '#ddd',
    fontSize: 14,
    lineHeight: 20,
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  creatorAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  creatorInitials: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  createdAt: {
    fontSize: 14,
    color: '#aaa',
  },
  timelineContainer: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
    position: 'relative',
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    marginRight: 16,
    marginTop: 2,
  },
  completedTimelineItem: {},
  pendingTimelineItem: {
    opacity: 0.5,
  },
  completedTimelineDot: {
    backgroundColor: '#4CAF50',
  },
  pendingTimelineDot: {
    backgroundColor: '#aaa',
  },
  rejectedTimelineItem: {},
  rejectedTimelineDot: {
    backgroundColor: '#FF6347',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  pendingTimelineText: {
    color: '#aaa',
  },
  rejectedTimelineText: {
    color: '#FF6347',
  },
  timelineDate: {
    fontSize: 14,
    color: '#aaa',
  },
  rejectionReason: {
    fontSize: 14,
    color: '#FF6347',
    marginTop: 4,
    fontStyle: 'italic',
  },
  receiptContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#444',
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 200,
  },
  receiptImage: {
    width: '100%',
    height: 300,
  },
  viewReceiptOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  viewReceiptText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  actionGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionButtonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ExpenseDetailsScreen;