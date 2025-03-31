// app/(panel)/finances/incomes/[id].tsx
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
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinances } from '../../../../src/hooks/useFinances';
import { useAuth } from '../../../../src/context/AuthContext';
import { ErrorHandler } from '../../../../src/utils/errorHandling';
import { Income } from '../../../../src/models/finances.model';

const { width, height } = Dimensions.get('window');

// Timeline status item component
const TimelineItem = ({ 
  title, 
  date, 
  isCompleted, 
  isLast = false
}: { 
  title: string; 
  date?: string | null; 
  isCompleted: boolean; 
  isLast?: boolean;
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
      !isCompleted && styles.pendingTimelineItem
    ]}>
      <View style={styles.timelineDotContainer}>
        <View style={[
          styles.timelineDot,
          isCompleted ? styles.completedTimelineDot : styles.pendingTimelineDot
        ]}>
          {isCompleted && (
            <Ionicons name="checkmark" size={10} color="#fff" />
          )}
        </View>
        {!isLast && (
          <View style={[
            styles.timelineConnector,
            isCompleted ? styles.completedTimelineConnector : styles.pendingTimelineConnector
          ]} />
        )}
      </View>
      <View style={styles.timelineContent}>
        <Text style={[
          styles.timelineTitle,
          !isCompleted && styles.pendingTimelineText
        ]}>{title}</Text>
        
        {date ? (
          <Text style={styles.timelineDate}>{formatDate(date)}</Text>
        ) : (
          <Text style={styles.pendingDateText}>Pendente</Text>
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
      styles.actionButton, 
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

const IncomeDetailsScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [income, setIncome] = useState<Income | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const { deleteIncome, getIncomeById } = useFinances();
  
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

  // Fetch income details
  const fetchIncomeDetails = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await getIncomeById(Number(id));
      setIncome(data);
    } catch (error) {
      ErrorHandler.handle(error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes da receita.');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, getIncomeById, router]);

  // Initial data fetch
  useEffect(() => {
    fetchIncomeDetails();
  }, [fetchIncomeDetails]);

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

  // Get source icon
  const getSourceIcon = (source: string): string => {
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

  // Get source description
  const getSourceDescription = (source: string): string => {
    switch(source) {
      case 'Contribuição':
        return 'Contribuição de membro da república';
      case 'Reembolso':
        return 'Valor reembolsado';
      case 'Evento':
        return 'Receita proveniente de evento';
      case 'Outros':
        return 'Outra fonte de receita';
      default:
        return `Fonte: ${source}`;
    }
  };

  // Share income details
  const handleShareIncome = async () => {
    if (!income) return;
    
    try {
      await Share.share({
        message: `Receita: ${income.description}\nValor: ${formatCurrency(income.amount)}\nData: ${formatDate(income.incomeDate)}\nFonte: ${income.source}`
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      Alert.alert('Erro', 'Não foi possível compartilhar esta receita.');
    }
  };

  // Handle delete income
  const handleDeleteIncome = async () => {
    if (!income) return;
    
    if (!showConfirmDelete) {
      setShowConfirmDelete(true);
      return;
    }
    
    try {
      setDeleteLoading(true);
      await deleteIncome(income.id);
      Alert.alert('Sucesso', 'Receita excluída com sucesso!');
      router.back();
    } catch (error) {
      ErrorHandler.handle(error);
      setDeleteLoading(false);
    }
  };
  
  const handleCancelDelete = () => {
    setShowConfirmDelete(false);
  };

  // Check permissions
  const isContributor = income?.contributorId === user?.uid;
  const canEdit = isContributor || user?.isAdmin;
  const isUserAdmin = user?.isAdmin === true;
  
  // Loading state
  if (loading && !income) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#222" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Carregando detalhes da receita...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (!income) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#222" />
        <Ionicons name="alert-circle" size={64} color="#FF6347" />
        <Text style={styles.errorTitle}>Receita não encontrada</Text>
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
          <Ionicons name="arrow-back" size={24} color="#4CAF50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {income.description}
        </Text>
        <View style={styles.headerRight}>
          {canEdit && (
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => router.push(`/(panel)/finances/incomes/edit?id=${income.id}`)}
            >
              <Ionicons name="create-outline" size={24} color="#4CAF50" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Banner de criador */}
      {isContributor && (
        <View style={styles.userAssignmentBanner}>
          <Ionicons name="person" size={18} color="#fff" />
          <Text style={styles.userAssignmentText}>Você registrou esta receita</Text>
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
            <Ionicons name="arrow-back" size={24} color="#4CAF50" />
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionIcon}
              onPress={handleShareIncome}
            >
              <Ionicons name="share-outline" size={24} color="#4CAF50" />
            </TouchableOpacity>

            {canEdit && (
              <TouchableOpacity
                style={styles.headerActionIcon}
                onPress={() => router.push(`/(panel)/finances/incomes/edit?id=${income.id}`)}
              >
                <Ionicons name="create-outline" size={24} color="#4CAF50" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Conteúdo principal */}
        <Animated.View
          style={[
            styles.incomeContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Status da receita */}
          <View style={styles.statusRow}>
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceText}>{income.source}</Text>
            </View>
            <Text style={styles.updatedTime}>
              Atualizada {getTimeAgo(income.updatedAt)}
            </Text>
          </View>
          
          {/* Título e valor */}
          <Text style={styles.incomeTitle}>{income.description}</Text>
          <Text style={styles.incomeAmount}>{formatCurrency(income.amount)}</Text>
          
          {/* Detalhes da Receita */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Detalhes</Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name={getSourceIcon(income.source) as any} size={20} color="#4CAF50" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Fonte</Text>
                <Text style={styles.detailValue}>
                  {income.source}
                </Text>
                <Text style={styles.detailDescription}>
                  {getSourceDescription(income.source)}
                </Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="calendar-outline" size={20} color="#4CAF50" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Data da Receita</Text>
                <Text style={styles.detailValue}>
                  {formatDateWithTime(income.incomeDate)}
                </Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="calendar-outline" size={20} color="#4CAF50" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Data de Registro</Text>
                <Text style={styles.detailValue}>
                  {formatDateWithTime(income.createdAt)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="person-outline" size={20} color="#4CAF50" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Registrado por</Text>
                <Text style={styles.detailValue}>
                  {income.contributorName || 'Desconhecido'}
                  {isContributor ? ' (Você)' : ''}
                </Text>
              </View>
            </View>

            {income.notes && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="document-text-outline" size={20} color="#4CAF50" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Observações</Text>
                  <Text style={styles.detailValue}>
                    {income.notes}
                  </Text>
                </View>
              </View>
            )}
          </View>
          
          {/* Status Timeline */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Timeline</Text>
            </View>
            
            <View style={styles.timelineContainer}>
              {/* Created */}
              <TimelineItem 
                title="Registrada" 
                date={income.createdAt} 
                isCompleted={true}
                isLast={false}
              />
              
              {/* Received */}
              <TimelineItem 
                title="Recebida" 
                date={income.incomeDate} 
                isCompleted={true}
                isLast={true}
              />
            </View>
          </View>

          {/* Creator Actions (Delete) */}
          {canEdit && (
            <View style={styles.creatorActionsContainer}>
              <Text style={styles.creatorActionsTitle}>Ações</Text>
              <View style={styles.creatorButtonsContainer}>
                <TouchableOpacity
                  style={[styles.creatorButton, styles.deleteButton]}
                  onPress={handleDeleteIncome}
                >
                  {deleteLoading ? (
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
                        {showConfirmDelete ? "Confirmar exclusão" : "Excluir receita"}
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
      {canEdit && !deleteLoading && !showConfirmDelete && (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push(`/(panel)/finances/incomes/edit?id=${income.id}`)}
        >
          <Feather name="edit-2" size={20} color="#fff" />
        </TouchableOpacity>
      )}
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
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  retryButtonText: {
    color: '#4CAF50',
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
    gap: 12,
  },
  headerActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  userAssignmentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
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
  incomeContainer: {
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sourceBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  sourceText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
    textTransform: 'uppercase',
  },
  updatedTime: {
    color: '#aaa',
    fontSize: 12,
  },
  incomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  incomeAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
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
    color: '#4CAF50',
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
  detailDescription: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 4,
    fontStyle: 'italic',
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
  pendingTimelineItem: {
    opacity: 0.5,
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
  completedTimelineConnector: {
    backgroundColor: '#4CAF50',
  },
  pendingTimelineConnector: {
    backgroundColor: '#555',
    opacity: 0.5,
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
  timelineDate: {
    fontSize: 14,
    color: '#aaa',
  },
  pendingDateText: {
    fontSize: 14,
    color: '#aaa',
    fontStyle: 'italic',
  },
  actionButton: {
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
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
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
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
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

export default IncomeDetailsScreen;