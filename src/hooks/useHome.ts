import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Task } from '../models/task.model';
import { Event } from '../services/events/eventsTypes';
import { FinancialDashboardSummary, PendingAction, Expense } from '../models/finances.model';
import * as taskService from '../services/taskService';
import { EventsService } from '../services/events/eventsService';
import { ErrorHandler } from '../utils/errorHandling';
import api from '../services/api';

interface HomeData {
  // Tarefas
  userTasks: Task[];
  loadingTasks: boolean;
  tasksError: string | null;
  
  // Eventos
  upcomingEvents: Event[];
  loadingEvents: boolean;
  eventsError: string | null;
  
  // Finanças
  financialSummary: FinancialDashboardSummary | null;
  pendingActions: PendingAction[];
  loadingFinances: boolean;
  financesError: string | null;
  
  // Funções
  refreshData: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  refreshEvents: () => Promise<void>;
  refreshFinances: () => Promise<void>;
}

export const useHome = (): HomeData => {
  const { user } = useAuth();
  const republicId = user?.currentRepublicId;
  
  // Estados para tarefas
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);
  
  // Estados para eventos
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  
  // Estados para finanças
  const [financialSummary, setFinancialSummary] = useState<FinancialDashboardSummary | null>(null);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [loadingFinances, setLoadingFinances] = useState(true);
  const [financesError, setFinancesError] = useState<string | null>(null);
  
  // Referências para controlar requisições simultâneas
  const isFetchingTasks = useRef(false);
  const isFetchingEvents = useRef(false);
  const isFetchingFinances = useRef(false);
  
  // Função para buscar tarefas do usuário
  const fetchUserTasks = useCallback(async () => {
    if (!user || isFetchingTasks.current) return;
    
    try {
      isFetchingTasks.current = true;
      setLoadingTasks(true);
      setTasksError(null);
      
      // Configurar filtro para mostrar apenas tarefas pendentes
      const taskFilter = {
        status: 'PENDING'
      };
      
      // Buscar tarefas atribuídas ao usuário com o filtro aplicado
      const response = await taskService.getAssignedTasksWithFilters(
        taskFilter,
        0,  // primeira página
        3,  // limitar a 3 tarefas para a tela inicial
        'dueDate',
        'ASC'
      );
      
      setUserTasks(response.content);
    } catch (err) {
      const parsedError = await ErrorHandler.parseError(err);
      setTasksError(parsedError.message);
      console.error('Erro ao buscar tarefas do usuário:', err);
    } finally {
      setLoadingTasks(false);
      isFetchingTasks.current = false;
    }
  }, [user]);
  
  // Função para buscar próximos eventos
  const fetchUpcomingEvents = useCallback(async () => {
    if (!republicId || isFetchingEvents.current) return;
    
    try {
      isFetchingEvents.current = true;
      setLoadingEvents(true);
      setEventsError(null);
      
      // Usar o serviço de eventos para buscar próximos eventos
      const events = await EventsService.fetchUpcomingEvents();
      
      // Ordenar por data (mais próximos primeiro) e limitar a 2
      const sortedEvents = events
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 2);
      
      setUpcomingEvents(sortedEvents);
    } catch (err) {
      const parsedError = await ErrorHandler.parseError(err);
      setEventsError(parsedError.message);
      console.error('Erro ao buscar próximos eventos:', err);
    } finally {
      setLoadingEvents(false);
      isFetchingEvents.current = false;
    }
  }, [republicId]);
  
  // Função para buscar resumo financeiro
  const fetchFinancialSummary = useCallback(async () => {
    if (!republicId || isFetchingFinances.current) return;
    
    try {
      isFetchingFinances.current = true;
      setLoadingFinances(true);
      setFinancesError(null);
      
      // Buscar resumo do dashboard financeiro
      const response = await api.get<FinancialDashboardSummary>(
        `/api/v1/financial-dashboard/summary/${republicId}`
      );
      
      setFinancialSummary(response.data);
      
      // Buscar ações pendentes
      const pendingResponse = await api.get(
        `/api/v1/financial-dashboard/pending-actions/${republicId}`
      );
      
      if (pendingResponse.data && Array.isArray(pendingResponse.data.pendingExpenses)) {
        const mappedPendingActions = pendingResponse.data.pendingExpenses.map((expense: Expense) => ({
          ...expense,
          date: expense.expenseDate // Adicionar campo date para compatibilidade
        }));
        
        setPendingActions(mappedPendingActions);
      } else {
        setPendingActions([]);
      }
    } catch (err) {
      const parsedError = await ErrorHandler.parseError(err);
      setFinancesError(parsedError.message);
      console.error('Erro ao buscar resumo financeiro:', err);
    } finally {
      setLoadingFinances(false);
      isFetchingFinances.current = false;
    }
  }, [republicId]);
  
  // Função para atualizar todas as seções
  const refreshData = useCallback(async () => {
    const promises = [
      fetchUserTasks(),
      fetchUpcomingEvents(),
      fetchFinancialSummary()
    ];
    
    await Promise.all(promises);
  }, [fetchUserTasks, fetchUpcomingEvents, fetchFinancialSummary]);
  
  // Funções individuais de atualização para cada seção
  const refreshTasks = useCallback(async () => {
    await fetchUserTasks();
  }, [fetchUserTasks]);
  
  const refreshEvents = useCallback(async () => {
    await fetchUpcomingEvents();
  }, [fetchUpcomingEvents]);
  
  const refreshFinances = useCallback(async () => {
    await fetchFinancialSummary();
  }, [fetchFinancialSummary]);
  
  // Efeito para carregar dados iniciais
  useEffect(() => {
    refreshData();
    
    // Limpar estados quando o componente for desmontado
    return () => {
      setUserTasks([]);
      setUpcomingEvents([]);
      setFinancialSummary(null);
      setPendingActions([]);
    };
  }, [refreshData]);
  
  return {
    // Dados de tarefas
    userTasks,
    loadingTasks,
    tasksError,
    
    // Dados de eventos
    upcomingEvents,
    loadingEvents,
    eventsError,
    
    // Dados financeiros
    financialSummary,
    pendingActions,
    loadingFinances,
    financesError,
    
    // Funções
    refreshData,
    refreshTasks,
    refreshEvents,
    refreshFinances
  };
}; 