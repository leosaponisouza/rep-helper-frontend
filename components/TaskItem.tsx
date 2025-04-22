import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Task } from '../src/models/task.model';
import { useRouter } from 'expo-router';

interface TaskItemProps {
  item: Task;
  onToggleStatus: (task: Task) => Promise<void>;
  currentUserId?: string;
  pendingTaskIds: number[];
  onPress: (taskId: number) => void;
  variant?: 'compact' | 'detailed';
}

interface StatusInfo {
  text: string;
  color: string;
  icon: string;
}

const TaskItem = memo(({ 
  item, 
  onPress, 
  onToggleStatus, 
  currentUserId, 
  pendingTaskIds,
  variant = 'detailed'
}: TaskItemProps) => {
  const router = useRouter();
  const isPending = pendingTaskIds.includes(item.id);
  const isAssigned = item.assignedUsers?.some(u => u.uid === currentUserId);
  const isCreator = item.createdBy?.uid === currentUserId;
  const isCompleted = item.status === 'COMPLETED';
  const canChangeStatus = (isCreator || isAssigned) && !isCompleted;
  const dueDate = item.dueDate ? format(parseISO(item.dueDate), "d 'de' MMMM", { locale: ptBR }) : null;
  
  // Obter o usuário atribuído atual, caso exista
  const assignedUser = item.assignedUsers?.find(u => u.uid === currentUserId) || 
                      (item.assignedUsers?.length ? item.assignedUsers[0] : null);
      
  // Pegar a imagem de perfil do usuário atribuído
  const userProfilePic = assignedUser?.profilePictureUrl || null;
  const userName = isAssigned 
    ? 'Você' 
    : assignedUser?.nickname || assignedUser?.name || 'Usuário';
  
  const getStatusInfo = (): StatusInfo => {
    switch (item.status) {
      case 'PENDING':
        return { text: 'Pendente', color: '#FFB74D', icon: 'clock-outline' };
      case 'IN_PROGRESS':
        return { text: 'Em andamento', color: '#64B5F6', icon: 'play-circle' };
      case 'COMPLETED':
        return { text: 'Concluída', color: '#81C784', icon: 'check-circle' };
      case 'OVERDUE':
        return { text: 'Atrasada', color: '#E57373', icon: 'alert-circle' };
      case 'CANCELLED':
        return { text: 'Cancelada', color: '#B0BEC5', icon: 'close-circle' };
      default:
        return { text: 'Desconhecido', color: '#B0BEC5', icon: 'help-circle' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isCompleted && styles.completedContainer,
        { borderLeftWidth: 4, borderLeftColor: statusInfo.color },
      ]}
      onPress={() => router.push(`/(panel)/tasks/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.mainContent}>
          <View style={styles.leftContent}>
            <TouchableOpacity 
              style={[
                styles.checkbox,
                { borderColor: statusInfo.color },
                isCompleted && [styles.checkboxCompleted, { backgroundColor: statusInfo.color, borderColor: statusInfo.color }],
                !canChangeStatus && !isCompleted && styles.checkboxDisabled,
                !canChangeStatus && isCompleted && styles.checkboxCompletedDisabled
              ]}
              onPress={() => canChangeStatus && onToggleStatus(item)}
              disabled={!canChangeStatus}
            >
              {isCompleted ? (
                <MaterialCommunityIcons name="check" size={16} color="#fff" />
              ) : null}
            </TouchableOpacity>
            <View style={styles.titleSection}>
              <Text style={[
                styles.title, 
                isCompleted && styles.completedText
              ]} numberOfLines={1}>
                {item.title || 'Tarefa sem título'}
              </Text>
              {item.description ? (
                <Text style={[
                  styles.description, 
                  isCompleted && styles.completedText
                ]} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : (
                <Text style={[
                  styles.description,
                  styles.emptyText,
                  isCompleted && styles.completedText
                ]}>
                  Sem descrição
                </Text>
              )}
            </View>
          </View>

          <View style={styles.badgesContainer}>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: `${statusInfo.color}20` }
            ]}>
              <MaterialCommunityIcons 
                name={statusInfo.icon as any} 
                size={12} 
                color={statusInfo.color} 
              />
              <Text style={[
                styles.statusText, 
                { color: statusInfo.color }
              ]}>
                {statusInfo.text}
              </Text>
            </View>

            {item.category && (
              <View style={styles.categoryBadge}>
                <MaterialCommunityIcons 
                  name="tag-outline" 
                  size={12} 
                  color="#ADB5BD" 
                />
                <Text style={styles.categoryText}>
                  {item.category}
                </Text>
              </View>
            )}

            {item.recurring && (
              <View style={styles.recurringBadge}>
                <MaterialCommunityIcons name="repeat" size={12} color="#ADB5BD" />
                <Text style={styles.recurringText}>Recorrente</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          {dueDate ? (
            <View style={styles.footerItem}>
              <MaterialCommunityIcons name="calendar" size={14} color="#ADB5BD" />
              <Text style={styles.footerText}>{dueDate}</Text>
            </View>
          ) : null}

          {assignedUser ? (
            <View style={styles.footerItem}>
              {userProfilePic ? (
                <Image 
                  source={{ uri: userProfilePic }} 
                  style={styles.userAvatar}
                />
              ) : (
                <View style={styles.userAvatarPlaceholder}>
                  <Text style={styles.userInitials}>
                    {userName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.footerText} numberOfLines={1}>
                {userName}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardContent: {
    padding: 16,
  },
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    marginRight: 12,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#CED4DA',
    lineHeight: 18,
  },
  badgesContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 4,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 8,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  footerText: {
    fontSize: 12,
    color: '#ADB5BD',
    marginLeft: 4,
  },
  userAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 4,
  },
  userAvatarPlaceholder: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#495057',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  userInitials: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxCompleted: {
    backgroundColor: '#81C784',
    borderColor: '#81C784',
  },
  checkboxDisabled: {
    opacity: 0.5,
  },
  checkboxCompletedDisabled: {
    opacity: 0.5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  recurringText: {
    fontSize: 12,
    color: '#ADB5BD',
    marginLeft: 4,
    fontWeight: '500',
  },
  categoryText: {
    fontSize: 12,
    color: '#ADB5BD',
    marginLeft: 4,
  },
  emptyText: {
    color: '#6C757D',
    fontStyle: 'italic',
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  completedContainer: {
    opacity: 0.8,
  },
  overdueContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#E57373',
  },
  cancelledContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#B0BEC5',
  },
});

export default memo(TaskItem); 