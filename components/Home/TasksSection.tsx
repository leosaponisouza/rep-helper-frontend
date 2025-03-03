// components/Home/TasksSection.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Task } from '../../src/hooks/useTasks';
import EnhancedTaskItem from '../TaskItem';

interface TasksSectionProps {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onViewAll: () => void;
  onCreateTask: () => void;
  currentUserId?: string;
}

const TasksSection: React.FC<TasksSectionProps> = ({
  tasks,
  loading,
  error,
  onRetry,
  onViewAll,
  onCreateTask,
  currentUserId
}) => {
  const handleToggleTaskStatus = async () => {
    // Esta função é um placeholder para o EnhancedTaskItem
    // Na implementação real, isso seria manipulado no nível do hook useTasks
  };

  const navigateToTaskDetails = (taskId: number) => {
    // Esta função é um placeholder para o EnhancedTaskItem
    // Na implementação real, seria uma navegação para a tela de detalhes da tarefa
  };

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={20} color="#7B68EE" />
          <Text style={styles.sectionTitle}>Suas Tarefas</Text>
        </View>
        
        <TouchableOpacity 
          onPress={onViewAll}
          style={styles.viewAllButton}
        >
          <Text style={styles.viewAllText}>Ver todas</Text>
          <Ionicons name="chevron-forward" size={16} color="#7B68EE" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#7B68EE" />
          <Text style={styles.loadingText}>Carregando tarefas...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#FF6347" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={onRetry}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : tasks.length > 0 ? (
        <View style={styles.tasksContainer}>
          {tasks.map(task => (
            <EnhancedTaskItem 
              key={task.id?.toString()} 
              item={task}
              onToggleStatus={handleToggleTaskStatus}
              currentUserId={currentUserId}
              pendingTaskIds={[]}
              onPress={navigateToTaskDetails}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons 
            name="checkbox-marked-circle-outline" 
            size={40} 
            color="#7B68EE" 
            style={{ opacity: 0.6 }}
          />
          <Text style={styles.emptyText}>
            Você não tem tarefas atribuídas
          </Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={onCreateTask}
          >
            <Text style={styles.createButtonText}>Criar Tarefa</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#7B68EE',
    fontSize: 14,
    marginRight: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#aaa',
    marginTop: 10,
    fontSize: 14,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF6347',
    marginTop: 10,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 99, 71, 0.15)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#FF6347',
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    marginVertical: 16,
    fontSize: 14,
  },
  createButton: {
    backgroundColor: '#7B68EE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tasksContainer: {
    marginBottom: 8,
  }
});

export default TasksSection;