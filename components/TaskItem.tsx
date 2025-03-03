// components/EnhancedTaskItem.tsx
import React from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Task } from '../src/hooks/useTasks';

interface TaskItemProps {
  item: Task;
  onToggleStatus: (task: Task) => Promise<void>;
  currentUserId?: string;
  pendingTaskIds: number[];
  onPress: (taskId: number) => void;
}

const EnhancedTaskItem: React.FC<TaskItemProps> = ({ 
  item, 
  onToggleStatus, 
  currentUserId,
  pendingTaskIds,
  onPress
}) => {
  const isAssignedToCurrentUser = item.assignedUsers?.some(user => user.id === currentUserId);
  const isPending = pendingTaskIds.includes(item.id);
  
  // Determinando a cor do status
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'COMPLETED': return '#4CAF50';
      case 'IN_PROGRESS': return '#2196F3';
      case 'PENDING': return '#FFC107';
      case 'OVERDUE': return '#F44336';
      case 'CANCELLED': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  // Texto amigável do status
  const getStatusText = (status: string) => {
    switch(status) {
      case 'COMPLETED': return 'Concluída';
      case 'IN_PROGRESS': return 'Em andamento';
      case 'PENDING': return 'Pendente';
      case 'OVERDUE': return 'Atrasada';
      case 'CANCELLED': return 'Cancelada';
      default: return status;
    }
  };

  // Formatação de data
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    const isOverdue = date < today && !isToday;
    
    const formattedDate = format(date, "dd/MM", { locale: ptBR });
    const formattedTime = format(date, "HH:mm", { locale: ptBR });
    
    if (isToday) {
      return { text: `Hoje, ${formattedTime}`, isSpecial: true, isOverdue: false, color: '#FFC107' };
    }
    
    if (isTomorrow) {
      return { text: `Amanhã, ${formattedTime}`, isSpecial: true, isOverdue: false, color: '#2196F3' };
    }
    
    return { 
      text: `${formattedDate}, ${formattedTime}`, 
      isSpecial: false, 
      isOverdue: isOverdue,
      color: isOverdue ? '#F44336' : '#7B68EE'
    };
  };
  
  // Formatar a data para exibição
  const formattedDate = item.dueDate ? formatDate(item.dueDate) : null;
  
  // Verificar se há descrição
  const hasDescription = item.description && item.description.trim().length > 0;

  return (
    <TouchableOpacity
      style={[
        styles.taskItem, 
        item.status === 'COMPLETED' && styles.completedTask,
        isPending && styles.pendingTaskItem,
        isAssignedToCurrentUser && styles.myTaskItem
      ]}
      onPress={() => onPress(item.id)}
      disabled={isPending}
    >
      {/* Status indicator */}
      <View style={[styles.statusBar, { backgroundColor: getStatusColor(item.status) }]} />
      
      <View style={styles.taskContent}>
        <TouchableOpacity 
          onPress={() => onToggleStatus(item)}
          style={styles.checkboxContainer}
          disabled={isPending || item.status === 'CANCELLED'}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#7B68EE" />
          ) : (
            <Ionicons 
              name={item.status === 'COMPLETED' ? 'checkbox' : 'checkbox-outline'} 
              size={24} 
              color={item.status === 'COMPLETED' ? '#4CAF50' : 
                     item.status === 'CANCELLED' ? '#9E9E9E' : '#7B68EE'} 
            />
          )}
        </TouchableOpacity>
        
        <View style={styles.taskMainContent}>
          <View style={styles.taskHeader}>
            <Text 
              style={[
                styles.taskTitle, 
                item.status === 'COMPLETED' && styles.completedTaskText,
                item.status === 'CANCELLED' && styles.cancelledTaskText
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>
          
          {/* Descrição da tarefa */}
          {hasDescription && (
            <Text 
              style={[
                styles.taskDescription,
                item.status === 'COMPLETED' && styles.completedTaskText,
                item.status === 'CANCELLED' && styles.cancelledTaskText
              ]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.description}
            </Text>
          )}
          
          <View style={styles.taskFooter}>
            {/* Due date com ícone */}
            {formattedDate && (
              <View style={styles.dueDateContainer}>
                <Ionicons 
                  name="calendar-outline" 
                  size={14} 
                  color={formattedDate.color} 
                />
                <Text 
                  style={[
                    styles.dueDateText, 
                    { color: formattedDate.color },
                    formattedDate.isSpecial && styles.specialDateText,
                    formattedDate.isOverdue && styles.overdueDateText
                  ]}
                >
                  {formattedDate.text}
                </Text>
              </View>
            )}
            
            {/* Category */}
            {item.category && (
              <View style={styles.categoryChip}>
                <FontAwesome5 name="tag" size={12} color="#7B68EE" />
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            )}
            
            {/* Assigned Users */}
            {item.assignedUsers && item.assignedUsers.length > 0 && (
              <View style={styles.assigneesContainer}>
                {item.assignedUsers.slice(0, 3).map((assignee, index) => (
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
                
                {item.assignedUsers.length > 3 && (
                  <View style={[styles.assigneeAvatar, styles.moreAssigneesAvatar]}>
                    <Text style={styles.moreAssigneesText}>
                      +{item.assignedUsers.length - 3}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  taskItem: {
    backgroundColor: '#333',
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  statusBar: {
    width: 5,
    height: '100%',
  },
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 15,
  },
  taskMainContent: {
    flex: 1,
    marginLeft: 10,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  taskDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
    lineHeight: 20,
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
  specialDateText: {
    fontWeight: 'bold',
  },
  overdueDateText: {
    fontWeight: 'bold',
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  completedTask: {
    opacity: 0.7,
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  cancelledTaskText: {
    color: '#999',
    fontStyle: 'italic',
  },
  pendingTaskItem: {
    opacity: 0.8,
  },
  myTaskItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#7B68EE',
    borderRadius: 10
  },
  checkboxContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    width: 24,
    height: 24,
  },
  assigneesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  assigneeAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  avatarImage: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 12,
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
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default EnhancedTaskItem;