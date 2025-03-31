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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
        return { text: 'Pendente', color: '#FFC107', icon: 'clock-outline' };
      case 'IN_PROGRESS':
        return { text: 'Em andamento', color: '#2196F3', icon: 'play-circle' };
      case 'COMPLETED':
        return { text: 'Concluída', color: '#4CAF50', icon: 'check-circle' };
      case 'OVERDUE':
        return { text: 'Atrasada', color: '#F44336', icon: 'alert-circle' };
      case 'CANCELLED':
        return { text: 'Cancelada', color: '#9E9E9E', icon: 'close-circle' };
      default:
        return { text: 'Desconhecido', color: '#9E9E9E', icon: 'help-circle' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isCompleted && styles.completedContainer,
        item.status === 'OVERDUE' && styles.overdueContainer,
        item.status === 'CANCELLED' && styles.cancelledContainer
      ]}
      onPress={() => router.push(`/(panel)/tasks/${item.id}`)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['#2A2A2A', '#333']}
        style={styles.gradient}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
      >
        <View style={styles.mainContent}>
          <View style={styles.leftContent}>
            <TouchableOpacity 
              style={[
                styles.checkbox,
                isCompleted && styles.checkboxCompleted,
                !canChangeStatus && styles.checkboxDisabled
              ]}
              onPress={() => canChangeStatus && onToggleStatus(item)}
              disabled={!canChangeStatus}
            >
              {isCompleted ? (
                <Ionicons name="checkmark" size={20} color="#fff" />
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

          <View style={styles.rightContent}>
            <View style={styles.badgesContainer}>
              <TouchableOpacity 
                style={[
                  styles.statusBadge, 
                  { backgroundColor: `${statusInfo.color}20` },
                  !canChangeStatus && styles.statusBadgeDisabled
                ]}
                onPress={() => canChangeStatus && onToggleStatus(item)}
                disabled={!canChangeStatus}
              >
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
              </TouchableOpacity>

              <View style={[
                styles.categoryBadge,
                { backgroundColor: '#7B68EE20' }
              ]}>
                <MaterialCommunityIcons 
                  name="tag-outline" 
                  size={12} 
                  color="#7B68EE" 
                />
                <Text style={[styles.categoryText, { color: '#7B68EE' }]}>
                  {item.category || 'Sem categoria'}
                </Text>
              </View>

              {item.recurring && (
                <View style={styles.recurringBadge}>
                  <MaterialCommunityIcons name="repeat" size={12} color="#9C27B0" />
                  <Text style={styles.recurringText}>Recorrente</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          {dueDate ? (
            <View style={styles.dateContainer}>
              <MaterialCommunityIcons name="calendar" size={14} color="#aaa" />
              <Text style={styles.dateText}>Prazo: {dueDate}</Text>
            </View>
          ) : (
            <View style={[styles.dateContainer, styles.emptyContainer]}>
              <MaterialCommunityIcons name="calendar-outline" size={14} color="#666" />
              <Text style={[styles.dateText, styles.emptyText]}>Sem prazo</Text>
            </View>
          )}

          {assignedUser ? (
            <View style={styles.userContainer}>
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
              <Text style={styles.userName} numberOfLines={1}>
                {userName}
              </Text>
            </View>
          ) : (
            <View style={[styles.userContainer, styles.emptyContainer]}>
              <MaterialCommunityIcons name="account-outline" size={14} color="#666" />
              <Text style={[styles.userName, styles.emptyText]}>Sem responsável</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  gradient: {
    padding: 20,
    paddingLeft: 16,
    minHeight: 150,
  },
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    marginRight: 12,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#aaa',
    lineHeight: 18,
  },
  badgesContainer: {
    alignItems: 'flex-end',
    marginBottom: 12,
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
    marginBottom: 4,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(156, 39, 176, 0.2)',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#aaa',
    marginLeft: 4,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 6,
  },
  userAvatarPlaceholder: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  userInitials: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 12,
    color: '#ddd',
  },
  stopRecurrenceButton: {
    padding: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  completedContainer: {
    opacity: 0.85,
  },
  statusBadgeDisabled: {
    opacity: 0.7,
  },
  overdueContainer: {
    backgroundColor: '#F44336',
    opacity: 0.85,
  },
  cancelledContainer: {
    backgroundColor: '#9E9E9E',
    opacity: 0.85,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#7B68EE',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  checkboxCompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkboxDisabled: {
    opacity: 0.5,
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  recurringText: {
    fontSize: 12,
    color: '#9C27B0',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  categoryText: {
    fontSize: 12,
    marginLeft: 4,
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
  },
  emptyContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

export default memo(TaskItem); 