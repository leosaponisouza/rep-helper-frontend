// app/(panel)/home.tsx - Versão refatorada e modularizada
import React from 'react';
import { StyleSheet } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Componentes
import HomeHeader from '../../components/Home/HomeHeader';
import QuickActionsSection from '../../components/Home/QuickActionsSection';
import TasksSection from '../../components/Home/TasksSection';
import EventsSection from '../../components/Home/EventsSection';
import HomeContainer from '../../components/Home/HomeContainer';

// Hook personalizado para dados da home
import { useHomeData } from '../../src/hooks/useHomeData';

const HomeScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    stats, 
    userTasks, 
    upcomingEvents, 
    loading, 
    refreshData, 
    refreshing, 
    errors 
  } = useHomeData();

  // Função para navegar para a criação de tarefa
  const handleCreateTask = () => {
    router.push('/(panel)/tasks/create');
  };

  // Função para navegar para a criação de evento
  const handleCreateEvent = () => {
    router.push('/(panel)/events/create');
  };

  // Função para navegar para a criação de despesa
  const handleCreateExpense = () => {
    router.push('/(panel)/expenses/create');
  };

  // Função para navegar para todas as tarefas
  const navigateToAllTasks = () => {
    router.push('/(panel)/tasks/?filter=my-tasks');
  };

  // Função para navegar para todos os eventos
  const navigateToAllEvents = () => {
    router.push('/(panel)/events/calendar');
  };

  // Ações rápidas configuradas
  const quickActions = [
    {
      id: 'new-task',
      title: 'Nova Tarefa',
      icon: 'checkbox-marked-circle-outline',
      color: '#7B68EE',
      bgColor: 'rgba(123, 104, 238, 0.15)',
      onPress: handleCreateTask
    },
    {
      id: 'new-expense',
      title: 'Registrar Despesa',
      icon: 'cash-plus',
      color: '#4CAF50',
      bgColor: 'rgba(76, 175, 80, 0.15)',
      onPress: handleCreateExpense
    },
    {
      id: 'new-event',
      title: 'Novo Evento',
      icon: 'calendar-plus',
      color: '#FF9800',
      bgColor: 'rgba(255, 152, 0, 0.15)',
      onPress: handleCreateEvent
    }
  ];

  return (
    <HomeContainer refreshing={refreshing} onRefresh={refreshData}>
      {/* Header com informações do usuário e república */}
      <HomeHeader 
        user={user} 
        stats={stats} 
        navigation={router}
      />
      
      {/* Ações Rápidas */}
      <QuickActionsSection actions={quickActions} />
      
      {/* Seção de Tarefas do Usuário */}
      <TasksSection 
        tasks={userTasks} 
        loading={loading.tasks} 
        error={errors.tasks}
        onRetry={() => refreshData('tasks')}
        onViewAll={navigateToAllTasks}
        onCreateTask={handleCreateTask}
        currentUserId={user?.uid}
      />
      
      {/* Seção de Eventos Próximos */}
      <EventsSection 
        events={upcomingEvents} 
        loading={loading.events} 
        error={errors.events}
        onRetry={() => refreshData('events')}
        onViewAll={navigateToAllEvents}
        onCreateEvent={handleCreateEvent}
      />
    </HomeContainer>
  );
};
export default HomeScreen;