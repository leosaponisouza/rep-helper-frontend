// app/(panel)/quick-actions.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar, 
  ScrollView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { colors, createShadow } from '@/src/styles/sharedStyles';
import BackButton from '@/components/BackButton';

interface ActionButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
  color?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  icon, 
  title, 
  description, 
  onPress,
  color = colors.primary.main
}) => (
  <TouchableOpacity 
    style={[styles.actionButton, { borderLeftColor: color }]} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
      {icon}
    </View>
    
    <View style={styles.actionTextContainer}>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionDescription}>{description}</Text>
    </View>
    
    <Ionicons 
      name="chevron-forward" 
      size={24} 
      color={colors.text.tertiary} 
      style={styles.actionArrow}
    />
  </TouchableOpacity>
);

const QuickActionsScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleCreateTask = () => {
    router.replace('/(panel)/tasks/create');
  };

  const handleCreateEvent = () => {
    router.replace('/(panel)/events/create');
  };
  
  const handleCreateExpense = () => {
    router.replace('/(panel)/finances/expenses/create');
  };
  
  const handleCreateIncome = () => {
    router.replace('/(panel)/finances/incomes/create');
  };
  
  const handleInviteUser = () => {
    router.replace('/(panel)/republic/invite');
  };
  
  const handleViewTasks = () => {
    router.replace('/(panel)/tasks');
  };
  
  const handlePendingApprovals = () => {
    router.replace('/(panel)/finances');
  };
  
  const handleSettings = () => {
    router.replace('/(panel)/settings');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      <View style={styles.header}>
        <BackButton color={colors.primary.main} />
        <Text style={styles.headerTitle}>Ações Rápidas</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Ações Comuns</Text>
        
        <View style={styles.actionsContainer}>
          {/* Criar Tarefa */}
          <ActionButton
            icon={<Ionicons name="add-circle" size={30} color={colors.primary.main} />}
            title="Criar Tarefa"
            description="Adicionar uma nova tarefa para a república"
            onPress={handleCreateTask}
            color={colors.primary.main}
          />
          
          {/* Criar Evento */}
          <ActionButton
            icon={<Ionicons name="calendar" size={30} color="#4A90E2" />}
            title="Criar Evento"
            description="Agendar um novo evento para a república"
            onPress={handleCreateEvent}
            color="#4A90E2"
          />
          
          {/* Registrar Despesa */}
          <ActionButton
            icon={<MaterialCommunityIcons name="cash-minus" size={30} color="#FF6347" />}
            title="Registrar Despesa"
            description="Adicionar uma nova despesa compartilhada"
            onPress={handleCreateExpense}
            color="#FF6347"
          />
          
          {/* Registrar Receita */}
          <ActionButton
            icon={<MaterialCommunityIcons name="cash-plus" size={30} color="#4CAF50" />}
            title="Registrar Receita"
            description="Adicionar uma nova receita ou pagamento"
            onPress={handleCreateIncome}
            color="#4CAF50"
          />
        </View>
        
        <Text style={styles.sectionTitle}>Gerenciar</Text>
        
        <View style={styles.actionsContainer}>
          {/* Convidar Usuário */}
          <ActionButton
            icon={<Ionicons name="person-add" size={30} color="#9C27B0" />}
            title="Convidar Morador"
            description="Adicionar uma nova pessoa à república"
            onPress={handleInviteUser}
            color="#9C27B0"
          />
          
          {/* Ver Minhas Tarefas */}
          <ActionButton
            icon={<Ionicons name="list" size={30} color="#FF9800" />}
            title="Minhas Tarefas"
            description="Visualizar tarefas atribuídas a você"
            onPress={handleViewTasks}
            color="#FF9800"
          />
          
          {/* Aprovações Pendentes */}
          <ActionButton
            icon={<Ionicons name="time" size={30} color="#FFC107" />}
            title="Aprovações Pendentes"
            description="Verificar despesas aguardando aprovação"
            onPress={handlePendingApprovals}
            color="#FFC107"
          />
          
          {/* Configurações */}
          <ActionButton
            icon={<Ionicons name="settings" size={30} color="#607D8B" />}
            title="Configurações"
            description="Gerenciar preferências e configurações"
            onPress={handleSettings}
            color="#607D8B"
          />
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    backgroundColor: colors.background.secondary,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
    marginTop: 16,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderLeftWidth: 4,
    ...createShadow(2),
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  actionArrow: {
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
});

export default QuickActionsScreen;