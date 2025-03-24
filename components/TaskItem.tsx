// components/TaskItem.tsx
import React, { memo, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Task, RecurrenceType } from '../src/models/task.model';
import { colors, createShadow } from '../src/styles/sharedStyles';

interface TaskItemProps {
  item: Task;
  onToggleStatus: (task: Task) => Promise<void>;
  currentUserId?: string;
  pendingTaskIds: number[];
  onPress: (taskId: number) => void;
  onStopRecurrence?: (taskId: number) => void;
}

// Componente para exibir informações de recorrência de forma consistente
const RecurrenceIndicator = memo(({ 
  type, 
  compact = false 
}: { 
  type?: RecurrenceType; 
  compact?: boolean 
}) => {
  // Texto amigável para o tipo de recorrência
  const recurrenceText = useMemo(() => {
    switch (type) {
      case 'DAILY': return 'Diária';
      case 'WEEKLY': return 'Semanal';
      case 'MONTHLY': return 'Mensal';
      case 'YEARLY': return 'Anual';
      default: return 'Recorrente';
    }
  }, [type]);

  if (compact) {
    return (
      <Text style={styles.recurringIndicator}>
        {" "}<Ionicons name="repeat" size={14} color={colors.success.main} />
      </Text>
    );
  }

  return (
    <View style={styles.recurrenceChip}>
      <Ionicons name="repeat" size={12} color={colors.success.main} />
      <Text style={styles.recurrenceText}>
        {recurrenceText}
      </Text>
    </View>
  );
});

// Componente otimizado com memo para evitar re-renderizações desnecessárias
const TaskItem: React.FC<TaskItemProps> = memo(({
  item,
  onToggleStatus,
  currentUserId,
  pendingTaskIds,
  onPress,
  onStopRecurrence
}) => {
  // Memoize valores calculados para evitar recálculos em cada renderização
  const isAssignedToCurrentUser = useMemo(() =>
    item.assignedUsers?.some((user) => user.uid === currentUserId),
    [item.assignedUsers, currentUserId]
  );

  const isPending = pendingTaskIds.includes(item.id);

  // Determinando a cor do status - memoizado
  const statusColor = useMemo(() => {
    switch (item.status) {
      case 'COMPLETED': return colors.success.main;
      case 'IN_PROGRESS': return colors.primary.main;
      case 'PENDING': return colors.warning.main;
      case 'OVERDUE': return colors.error.main;
      case 'CANCELLED': return colors.grey[500];
      default: return colors.grey[500];
    }
  }, [item.status]);

  // Texto amigável do status - memoizado
  const statusText = useMemo(() => {
    switch (item.status) {
      case 'COMPLETED': return 'Concluída';
      case 'IN_PROGRESS': return 'Em andamento';
      case 'PENDING': return 'Pendente';
      case 'OVERDUE': return 'Atrasada';
      case 'CANCELLED': return 'Cancelada';
      default: return item.status;
    }
  }, [item.status]);

  // Formatação de data - memoizada
  const formattedDate = useMemo(() => {
    if (!item.due_date) return null;

    const date = new Date(item.due_date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    const isOverdue = date < today && !isToday;

    const formattedDate = format(date, "dd/MM", { locale: ptBR });
    const formattedTime = format(date, "HH:mm", { locale: ptBR });

    if (isToday) {
      return { text: `Hoje, ${formattedTime}`, isSpecial: true, isOverdue: false, color: colors.warning.main };
    }

    if (isTomorrow) {
      return { text: `Amanhã, ${formattedTime}`, isSpecial: true, isOverdue: false, color: colors.primary.main };
    }

    return {
      text: `${formattedDate}, ${formattedTime}`,
      isSpecial: false,
      isOverdue: isOverdue,
      color: isOverdue ? colors.error.main : colors.primary.main
    };
  }, [item.due_date]);

  // Verificar se há descrição - memoizado
  const hasDescription = useMemo(() =>
    item.description && item.description.trim().length > 0,
    [item.description]
  );

  // Função para formatar o padrão de recorrência de forma amigável
  const getRecurrencePattern = useMemo(() => {
    if (!item.recurring) return null;
    
    const interval = item.recurrenceInterval || 1;
    let text;
    
    switch (item.recurrenceType) {
      case 'DAILY':
        text = interval === 1 ? 'Diária' : `A cada ${interval} dias`;
        break;
      case 'WEEKLY':
        text = interval === 1 ? 'Semanal' : `A cada ${interval} semanas`;
        break;
      case 'MONTHLY':
        text = interval === 1 ? 'Mensal' : `A cada ${interval} meses`;
        break;
      case 'YEARLY':
        text = interval === 1 ? 'Anual' : `A cada ${interval} anos`;
        break;
      default:
        text = 'Recorrente';
    }
    
    return text;
  }, [item.recurring, item.recurrenceType, item.recurrenceInterval]);

  // Handler para toggle status
  const handleToggleStatus = () => {
    onToggleStatus(item);
  };

  // Handler para stop recurrence
  const handleStopRecurrence = () => {
    if (onStopRecurrence) {
      onStopRecurrence(item.id);
    }
  };

  // Handler para press
  const handlePress = () => {
    onPress(item.id);
  };

  return (
    <TouchableOpacity
      style={[
        styles.taskItem,
        { borderLeftColor: statusColor },
        item.status === 'COMPLETED' && styles.completedTask,
        isPending && styles.pendingTaskItem,
        isAssignedToCurrentUser && styles.myTaskItem,
        item.recurring && styles.recurringTaskItem
      ]}
      onPress={handlePress}
      disabled={isPending}
    >
      <View style={styles.taskContent}>
        <TouchableOpacity
          onPress={handleToggleStatus}
          style={styles.checkboxContainer}
          disabled={isPending || item.status === 'CANCELLED'}
        >
          {isPending ? (
            <ActivityIndicator size="small" color={colors.primary.main} />
          ) : (
            <Ionicons
              name={item.status === 'COMPLETED' ? 'checkbox' : 'square-outline'}
              size={24}
              color={item.status === 'COMPLETED' ? colors.success.main :
                item.status === 'CANCELLED' ? colors.grey[500] : colors.primary.main}
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
              {item.recurring && (
                <RecurrenceIndicator compact={true} />
              )}
            </Text>

            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusText}
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
                <FontAwesome5 name="tag" size={12} color={colors.primary.main} />
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            )}

            {/* Recurrence indicator com padrão detalhado */}
            {item.recurring && (
              <View style={styles.recurrenceChip}>
                <Ionicons name="repeat" size={12} color={colors.success.main} />
                <Text style={styles.recurrenceText}>
                  {getRecurrencePattern}
                </Text>
                {onStopRecurrence && (
                  <TouchableOpacity
                    style={styles.stopRecurrenceButton}
                    onPress={handleStopRecurrence}
                  >
                    <Ionicons name="close-circle" size={14} color={colors.error.main} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {item.assignedUsers && item.assignedUsers.length > 0 && (
              <View style={styles.assigneesContainer}>
                {item.assignedUsers.slice(0, 3).map((assignedUser, index) => {
                  // Verifica se é o usuário atual
                  const isCurrentUser = assignedUser.uid === currentUserId;

                  // Obtém a inicial para o avatar (preferência: nickname > name > email > id)
                  let initial = '?';
                  if (assignedUser.nickname && assignedUser.nickname.length > 0) {
                    initial = assignedUser.nickname.charAt(0);
                  } else if (assignedUser.name && assignedUser.name.length > 0) {
                    initial = assignedUser.name.charAt(0);
                  } else if (assignedUser.email && assignedUser.email.length > 0) {
                    initial = assignedUser.email.charAt(0);
                  } else if (assignedUser.uid) {
                    initial = assignedUser.uid.charAt(0);
                  }

                  return (
                    <View
                      key={assignedUser.uid || `user-${index}`}
                      style={[
                        styles.assigneeAvatar,
                        { zIndex: 10 - index, marginLeft: index > 0 ? -10 : 0 },
                        isCurrentUser && styles.currentUserAvatar
                      ]}
                    >
                      <Text style={styles.avatarInitial}>
                        {initial.toUpperCase()}
                      </Text>
                    </View>
                  );
                })}

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
          
          {/* Informação da tarefa pai, se existir */}
          {item.parentTaskId && (
            <View style={styles.parentTaskInfo}>
              <Ionicons name="git-branch" size={12} color={colors.text.tertiary} />
              <Text style={styles.parentTaskText}>
                Gerada por recorrência
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Função de comparação personalizada para o memo
  // Retorna true se as props não mudaram (não precisa re-renderizar)
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.title === nextProps.item.title &&
    prevProps.item.description === nextProps.item.description &&
    prevProps.item.status === nextProps.item.status &&
    prevProps.item.due_date === nextProps.item.due_date &&
    prevProps.item.category === nextProps.item.category &&
    prevProps.item.recurring === nextProps.item.recurring &&
    prevProps.item.recurrenceType === nextProps.item.recurrenceType &&
    prevProps.item.recurrenceInterval === nextProps.item.recurrenceInterval &&
    prevProps.item.parentTaskId === nextProps.item.parentTaskId &&
    JSON.stringify(prevProps.item.assignedUsers) === JSON.stringify(nextProps.item.assignedUsers) &&
    prevProps.currentUserId === nextProps.currentUserId &&
    JSON.stringify(prevProps.pendingTaskIds) === JSON.stringify(nextProps.pendingTaskIds)
  );
});

const styles = StyleSheet.create({
  taskItem: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderLeftWidth: 5,
    overflow: 'hidden',
    ...createShadow(2)
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
    color: colors.text.primary,
    marginRight: 8,
  },
  taskDescription: {
    fontSize: 14,
    color: colors.text.secondary,
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
    backgroundColor: `${colors.primary.main}15`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  categoryText: {
    color: colors.primary.main,
    fontSize: 12,
    marginLeft: 4,
  },
  recurrenceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success.main}15`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  recurrenceText: {
    color: colors.success.main,
    fontSize: 12,
    marginLeft: 4,
  },
  stopRecurrenceButton: {
    marginLeft: 4,
    padding: 2,
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
    color: colors.text.tertiary,
  },
  cancelledTaskText: {
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  pendingTaskItem: {
    opacity: 0.8,
  },
  myTaskItem: {
    borderLeftWidth: 5,
    borderLeftColor: colors.primary.main,
  },
  recurringTaskItem: {
    borderRightWidth: 3,
    borderRightColor: colors.success.main,
  },
  recurringIndicator: {
    color: colors.success.main,
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
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background.secondary,
  },
  avatarInitial: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  currentUserAvatar: {
    borderColor: colors.primary.main,
    backgroundColor: colors.background.secondary,
  },
  moreAssigneesAvatar: {
    backgroundColor: colors.primary.light,
  },
  moreAssigneesText: {
    color: colors.primary.main,
    fontSize: 10,
    fontWeight: 'bold',
  },
  parentTaskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  parentTaskText: {
    color: colors.text.tertiary,
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 4,
  },
});

export default TaskItem;