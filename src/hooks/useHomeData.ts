// src/hooks/useHomeData.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ErrorHandler } from '../utils/errorHandling';
import { parseISO, isAfter, isBefore } from 'date-fns';
import { Task } from '@/src/models/task.model';
import { Event } from './useEvents';

interface HomeStats {
  totalExpenses: number;
  pendingTasks: number;
  upcomingEvents: number;
  republicName: string;
}

interface HomeData {
  stats: HomeStats | null;
  userTasks: Task[];
  upcomingEvents: Event[];
  loading: {
    stats: boolean;
    tasks: boolean;
    events: boolean;
  };
  errors: {
    stats: string | null;
    tasks: string | null;
    events: string | null;
  };
  refreshing: boolean;
  refreshData: (section?: 'stats' | 'tasks' | 'events' | 'all') => Promise<void>;
  lastRefreshed: Date;
}

export function useHomeData(): HomeData {
  const { user } = useAuth();
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  
  // Estado de carregamento para cada seção
  const [loading, setLoading] = useState({
    stats: true,
    tasks: true,
    events: true
  });
  
  // Estado de erro para cada seção
  const [errors, setErrors] = useState({
    stats: null as string | null,
    tasks: null as string | null,
    events: null as string | null
  });

  // Função para buscar estatísticas da home
  const fetchHomeStats = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, stats: true }));
      setErrors(prev => ({ ...prev, stats: null }));
      
      const statsResponse = await api.get('/api/v1/home/stats');
      if (statsResponse?.data) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
      const parsedError = await ErrorHandler.parseError(error);
      setErrors(prev => ({ ...prev, stats: parsedError.message }));
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, []);

  // Função para buscar tarefas do usuário
  const fetchUserTasks = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, tasks: true }));
      setErrors(prev => ({ ...prev, tasks: null }));
      
      const response = await api.get('/api/v1/tasks/assigned');
      
      if (!response || !response.data) {
        throw new Error("Resposta da API inválida");
      }
      
      const tasks = response.data;
      
      if (!Array.isArray(tasks)) {
        throw new Error("Formato de dados inválido");
      }
      
      // Filtrar apenas tarefas ativas
      const activeTasks = tasks.filter(task => 
        task && task.status && ['pending', 'in_progress', 'overdue'].includes(task.status)
      );
      
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
          return task;
        }
      });
      
      // Ordenar com segurança
      const sortedTasks = [...tasksWithOverdueInfo].sort((a, b) => {
        // Prioridade para tarefas atrasadas
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        
        // Se ambas têm data de vencimento, ordenar por data
        if (a.dueDate && b.dueDate) {
          return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
        }
        
        return 0;
      });
      
      setUserTasks(sortedTasks.slice(0, 3)); // Mostrar apenas as 3 primeiras
    } catch (error) {
      console.error("Erro em fetchUserTasks:", error);
      const parsedError = await ErrorHandler.parseError(error);
      setErrors(prev => ({ ...prev, tasks: parsedError.message }));
    } finally {
      setLoading(prev => ({ ...prev, tasks: false }));
    }
  }, []);

  // Função para buscar eventos próximos
  const fetchUpcomingEvents = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, events: true }));
      setErrors(prev => ({ ...prev, events: null }));
      
      const response = await api.get('/api/v1/events/upcoming');
      
      if (!response || !response.data) {
        throw new Error("Resposta da API inválida");
      }
      
      const events = response.data;
      
      if (!Array.isArray(events)) {
        throw new Error("Formato de dados inválido");
      }
      
      // Processar eventos para exibição na home
      const processedEvents = events.map(event => {
        // Adicionar flags para estado atual se não estiverem presentes
        const now = new Date();
        const startDate = parseISO(event.startDate);
        const endDate = parseISO(event.endDate);
        
        const isHappening = event.isHappening || (
          isAfter(now, startDate) && isBefore(now, endDate)
        );
        
        const isFinished = event.isFinished || isAfter(now, endDate);
        
        // Calcular número de participantes confirmados
        const confirmedCount = event.invitations 
          ? event.invitations.filter((inv: { status: string; }) => inv.status === 'CONFIRMED').length 
          : 0;
        
        return {
          ...event,
          isHappening,
          isFinished,
          confirmedCount
        };
      });
      
      // Ordenar eventos pela data
      const sortedEvents = [...processedEvents].sort((a, b) => {
        const dateA = parseISO(a.startDate);
        const dateB = parseISO(b.startDate);
        return dateA.getTime() - dateB.getTime();
      });
      
      setUpcomingEvents(sortedEvents.slice(0, 3)); // Mostrar apenas os 3 próximos
    } catch (error) {
      console.error("Erro em fetchUpcomingEvents:", error);
      const parsedError = await ErrorHandler.parseError(error);
      setErrors(prev => ({ ...prev, events: parsedError.message }));
    } finally {
      setLoading(prev => ({ ...prev, events: false }));
    }
  }, []);

  // Função unificada para recarregar dados
  const refreshData = useCallback(async (section: 'stats' | 'tasks' | 'events' | 'all' = 'all') => {
    try {
      setRefreshing(true);
      
      const promises: Promise<void>[] = [];
      
      if (section === 'all' || section === 'stats') {
        promises.push(fetchHomeStats());
      }
      
      if (section === 'all' || section === 'tasks') {
        promises.push(fetchUserTasks());
      }
      
      if (section === 'all' || section === 'events') {
        promises.push(fetchUpcomingEvents());
      }
      
      await Promise.all(promises);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchHomeStats, fetchUserTasks, fetchUpcomingEvents]);

  // Carregar dados inicialmente
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    stats,
    userTasks,
    upcomingEvents,
    loading,
    errors,
    refreshing,
    refreshData,
    lastRefreshed
  };
}