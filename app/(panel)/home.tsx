// app/(panel)/home.tsx - Versão atualizada com recarga automática
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import api from '../../src/services/api';
import { ErrorHandler } from '../../src/utils/errorHandling';
import { useRouter } from 'expo-router';
import { StatusBar } from 'react-native';
import { Task } from '../../src/hooks/useTasks';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFocusEffect } from '@react-navigation/native';
import { getDisplayName } from '@/src/utils/userUtils';

// Tipos para melhor tipagem
interface QuickAction {
  id: string;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  onPress: () => void;
}

interface HomeStats {
  totalExpenses: number;
  pendingTasks: number;
  upcomingEvents: number;
  republicName: string;
}

// Nova interface para tarefas do usuário
interface UserTask extends Task {
  isOverdue?: boolean;
}

const HomeScreen = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [userTasks, setUserTasks] = useState<UserTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Buscar dados da home
  const fetchHomeData = async () => {
    try {
      setRefreshing(true);
      console.log("Iniciando fetchHomeData");
      
      // Carregar estatísticas
      try {
        const statsResponse = await api.get('/home/stats');
        if (statsResponse?.data?.data) {
          setStats(statsResponse.data.data);
          console.log("Estatísticas carregadas com sucesso");
        }
      } catch (statsError) {
        console.error("Erro ao carregar estatísticas:", statsError);
      }
      
      // Buscar tarefas do usuário
      await fetchUserTasks();
      
      // Atualizar timestamp da última atualização
      setLastRefresh(Date.now());
    } catch (error) {
      console.error("Erro em fetchHomeData:", error);
      ErrorHandler.handle(error);
    } finally {
      setRefreshing(false);
      console.log("Finalizando fetchHomeData");
    }
  };
  
  // Função atualizada para buscar tarefas do usuário
  const fetchUserTasks = async () => {
    try {
      setLoadingTasks(true);
      setTaskError(null);
      console.log("Iniciando fetchUserTasks");
      
      // Chamar o endpoint com tratamento completo de erros
      console.log("Chamando API /api/v1/tasks/assigned");
      const response = await api.get('/api/v1/tasks/assigned');
      console.log("Resposta de API recebida:", response.status);
      
      // Verificar se o formato da resposta é um array
      if (!response || !response.data) {
        console.error("Resposta da API inválida");
        setTaskError("Resposta da API inválida");
        setUserTasks([]);
        return;
      }
      
      const tasks = response.data;
      console.log(`Recebidas ${Array.isArray(tasks) ? tasks.length : 'não é array'} tarefas`);
      
      // Garantir que temos um array
      if (!Array.isArray(tasks)) {
        console.error("Dados retornados não são um array:", tasks);
        setTaskError("Formato de dados inválido");
        setUserTasks([]);
        return;
      }
      
      // Filtrar apenas tarefas ativas (não completas ou canceladas)
      const activeTasks = tasks.filter(task => 
        task && task.status && ['PENDING', 'IN_PROGRESS', 'OVERDUE'].includes(task.status)
      );
      console.log(`Tarefas ativas: ${activeTasks.length}`);
      
      // Adicionar informação de atraso
      const tasksWithOverdueInfo = activeTasks.map(task => {
        try {
          let isOverdue = false;
          
          if (task.dueDate) {
            const dueDate = parseISO(task.dueDate);
            const now = new Date();
            isOverdue = dueDate < now;
          }
          
          return {
            ...task,
            isOverdue
          };
        } catch (error) {
          console.error("Erro ao processar tarefa:", error);
          return task;
        }
      });
      
      // Ordenar com segurança
      const sortedTasks = [...tasksWithOverdueInfo].sort((a, b) => {
        try {
          // Prioridade para tarefas atrasadas
          if (a.isOverdue && !b.isOverdue) return -1;
          if (!a.isOverdue && b.isOverdue) return 1;
          
          // Se ambas têm data de vencimento, ordenar por data (mais próximas primeiro)
          if (a.dueDate && b.dueDate) {
            return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
          }
          
          // Tarefas sem data de vencimento vão por último
          if (!a.dueDate && b.dueDate) return 1;
          if (a.dueDate && !b.dueDate) return -1;
          
          return 0;
        } catch (error) {
          console.error("Erro ao ordenar tarefas:", error);
          return 0;
        }
      });
      
      console.log(`Atualizando estado com ${Math.min(5, sortedTasks.length)} tarefas`);
      setUserTasks(sortedTasks.slice(0, 5)); // Mostrar apenas as 5 primeiras tarefas
    } catch (error) {
      console.error("Erro em fetchUserTasks:", error);
      setTaskError(error.message || "Erro ao buscar tarefas");
      setUserTasks([]);
    } finally {
      setLoadingTasks(false);
      console.log("Finalizando fetchUserTasks");
    }
  };

  // Carregar quando montar o componente
  useEffect(() => {
    console.log("Efeito inicial - montando componente");
    fetchHomeData();
  }, []);
  
  // Recarregar sempre que a tela receber foco
  useFocusEffect(
    useCallback(() => {
      console.log('Tela Home recebeu foco, recarregando dados...');
      // Recarregar dados sempre que a tela receber foco
      fetchHomeData();
      
      return () => {
        // Cleanup se necessário
        console.log('Tela Home perdeu foco');
      };
    }, [])
  );

  // Ações rápidas
  const quickActions: QuickAction[] = [
    {
      id: 'new-task',
      title: 'Nova Tarefa',
      icon: 'plus-circle-outline',
      color: '#7B68EE',
      onPress: () => {
        // Ir para a tab de tarefas primeiro, depois para a tela de criação
        router.push('/(panel)/tasks');
        
        // Pequeno delay para garantir que a navegação para a tab ocorra primeiro
        setTimeout(() => {
          router.push('/(panel)/tasks/create');
        }, 100);
      }
    },
    {
      id: 'new-expense',
      title: 'Registrar Despesa',
      icon: 'cash-plus',
      color: '#7B68EE',
      onPress: () => {
        // Mesmo padrão para despesas
        router.push('/(panel)/expenses');
        setTimeout(() => {
          router.push('/(panel)/expenses/create');
        }, 100);
      }
    },
    {
      id: 'new-event',
      title: 'Novo Evento',
      icon: 'calendar-plus',
      color: '#7B68EE',
      onPress: () => {
        // Mesmo padrão para eventos
        router.push('/(panel)/events');
        setTimeout(() => {
          router.push('/(panel)/events/create');
        }, 100);
      }
    }
  ];

  // Renderizar ação rápida
  const QuickActionButton = ({ action }: { action: QuickAction }) => (
    <TouchableOpacity 
      style={[styles.quickActionButton, { backgroundColor: action.color + '15' }]}
      onPress={action.onPress}
    >
      <MaterialCommunityIcons 
        name={action.icon} 
        size={24} 
        color={action.color} 
      />
      <Text style={[styles.quickActionText, { color: action.color }]}>
        {action.title}
      </Text>
    </TouchableOpacity>
  );
  
  // Formatador de datas para tarefas
  const formatTaskDueDate = (dateString?: string) => {
    if (!dateString) return null;
    
    try {
      const dueDate = parseISO(dateString);
      
      if (isToday(dueDate)) {
        return { text: 'Hoje', color: '#FF9800' };
      } else if (isTomorrow(dueDate)) {
        return { text: 'Amanhã', color: '#FF9800' };
      } else {
        const formattedDate = format(dueDate, 'dd/MM', { locale: ptBR });
        const now = new Date();
        return { 
          text: formattedDate, 
          color: dueDate < now ? '#F44336' : '#7B68EE' 
        };
      }
    } catch (error) {
      console.error("Erro ao formatar data:", error, dateString);
      return { text: 'Data inválida', color: '#9E9E9E' };
    }
  };
  
  // Renderizador de item de tarefa
  const TaskItem = ({ task }: { task: UserTask }) => {
    const dueDate = formatTaskDueDate(task.dueDate);
    
    return (
      <TouchableOpacity 
        style={[
          styles.taskItem, 
          task.isOverdue && styles.overdueTaskItem
        ]}
        onPress={() => {
          
          router.push(`/(panel)/tasks/${task.id}`)}}
      >
        <View style={styles.taskItemHeader}>
          <Text style={styles.taskTitle} numberOfLines={1}>
            {task.title}
          </Text>
          
          {task.category && (
            <View style={styles.categoryChip}>
              <FontAwesome5 name="tag" size={12} color="#7B68EE" />
              <Text style={styles.categoryText}>{task.category}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.taskItemFooter}>
          {dueDate && (
            <View style={styles.dueDateContainer}>
              <Ionicons 
                name="calendar" 
                size={14} 
                color={dueDate.color} 
              />
              <Text style={[styles.dueDateText, { color: dueDate.color }]}>
                {dueDate.text}
              </Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.completeTaskButton}
            onPress={() => {
              router.push('/(panel)/tasks');
                  
              // Pequeno delay para garantir que a navegação para a tab ocorra primeiro
              setTimeout(() => {
                router.push(`/(panel)/tasks/${task.id}`);
              }, 100);
            }}
          >
            <Text style={styles.completeTaskText}>Concluir</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Função para chamar a função fetchUserTasks diretamente
  const retryLoadingTasks = () => {
    console.log("Tentando recarregar tarefas");
    fetchUserTasks();
  };
  
  // Função forçar recarga total
  const forceRefresh = () => {
    console.log("Forçando recarga completa");
    fetchHomeData();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={forceRefresh}
            colors={['#7B68EE']}
            tintColor={'#7B68EE'}
          />
        }
      >
        {/* Cabeçalho */}
        <View style={styles.headerContainer}>
          <View>
          <Text style={styles.greeting}>Olá, {getDisplayName(user, true)}!</Text>
            <Text style={styles.republicName}>
              {stats?.republicName || 'Sua República'}
            </Text>
          </View>
        </View>

        {/* Estatísticas Rápidas */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="cash" size={24} color="#7B68EE" />
            <Text style={styles.statValue}>
              R$ {stats?.totalExpenses?.toFixed(2) || '0,00'}
            </Text>
            <Text style={styles.statLabel}>Despesas</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="checklist" size={24} color="#7B68EE" />
            <Text style={styles.statValue}>
              {stats?.pendingTasks || 0}
            </Text>
            <Text style={styles.statLabel}>Tarefas Pendentes</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="calendar" size={24} color="#7B68EE" />
            <Text style={styles.statValue}>
              {stats?.upcomingEvents || 0}
            </Text>
            <Text style={styles.statLabel}>Próximos Eventos</Text>
          </View>
        </View>

        {/* Seção de Tarefas do Usuário */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Minhas Tarefas</Text>
            <TouchableOpacity 
              onPress={() => router.push('/(panel)/tasks/?filter=my-tasks')}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>Ver todas</Text>
              <Ionicons name="arrow-forward" size={16} color="#7B68EE" />
            </TouchableOpacity>
          </View>
          
          {loadingTasks ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#7B68EE" />
              <Text style={styles.loadingText}>Carregando tarefas...</Text>
            </View>
          ) : taskError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={40} color="#FF6347" />
              <Text style={styles.errorText}>{taskError}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={retryLoadingTasks}
              >
                <Text style={styles.retryButtonText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : userTasks.length > 0 ? (
            <View style={styles.tasksContainer}>
              {userTasks.map(task => (
                <TaskItem key={task.id?.toString()} task={task} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyTasksContainer}>
              <MaterialCommunityIcons 
                name="checkbox-marked-circle-outline" 
                size={40} 
                color="#7B68EE" 
              />
              <Text style={styles.emptyTasksText}>
                Você não tem tarefas atribuídas.
              </Text>
              <TouchableOpacity 
                style={styles.createTaskButton}
                onPress={() => {  // Ir para a tab de tarefas primeiro, depois para a tela de criação
                  router.push('/(panel)/tasks');
                  
                  // Pequeno delay para garantir que a navegação para a tab ocorra primeiro
                  setTimeout(() => {
                    router.push('/(panel)/tasks/create');
                  }, 100);}}
              >
                <Text style={styles.createTaskText}>Criar uma tarefa</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Ações Rápidas */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.quickActionsScroll}
          >
            {quickActions.map(action => (
              <QuickActionButton key={action.id} action={action} />
            ))}
          </ScrollView>
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
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#222',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  republicName: {
    fontSize: 16,
    color: '#aaa',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  statBox: {
    alignItems: 'center',
    width: '30%',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  sectionContainer: {
    backgroundColor: '#333',
    marginTop: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#fff',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#7B68EE',
    marginRight: 4,
    fontSize: 14,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#aaa',
    marginTop: 10,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF6347',
    marginTop: 10,
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#333',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#7B68EE',
  },
  retryButtonText: {
    color: '#7B68EE',
    fontWeight: 'bold',
  },
  tasksContainer: {
    marginBottom: 10,
  },
  taskItem: {
    backgroundColor: '#444',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  overdueTaskItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#F44336',
  },
  taskItemHeader: {
    marginBottom: 10,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: '#7B68EE',
    fontSize: 12,
    marginLeft: 4,
  },
  taskItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateText: {
    fontSize: 13,
    marginLeft: 5,
  },
  completeTaskButton: {
    backgroundColor: '#7B68EE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  completeTaskText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyTasksContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyTasksText: {
    color: '#aaa',
    marginVertical: 10,
    textAlign: 'center',
  },
  createTaskButton: {
    backgroundColor: '#7B68EE',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  createTaskText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  quickActionsScroll: {
    flexDirection: 'row',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#444',
  },
  quickActionText: {
    marginLeft: 8,
    fontWeight: '600',
    color: '#fff',
  },
});

export default HomeScreen;