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
  Share
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFinances } from '../../../../src/hooks/useFinances';
import { useAuth } from '../../../../src/context/AuthContext';
import { ErrorHandler } from '../../../../src/utils/errorHandling';
import { Income } from '../../../../src/models/finances.model';

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

const IncomeDetailsScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [income, setIncome] = useState<Income | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { deleteIncome, getIncomeById } = useFinances();

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
  const shareIncome = async () => {
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
  const handleDeleteIncome = () => {
    if (!income) return;
    
    Alert.alert(
      'Excluir Receita',
      'Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleteLoading(true);
              await deleteIncome(income.id);
              Alert.alert('Sucesso', 'Receita excluída com sucesso!');
              router.back();
            } catch (error) {
              ErrorHandler.handle(error);
              setDeleteLoading(false);
            }
          }
        }
      ]
    );
  };

  // Check permissions
  const isContributor = income?.contributorId === user?.uid;
  const canEdit = isContributor || user?.isAdmin;
  
  // Loading state
  if (loading) {
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
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#222" />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={80} color="#FF6347" />
          <Text style={styles.errorTitle}>Receita não encontrada</Text>
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
          <Ionicons name="arrow-back" size={24} color="#4CAF50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Receita</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={shareIncome}
        >
          <Ionicons name="share-outline" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.container}>
        {/* Income Header Section */}
        <View style={styles.incomeHeaderSection}>
          <View style={styles.statusContainer}>
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceText}>{income.source}</Text>
            </View>
            
            {isContributor && (
              <View style={styles.contributorBadge}>
                <Text style={styles.contributorText}>Você registrou esta receita</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.incomeTitle}>{income.description}</Text>
          <Text style={styles.incomeAmount}>{formatCurrency(income.amount)}</Text>
          
          <View style={styles.incomeMetaContainer}>
            <View style={styles.incomeMetaItem}>
              <Ionicons name="calendar-outline" size={16} color="#4CAF50" />
              <Text style={styles.incomeMetaText}>
                {formatDate(income.incomeDate)}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Contributor Info Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Registrado por</Text>
          <View style={styles.contributorContainer}>
            {income.creatorProfilePictureUrl ? (
              <Image 
                source={{ uri: income.creatorProfilePictureUrl }} 
                style={styles.contributorAvatar}
              />
            ) : (
              <View style={styles.contributorAvatarPlaceholder}>
                <Text style={styles.contributorInitials}>
                  {income.contributorName?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            )}
            
            <View style={styles.contributorInfo}>
              <Text style={styles.contributorName}>
                {income.contributorName}
                {isContributor ? ' (Você)' : ''}
              </Text>
              <Text style={styles.createdAt}>
                Em {formatDate(income.createdAt)}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Source Info Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Fonte da Receita</Text>
          <View style={styles.sourceContainer}>
            <View style={styles.sourceIconContainer}>
              <Ionicons 
                name={getSourceIcon(income.source) as any} 
                size={32} 
                color="#4CAF50" 
              />
            </View>
            <View style={styles.sourceInfoContainer}>
              <Text style={styles.sourceInfoText}>{income.source}</Text>
              <Text style={styles.sourceInfoDescription}>
                {getSourceDescription(income.source)}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Notes Section (if available) */}
        {income.notes && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Observações</Text>
            <Text style={styles.notesText}>{income.notes}</Text>
          </View>
        )}
        
        {/* Action Buttons (for contributor or admin) */}
        {canEdit && (
          <View style={styles.actionsContainer}>
            <ActionButton 
              title="Editar" 
              iconName="create-outline" 
              color="#7B68EE" 
              onPress={() => router.push(`/(panel)/finances/incomes/edit?id=${income.id}`)} 
              disabled={deleteLoading} 
            />
            
            <ActionButton 
              title="Excluir" 
              iconName="trash-outline" 
              color="#FF6347" 
              onPress={handleDeleteIncome} 
              isLoading={deleteLoading} 
            />
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
    backgroundColor: '#4CAF50',
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
  incomeHeaderSection: {
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
  contributorBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  contributorText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
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
  incomeMetaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  incomeMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  incomeMetaText: {
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
    color: '#4CAF50',
    marginBottom: 16,
  },
  notesText: {
    color: '#ddd',
    fontSize: 14,
    lineHeight: 20,
  },
  contributorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contributorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  contributorAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contributorInitials: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contributorInfo: {
    flex: 1,
  },
  contributorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  createdAt: {
    fontSize: 14,
    color: '#aaa',
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sourceInfoContainer: {
    flex: 1,
  },
  sourceInfoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  sourceInfoDescription: {
    fontSize: 14,
    color: '#aaa',
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
    marginBottom: 20,
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

export default IncomeDetailsScreen;