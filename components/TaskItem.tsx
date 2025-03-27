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

interface TaskItemProps {
  item: Task;
  onToggleStatus: (task: Task) => Promise<void>;
  currentUserId?: string;
  pendingTaskIds: number[];
  onPress: (taskId: number) => void;
  onStopRecurrence?: (taskId: number) => void;
  variant?: 'compact' | 'detailed';
}

const TaskItem = memo(({ 
  item, 
  onPress, 
  onToggleStatus, 
  currentUserId, 
  pendingTaskIds,
  onStopRecurrence,
  variant = 'detailed'
}: TaskItemProps) => {
  const isPending = pendingTaskIds.includes(item.id);
  const isAssigned = item.assignedUsers?.some(u => u.uid === currentUserId);
  const dueDate = item.dueDate ? format(parseISO(item.dueDate), "d 'de' MMMM", { locale: ptBR }) : null;
  
  // Obter o usuário atribuído atual, caso exista
  const assignedUser = item.assignedUsers?.find(u => u.uid === currentUserId) || 
                      (item.assignedUsers?.length ? item.assignedUsers[0] : null);
      
  // Pegar a imagem de perfil do usuário atribuído
  const userProfilePic = assignedUser?.profilePictureUrl || null;
  const userName = isAssigned 
    ? 'Você' 
    : assignedUser?.name || 'Usuário';
  
  // Obter informações de status para exibição
  const getStatusInfo = () => {
    switch (item.status) {
      case 'COMPLETED': 
        return { 
          color: '#4CAF50', 
          text: 'Concluída',
          icon: 'check-circle'
        };
      case 'IN_PROGRESS': 
        return { 
          color: '#2196F3', 
          text: 'Em Andamento',
          icon: 'clock-outline'
        };
      case 'OVERDUE': 
        return { 
          color: '#F44336', 
          text: 'Atrasada',
          icon: 'alert-circle'
        };
      case 'CANCELLED': 
        return { 
          color: '#9E9E9E', 
          text: 'Cancelada',
          icon: 'cancel'
        };
      default: 
        return { 
          color: '#FFA500', 
          text: 'Pendente',
          icon: 'clock-outline'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        item.status === 'COMPLETED' && styles.completedContainer
      ]}
      onPress={() => onPress(item.id)}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['#2A2A2A', '#333']}
        style={styles.gradient}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={[
              styles.title, 
              item.status === 'COMPLETED' && styles.completedText
            ]} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={[
              styles.categoryBadge,
              { backgroundColor: `${statusInfo.color}20` }
            ]}>
              <MaterialCommunityIcons 
                name="tag-outline" 
                size={12} 
                color={statusInfo.color} 
              />
              <Text style={[styles.categoryText, { color: statusInfo.color }]}>
                {item.category || 'Sem categoria'}
              </Text>
            </View>
          </View>
          
          <View style={styles.statusContainer}>
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
            {item.recurring && (
              <View style={styles.recurringBadge}>
                <MaterialCommunityIcons name="repeat" size={12} color="#9C27B0" />
                <Text style={styles.recurringText}>Recorrente</Text>
              </View>
            )}
          </View>
        </View>
        
        {item.description && (
          <Text style={[
            styles.notes, 
            item.status === 'COMPLETED' && styles.completedText
          ]} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.footer}>
          <View style={styles.infoContainer}>
            {dueDate && (
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="calendar" size={16} color="#aaa" />
                <Text style={styles.infoText}>{dueDate}</Text>
              </View>
            )}
          </View>

          <View style={styles.userContainer}>
            {assignedUser && (
              <View style={styles.creatorContainer}>
                {userProfilePic ? (
                  <Image 
                    source={{ uri: userProfilePic }} 
                    style={styles.creatorAvatar}
                  />
                ) : (
                  <View style={styles.creatorAvatarPlaceholder}>
                    <Text style={styles.creatorInitials}>
                      {userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={styles.creatorName} numberOfLines={1}>
                  {userName}
                </Text>
              </View>
            )}
            {item.recurring && onStopRecurrence && (
              <TouchableOpacity
                style={styles.stopRecurrenceButton}
                onPress={() => onStopRecurrence(item.id)}
              >
                <MaterialCommunityIcons name="stop-circle" size={20} color="#F44336" />
              </TouchableOpacity>
            )}
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(156, 39, 176, 0.2)',
    marginTop: 4,
  },
  recurringText: {
    fontSize: 12,
    color: '#9C27B0',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  notes: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 16,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  infoContainer: {
    flex: 1,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#aaa',
    marginLeft: 8,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  creatorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  creatorAvatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  creatorInitials: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  creatorName: {
    fontSize: 12,
    color: '#ddd',
  },
  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(123, 104, 238, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  assignedText: {
    fontSize: 12,
    color: '#7B68EE',
    marginLeft: 4,
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
});

export default memo(TaskItem); 