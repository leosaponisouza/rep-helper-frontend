// app/(panel)/finances/expenses/[id].tsx - Visualização e gerenciamento de despesas
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
  Platform,
  Animated,
  Share,
  Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinances } from '../../../../src/hooks/useFinances';
import { useAuth } from '../../../../src/context/AuthContext';
import { ErrorHandler } from '../../../../src/utils/errorHandling';
import { Expense } from '../../../../src/models/finances.model';

const { width, height } = Dimensions.get('window');

// Timeline status item component
const TimelineItem = ({ 
  title, 
  date, 
  isCompleted, 
  isRejected, 
  rejectionReason,
  isLast = false,
  isFuture = false
}: { 
  title: string; 
  date?: string | null; 
  isCompleted: boolean; 
  isRejected?: boolean;
  rejectionReason?: string;
  isLast?: boolean;
  isFuture?: boolean;
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

  // Determine a classe de estilo com base no status
  const isPending = !isCompleted && !isRejected;
  const itemStyle = [
    styles.timelineItem,
    isRejected && styles.rejectedTimelineItem,
    isPending && styles.pendingTimelineItem,
    isFuture && styles.futureTimelineItem
  ];

  return (
    <View style={itemStyle}>
      <View style={styles.timelineDotContainer}>
        <View style={[
          styles.timelineDot,
          isCompleted && styles.completedTimelineDot,
          isRejected && styles.rejectedTimelineDot,
          isPending && styles.pendingTimelineDot,
          isFuture && styles.futureTimelineDot
        ]}>
          {isCompleted && (
            <Ionicons name="checkmark" size={10} color="#fff" />
          )}
          {isRejected && (
            <Ionicons name="close" size={10} color="#fff" />
          )}
        </View>
        {!isLast && (
          <View style={[
            styles.timelineConnector,
            isCompleted && styles.completedTimelineConnector,
            isRejected && styles.rejectedTimelineConnector,
            isPending && styles.pendingTimelineConnector,
            isFuture && styles.futureTimelineConnector
          ]} />
        )}
      </View>
      <View style={styles.timelineContent}>
        <Text style={[
          styles.timelineTitle,
          isPending && styles.pendingTimelineText,
          isRejected && styles.rejectedTimelineText,
          isFuture && styles.futureTimelineText
        ]}>{title}</Text>
        
        {date ? (
          <Text style={styles.timelineDate}>{formatDate(date)}</Text>
        ) : isFuture ? (
          <Text style={styles.futureDateText}>Aguardando status anterior</Text>
        ) : (
          <Text style={styles.pendingDateText}>Pendente</Text>
        )}
        
        {isRejected && rejectionReason && (
          <View style={styles.rejectionReasonContainer}>
            <Text style={styles.rejectionReason}>
              Motivo: {rejectionReason}
            </Text>
          </View>
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
  disabled,
  small = false
}: { 
  title: string; 
  iconName: string; 
  color: string; 
  onPress: () => void; 
  isLoading?: boolean;
  disabled?: boolean;
  small?: boolean;
}) => (
  <TouchableOpacity 
    style={[
      styles.mainActionButton, 
      { backgroundColor: color }, 
      (isLoading || disabled) && styles.disabledButton,
      small && styles.smallActionButton
    ]}
    onPress={onPress}
    disabled={isLoading || disabled}
  >
    {isLoading ? (
      <ActivityIndicator size="small" color="#fff" />
    ) : (
      <>
        <Ionicons name={iconName as any} size={small ? 16 : 20} color="#fff" style={styles.actionButtonIcon} />
        <Text style={[styles.actionButtonText, small && styles.smallActionButtonText]}>{title}</Text>
      </>
    )}
  </TouchableOpacity>
);

// Main Component
const ExpenseDetailsScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { 
    getExpenseById, 
    approveExpense, 
    rejectExpense, 
    reimburseExpense,
    resetExpenseStatus,
    deleteExpense
  } = useFinances();

  // Estados
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [imageModalVisible, setImageModalVisible] = useState<boolean>(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  
  // Verificar permissões
  const isCreator = expense?.creatorId === user?.uid;
  const isUserAdmin = user?.isAdmin === true;
  const canApprove = expense?.status === 'PENDING' && isUserAdmin;
  const canReimburse = expense?.status === 'APPROVED' && isUserAdmin;
  const canReset = (expense?.status === 'REJECTED' || expense?.status === 'APPROVED') && isUserAdmin;
  const canEdit = isCreator && (expense?.status === 'PENDING' || expense?.status === 'REJECTED');
  const canDelete = (isCreator || isUserAdmin) && expense?.status !== 'REIMBURSED';
  const canModifyExpense = canEdit || isUserAdmin;

  // Animações
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.95))[0];
  const scrollY = useState(new Animated.Value(0))[0];

  // Efeito de entrada com animação
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Animação do header com base no scroll
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 60],
    extrapolate: 'clamp'
  });

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

  // Format date with time
  const formatDateWithTime = (dateString?: string) => {
    if (!dateString) return 'Data não disponível';
    
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  // Get time ago
  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return 'recentemente';
    
    try {
      const date = parseISO(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'agora mesmo';
      if (diffInMinutes < 60) return `há ${diffInMinutes} min`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `há ${diffInHours}h`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 30) return `há ${diffInDays} dias`;
      
      const diffInMonths = Math.floor(diffInDays / 30);
      return `há ${diffInMonths} meses`;
    } catch (error) {
      return 'recentemente';
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
    
    if (!showConfirmDelete) {
      setShowConfirmDelete(true);
      return;
    }
    
    try {
      setIsDeleting(true);
      await deleteExpense(expense.id);
      Alert.alert('Sucesso', 'Despesa excluída com sucesso!');
      router.back();
    } catch (error) {
      ErrorHandler.handle(error);
      setIsDeleting(false);
    }
  };
  
  const handleCancelDelete = () => {
    setShowConfirmDelete(false);
  };

  // Share expense details
  const handleShareExpense = async () => {
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
    setImageModalVisible(true);
  };

  // Loading state
  if (loading && !expense) {
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
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#222" />
        <Ionicons name="alert-circle" size={64} color="#FF6347" />
        <Text style={styles.errorTitle}>Despesa não encontrada</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      {/* Header animado */}
      <Animated.View
        style={[
          styles.animatedHeader,
          {
            opacity: headerOpacity,
            height: headerHeight
          }
        ]}
      >
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FF6347" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {expense.description}
        </Text>
        <View style={styles.headerRight}>
          {canModifyExpense && (
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => router.push(`/(panel)/finances/expenses/edit?id=${expense.id}`)}
            >
              <Ionicons name="create-outline" size={24} color="#FF6347" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Banner de criador */}
      {isCreator && (
        <View style={styles.userAssignmentBanner}>
          <Ionicons name="person" size={18} color="#fff" />
          <Text style={styles.userAssignmentText}>Você criou esta despesa</Text>
        </View>
      )}

      <Animated.ScrollView
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Cabeçalho */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FF6347" />
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionIcon}
              onPress={handleShareExpense}
            >
              <Ionicons name="share-outline" size={24} color="#FF6347" />
            </TouchableOpacity>

            {canModifyExpense && (
              <TouchableOpacity
                style={styles.headerActionIcon}
                onPress={() => router.push(`/(panel)/finances/expenses/edit?id=${expense.id}`)}
              >
                <Ionicons name="create-outline" size={24} color="#FF6347" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Conteúdo principal */}
        <Animated.View
          style={[
            styles.expenseContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Status da despesa */}
          <View style={styles.taskStatusRow}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(expense.status)}20` }
            ]}>
              <Text style={[styles.statusText, { color: getStatusColor(expense.status) }]}>
                {getStatusText(expense.status)}
              </Text>
            </View>
            <Text style={styles.taskUpdatedTime}>
              Atualizada {getTimeAgo(expense.updatedAt)}
            </Text>
          </View>
          
          {/* Título e valor */}
          <Text style={styles.expenseTitle}>{expense.description}</Text>
          <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
          
          {/* Ações rápidas para administradores */}
          {(canApprove || canReimburse || canReset) && (
            <View style={styles.quickActionsContainer}>
              {canApprove && (
                <View style={styles.quickActionsRow}>
                  <ActionButton 
                    title="Aprovar" 
                    iconName="checkmark-circle" 
                    color="#4CAF50" 
                    onPress={handleApproveExpense} 
                    isLoading={actionLoading} 
                    small={true}
                  />
                  
                  <View style={styles.actionSpacer} />
                  
                  <ActionButton 
                    title="Rejeitar" 
                    iconName="close-circle" 
                    color="#FF6347" 
                    onPress={handleRejectExpense} 
                    isLoading={actionLoading} 
                    small={true}
                  />
                </View>
              )}
              
              {canReimburse && (
                <ActionButton 
                  title="Reembolsar" 
                  iconName="cash-outline" 
                  color="#2196F3" 
                  onPress={handleReimburseExpense} 
                  isLoading={actionLoading} 
                  small={true}
                />
              )}
              
              {canReset && (
                <ActionButton 
                  title="Redefinir" 
                  iconName="refresh" 
                  color="#FFC107" 
                  onPress={handleResetExpenseStatus} 
                  isLoading={actionLoading} 
                  small={true}
                />
              )}
            </View>
          )}
          
          {/* Detalhes da Despesa */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Detalhes</Text>
            </View>

            {expense.category && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <FontAwesome5 name="tag" size={20} color="#FF6347" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Categoria</Text>
                  <Text style={styles.detailValue}>
                    {expense.category}
                  </Text>
                </View>
              </View>
            )}
            
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="calendar-outline" size={20} color="#FF6347" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Data da Despesa</Text>
                <Text style={styles.detailValue}>
                  {formatDateWithTime(expense.expenseDate)}
                </Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="calendar-outline" size={20} color="#FF6347" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Data de Criação</Text>
                <Text style={styles.detailValue}>
                  {formatDateWithTime(expense.createdAt)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="person-outline" size={20} color="#FF6347" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Criado por</Text>
                <Text style={styles.detailValue}>
                  {expense.creatorName || 'Desconhecido'}
                  {isCreator ? ' (Você)' : ''}
                </Text>
              </View>
            </View>
            
            {expense.approvalDate && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Aprovada em</Text>
                  <Text style={styles.detailValue}>
                    {formatDateWithTime(expense.approvalDate)}
                  </Text>
                </View>
              </View>
            )}
            
            {expense.reimbursementDate && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="cash-outline" size={20} color="#2196F3" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Reembolsada em</Text>
                  <Text style={styles.detailValue}>
                    {formatDateWithTime(expense.reimbursementDate)}
                  </Text>
                </View>
              </View>
            )}

            {expense.notes && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="document-text-outline" size={20} color="#FF6347" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Observações</Text>
                  <Text style={styles.detailValue}>
                    {expense.notes}
                  </Text>
                </View>
              </View>
            )}
          </View>
          
          {/* Receipt Section (if available) */}
          {expense.receiptUrl && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Comprovante</Text>
              </View>
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
          
          {/* Status Timeline */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Timeline de Status</Text>
            </View>
            
            <View style={styles.timelineContainer}>
              {/* Created */}
              <TimelineItem 
                title="Criada" 
                date={expense.createdAt} 
                isCompleted={true}
                isLast={false}
                isFuture={false}
              />
              
              {/* Approved */}
              <TimelineItem 
                title="Aprovada" 
                date={expense.approvalDate} 
                isCompleted={['APPROVED', 'REIMBURSED'].includes(expense.status)}
                isLast={false}
                isRejected={expense.status === 'REJECTED'}
                isFuture={expense.status === 'PENDING' && !expense.approvalDate ? true : false}
              />
              
              {/* Rejected (show if is rejected) */}
              {expense.status === 'REJECTED' && (
                <TimelineItem 
                  title="Rejeitada" 
                  date={expense.updatedAt} 
                  isCompleted={true} 
                  isRejected={true}
                  rejectionReason={expense.rejectionReason}
                  isLast={true}
                  isFuture={false}
                />
              )}
              
              {/* Reimbursed (show if not rejected) */}
              {expense.status !== 'REJECTED' && (
                <TimelineItem 
                  title="Reembolsada" 
                  date={expense.reimbursementDate} 
                  isCompleted={expense.status === 'REIMBURSED'}
                  isLast={true}
                  isRejected={false}
                  isFuture={!expense.reimbursementDate && !['REIMBURSED'].includes(expense.status) ? true : false}
                />
              )}
            </View>
          </View>
          
          {/* Creator Actions (Delete) */}
          {canDelete && (
            <View style={styles.creatorActionsContainer}>
              <Text style={styles.creatorActionsTitle}>Ações do Criador</Text>
              <View style={styles.creatorButtonsContainer}>
                <TouchableOpacity
                  style={[styles.creatorButton, styles.deleteButton]}
                  onPress={handleDeleteExpense}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons
                        name={showConfirmDelete ? "alert-circle" : "trash"}
                        size={20}
                        color="#fff"
                        style={styles.buttonIcon}
                      />
                      <Text style={styles.deleteButtonText}>
                        {showConfirmDelete ? "Confirmar exclusão" : "Excluir despesa"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {showConfirmDelete && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelDelete}
                  >
                    <Ionicons name="close-circle" size={20} color="#aaa" style={styles.buttonIcon} />
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </Animated.View>
      </Animated.ScrollView>

      {/* Botão flutuante de edição */}
      {canEdit && !actionLoading && !isDeleting && !showConfirmDelete && (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push(`/(panel)/finances/expenses/edit?id=${expense.id}`)}
        >
          <Feather name="edit-2" size={20} color="#fff" />
        </TouchableOpacity>
      )}
      
      {/* Modal para visualização em tela cheia */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.imageModalContainer}>
          <TouchableOpacity 
            style={styles.closeModalButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name="close-circle" size={32} color="#fff" />
          </TouchableOpacity>
          
          <Image
            source={{ uri: expense?.receiptUrl }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
          
          <TouchableOpacity 
            style={styles.saveImageButton}
            onPress={() => {
              // Opção para usuários compartilharem a imagem
              if (expense?.receiptUrl) {
                Share.share({
                  url: expense.receiptUrl,
                  message: `Comprovante da despesa: ${expense.description}`
                });
              }
            }}
          >
            <Ionicons name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
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
    backgroundColor: '#222',
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
    backgroundColor: '#222',
    padding: 20,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 99, 71, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  retryButtonText: {
    color: '#FF6347',
    fontWeight: 'bold',
    fontSize: 16,
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(34, 34, 34, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 1000,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerActionButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#222',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  headerActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 99, 71, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 99, 71, 0.3)',
    marginLeft: 8,
  },
  userAssignmentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6347',
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  userAssignmentText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  expenseContainer: {
    backgroundColor: '#333',
    borderRadius: 16,
    margin: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  taskStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  taskUpdatedTime: {
    color: '#aaa',
    fontSize: 12,
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
    color: '#FF6347',
    marginBottom: 16,
  },
  sectionContainer: {
    marginTop: 20,
    backgroundColor: '#444',
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#555',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6347',
  },
  detailRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#555',
  },
  detailIcon: {
    width: 35,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 4,
  },
  detailValue: {
    color: '#fff',
    fontSize: 16,
  },
  timelineContainer: {
    marginTop: 0,
    padding: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
    position: 'relative',
  },
  completedTimelineItem: {},
  pendingTimelineItem: {
    opacity: 0.5,
  },
  rejectedTimelineItem: {},
  futureTimelineItem: {
    opacity: 0.3,
  },
  timelineDotContainer: {
    position: 'relative',
    alignItems: 'center',
    width: 30,
    height: 50,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    marginRight: 16,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineConnector: {
    position: 'absolute',
    top: 16,
    left: 7,
    width: 2,
    height: 40,
    backgroundColor: '#444',
    zIndex: 1,
  },
  completedTimelineDot: {
    backgroundColor: '#4CAF50',
  },
  pendingTimelineDot: {
    backgroundColor: '#aaa',
    borderWidth: 1,
    borderColor: '#555',
  },
  rejectedTimelineDot: {
    backgroundColor: '#FF6347',
  },
  futureTimelineDot: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#444',
  },
  completedTimelineConnector: {
    backgroundColor: '#4CAF50',
  },
  rejectedTimelineConnector: {
    backgroundColor: '#FF6347',
  },
  pendingTimelineConnector: {
    backgroundColor: '#555',
    opacity: 0.5,
  },
  futureTimelineConnector: {
    backgroundColor: '#333',
    opacity: 0.3,
    borderStyle: 'dashed',
  },
  timelineContent: {
    flex: 1,
    paddingTop: 0,
    marginLeft: 8,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  pendingTimelineText: {
    color: '#aaa',
    opacity: 0.8,
  },
  rejectedTimelineText: {
    color: '#FF6347',
  },
  futureTimelineText: {
    color: '#777',
  },
  timelineDate: {
    fontSize: 14,
    color: '#aaa',
  },
  pendingDateText: {
    fontSize: 14,
    color: '#aaa',
    fontStyle: 'italic',
  },
  futureDateText: {
    fontSize: 14,
    color: '#777',
    fontStyle: 'italic',
  },
  rejectionReason: {
    fontSize: 14,
    color: '#FF6347',
    fontStyle: 'italic',
    backgroundColor: 'rgba(255, 99, 71, 0.1)',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  receiptContainer: {
    backgroundColor: '#333',
    borderRadius: 8,
    overflow: 'hidden',
    height: 240,
    position: 'relative',
  },
  receiptImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#222',
  },
  viewReceiptOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewReceiptText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionGroupContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#444',
    borderRadius: 12,
  },
  actionGroupTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  mainActionButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    flex: 1,
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
  creatorActionsContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#444',
    borderRadius: 12,
  },
  creatorActionsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  creatorButtonsContainer: {
    marginTop: 8,
  },
  creatorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: 'rgba(123, 104, 238, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(123, 104, 238, 0.3)',
  },
  deleteButton: {
    backgroundColor: '#FF6347',
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#FF6347',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#444',
  },
  cancelButtonText: {
    color: '#aaa',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  editButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6347',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6347',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 100,
  },
  closeModalButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  saveImageButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    backgroundColor: 'rgba(255, 99, 71, 0.7)',
    borderRadius: 30,
    padding: 12,
    zIndex: 10,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  quickActionsContainer: {
    marginVertical: 16,
    gap: 8,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  actionSpacer: {
    width: 8,
  },
  rejectionReasonContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 99, 71, 0.1)',
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6347',
  },
  smallActionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    minHeight: 36,
  },
  smallActionButtonText: {
    fontSize: 12,
  },
});

export default ExpenseDetailsScreen;