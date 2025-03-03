// components/Home/TasksSection.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Task } from '../../src/hooks/useTasks';

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
  // Formatador de datas para tarefas
  const formatTaskDueDate = (dateString?: string) => {
    if (!dateString) return null;
    
    try {
      const dueDate = parseISO(dateString);
      
      if (isToday(dueDate)) {
        return { text: 'Hoje', color: '#FF9800' };
      } else if (isTomorrow(dueDate)) {
        return { text: 'Amanhã', color: '#2196F3' };
      } else {
        const formattedDate = format(dueDate, 'dd/MM', { locale: ptBR });
        const now = new Date();
        return { 
          text: formattedDate, 
          color: dueDate < now ? '#F44336' : '#7B68EE' 
        };
      }
    } catch (error) {
      return { text: 'Data inválida', color: '#9E9E9E' };
    }
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
            <TaskItem 
              key={task.id?.toString()} 
              task={task} 
              currentUserId={currentUserId}
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

interface TaskItemProps {
  task: Task;
  currentUserId?: string;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, currentUserId }) => {
  // Formatar a data para exibição
  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    
    try {
      const dueDate = parseISO(dateString);
      
      if (isToday(dueDate)) {
        return { text: 'Hoje', color: '#FF9800' };
      } else if (isTomorrow(dueDate)) {
        return { text: 'Amanhã', color: '#2196F3' };
      } else {
        const formattedDate = format(dueDate, 'dd/MM', { locale: ptBR });
        const now = new Date();
        return { 
          text: formattedDate, 
          color: dueDate < now ? '#F44336' : '#7B68EE' 
        };
      }
    } catch (error) {
      return { text: 'Data inválida', color: '#9E9E9E' };
    }
  };

  const formattedDate = task.dueDate ? formatDueDate(task.dueDate) : null;
  const hasDescription = task.description && task.description.trim().length > 0;

  return (
    <TouchableOpacity style={styles.taskItem}>
      <View style={styles.taskMainContent}>
        <Text 
          style={styles.taskTitle}
          numberOfLines={1}
        >
          {task.title}
        </Text>
        
        {hasDescription && (
          <Text 
            style={styles.taskDescription}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {task.description}
          </Text>
        )}
        
        <View style={styles.taskFooter}>
          {formattedDate && (
            <View style={styles.dueDateContainer}>
              <Ionicons 
                name="calendar-outline" 
                size={14} 
                color={formattedDate.color} 
              />
              <Text style={[styles.dueDateText, { color: formattedDate.color }]}>
                {formattedDate.text}
              </Text>
            </View>
          )}
          
          {task.category && (
            <View style={styles.categoryChip}>
              <FontAwesome5 name="tag" size={12} color="#7B68EE" />
              <Text style={styles.categoryText}>{task.category}</Text>
            </View>
          )}
          
          {task.assignedUsers && task.assignedUsers.length > 0 && (
            <View style={styles.assigneesContainer}>
              {task.assignedUsers.slice(0, 3).map((assignee, index) => (
                <View 
                  key={assignee.id} 
                  style={[
                    styles.assigneeAvatar, 
                    { zIndex: 10 - index, marginLeft: index > 0 ? -10 : 0 },
                    assignee.id === currentUserId && styles.currentUserAvatar
                  ]}
                >
                  {assignee.profilePictureUrl ? (
                    <Image 
                      source={{ uri: assignee.profilePictureUrl }} 
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarInitial}>
                      {assignee.nickname
                        ? assignee.nickname.charAt(0).toUpperCase()
                        : assignee.name?.charAt(0).toUpperCase() || '?'}
                    </Text>
                  )}
                </View>
              ))}
              
              {task.assignedUsers.length > 3 && (
                <View style={[styles.assigneeAvatar, styles.moreAssigneesAvatar]}>
                  <Text style={styles.moreAssigneesText}>
                    +{task.assignedUsers.length - 3}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
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
  },
  taskItem: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#7B68EE',
  },
  taskMainContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
  },
  taskFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  dueDateText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  categoryText: {
    color: '#7B68EE',
    fontSize: 12,
    marginLeft: 4,
  },
  assigneesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  assigneeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  avatarImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  currentUserAvatar: {
    borderColor: '#7B68EE',
    backgroundColor: '#444',
  },
  moreAssigneesAvatar: {
    backgroundColor: 'rgba(123, 104, 238, 0.3)',
  },
  moreAssigneesText: {
    color: '#7B68EE',
    fontSize: 9,
    fontWeight: 'bold',
  },
});

export default TasksSection;