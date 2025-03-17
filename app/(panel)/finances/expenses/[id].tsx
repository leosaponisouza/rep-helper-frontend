// app/(panel)/finances/expenses/[id].tsx
import React, { useState, useEffect } from 'react';
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
  Share
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinances } from '../../../../src/hooks/useFinances';
import { useAuth } from '../../../../src/context/AuthContext';
import { ErrorHandler } from '../../../../src/utils/errorHandling';
import { Expense } from '../../../../src/models/expense.model';

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
    reimburseExpense 
  } = useFinances();

  // Fetch expense details
  useEffect(() => {
    const fetchExpenseDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getExpenseById(Number(id));
        setExpense(data);
      } catch (error) {
        ErrorHandler.handle(error);
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchExpenseDetails();
  }, [id]);

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

  // Handle approve expense
  const handleApproveExpense = async () => {
    if (!expense) return;
    
    try {
      setActionLoading(true);
      await approveExpense(expense.id);
      
      // Update local expense
      setExpense(prev => prev ? { ...prev, status: 'APPROVED' } : null);
      
      Alert.alert('Sucesso', 'Despesa aprovada com sucesso!');
    } catch (error) {
      ErrorHandler.handle(error);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject expense
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
              
              // Update local expense
              setExpense(prev => 
                prev ? { ...prev, status: 'REJECTED', rejectionReason: reason } : null
              );
              
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

  // Handle reimburse expense
  const handleReimburseExpense = async () => {
    if (!expense) return;
    
    try {
      setActionLoading(true);
      await reimburseExpense(expense.id);
      
      // Update local expense
      setExpense(prev => 
        prev ? { ...prev, status: 'REIMBURSED' } : null
      );
      
      Alert.alert('Sucesso', 'Despesa marcada como reembolsada!');
    } catch (error) {
      ErrorHandler.handle(error);
    } finally {
      setActionLoading(false);
    }
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
    }
  };

  // Check if user can approve/reject
  const canApprove = expense?.status === 'PENDING' && user?.isAdmin === true;
  const canReimburse = expense?.status === 'APPROVED' && user?.isAdmin === true;
  const isCreator = expense?.creatorId === user?.uid;

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
            
            {expense.category && (
              <View style={styles.categoryChip}>
                <FontAwesome5 name="tag" size={14} color="#7B68EE" />
                <Text style={styles.categoryText}>{expense.category}</Text>
              </View>
            )}
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
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Criada</Text>
                <Text style={styles.timelineDate}>{formatDate(expense.createdAt)}</Text>
              </View>
            </View>
            
            {/* Approved */}
            <View style={[
              styles.timelineItem,
              ['APPROVED', 'REIMBURSED'].includes(expense.status) ? styles.completedTimelineItem : styles.pendingTimelineItem
            ]}>
              <View style={[
                styles.timelineDot,
                ['APPROVED', 'REIMBURSED'].includes(expense.status) ? styles.completedTimelineDot : styles.pendingTimelineDot
              ]} />
              <View style={styles.timelineContent}>
                <Text style={[
                  styles.timelineTitle,
                  !['APPROVED', 'REIMBURSED'].includes(expense.status) && styles.pendingTimelineText
                ]}>Aprovada</Text>
                {expense.approvalDate && (
                  <Text style={styles.timelineDate}>{formatDate(expense.approvalDate)}</Text>
                )}
              </View>
            </View>
            
            {/* Reimbursed */}
            <View style={[
              styles.timelineItem,
              expense.status === 'REIMBURSED' ? styles.completedTimelineItem : styles.pendingTimelineItem
            ]}>
              <View style={[
                styles.timelineDot,
                expense.status === 'REIMBURSED' ? styles.completedTimelineDot : styles.pendingTimelineDot
              ]} />
              <View style={styles.timelineContent}>
                <Text style={[
                  styles.timelineTitle,
                  expense.status !== 'REIMBURSED' && styles.pendingTimelineText
                ]}>Reembolsada</Text>
                {expense.reimbursementDate && (
                  <Text style={styles.timelineDate}>{formatDate(expense.reimbursementDate)}</Text>
                )}
              </View>
            </View>
            
            {/* Rejected (only show if rejected) */}
            {expense.status === 'REJECTED' && (
              <View style={[styles.timelineItem, styles.rejectedTimelineItem]}>
                <View style={[styles.timelineDot, styles.rejectedTimelineDot]} />
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineTitle, styles.rejectedTimelineText]}>Rejeitada</Text>
                  {expense.rejectionReason && (
                    <Text style={styles.rejectionReason}>
                      Motivo: {expense.rejectionReason}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
        
        {/* Receipt Section (if available) */}
        {expense.receiptUrl && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Comprovante</Text>
            <View style={styles.receiptContainer}>
              <Image 
                source={{ uri: expense.receiptUrl }} 
                style={styles.receiptImage}
                resizeMode="contain"
              />
            </View>
          </View>
        )}
        
        {/* Action Buttons (for admins) */}
        {(canApprove || canReimburse) && (
          <View style={styles.actionsContainer}>
            {canApprove && (
              <>
                <TouchableOpacity 
                  style={[styles.approveButton, actionLoading && styles.disabledButton]}
                  onPress={handleApproveExpense}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.actionButtonIcon} />
                      <Text style={styles.actionButtonText}>Aprovar</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.rejectButton, actionLoading && styles.disabledButton]}
                  onPress={handleRejectExpense}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="close-circle" size={20} color="#fff" style={styles.actionButtonIcon} />
                      <Text style={styles.actionButtonText}>Rejeitar</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
            
            {canReimburse && (
              <TouchableOpacity 
                style={[styles.reimburseButton, actionLoading && styles.disabledButton]}
                onPress={handleReimburseExpense}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="cash-refund" size={20} color="#fff" style={styles.actionButtonIcon} />
                    <Text style={styles.actionButtonText}>Marcar como Reembolsada</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
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
  actionsContainer: {
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  rejectButton: {
    backgroundColor: '#FF6347',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  reimburseButton: {
    backgroundColor: '#2196F3',
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