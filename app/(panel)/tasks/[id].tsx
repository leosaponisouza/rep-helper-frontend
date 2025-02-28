// app/(panel)/tasks/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../../src/services/api';
import { ErrorHandler } from '../../../src/utils/errorHandling';
import { Task } from '../../../src/models/task.model';
import { useAuth } from '../../../src/context/AuthContext';

const TaskDetailsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Buscar detalhes da tarefa
  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/tasks/${id}`);
        setTask(response.data.data);
      } catch (error) {
        ErrorHandler.handle(error);
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [id]);

  // Verificar se usuário atual pode editar
  const canEditTask = task?.assigned_users?.includes(user?.uid || '');

  const toggleTaskStatus = async () => {
    if (!task) return;

    try {
      const newStatus = task.status === 'pending' ? 'completed' : 'pending';
      await api.patch(`/tasks/${task.id}`, { status: newStatus });
      
      // Atualizar estado local
      setTask(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      ErrorHandler.handle(error);
    }
  };

  const deleteTask = async () => {
    if (!task) return;

    try {
      await api.delete(`/tasks/${task.id}`);
      
      Alert.alert(
        'Tarefa Excluída', 
        'A tarefa foi removida com sucesso.', 
        [{ 
          text: 'OK', 
          onPress: () => router.back() 
        }]
      );
    } catch (error) {
      ErrorHandler.handle(error);
    }
  };

  const confirmDeleteTask = () => {
    Alert.alert(
      'Excluir Tarefa',
      'Tem certeza que deseja excluir esta tarefa?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive', 
          onPress: deleteTask 
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B68EE" />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Tarefa não encontrada</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#7B68EE" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Detalhes da Tarefa
        </Text>
        {canEditTask && (
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={confirmDeleteTask}
              style={styles.deleteButton}
            >
              <Ionicons name="trash" size={20} color="#FF6347" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.taskHeaderContainer}>
          <Text 
            style={[
              styles.taskTitle, 
              task.status === 'completed' && styles.completedTaskTitle
            ]}
          >
            {task.title}
          </Text>
          
          {canEditTask && (
            <TouchableOpacity 
              style={styles.statusToggleButton}
              onPress={toggleTaskStatus}
            >
              <Ionicons 
                name={
                  task.status === 'completed' 
                    ? 'checkbox' 
                    : 'checkbox-outline'
                } 
                size={24} 
                color={
                  task.status === 'completed' 
                    ? '#7B68EE' 
                    : '#aaa'
                } 
              />
              <Text 
                style={[
                  styles.statusToggleText,
                  task.status === 'completed' && styles.completedStatusText
                ]}
              >
                {task.status === 'completed' ? 'Concluída' : 'Marcar como concluída'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {task.description && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Descrição</Text>
            <Text style={styles.descriptionText}>
              {task.description}
            </Text>
          </View>
        )}

        <View style={styles.detailsContainer}>
          {task.due_date && (
            <View style={styles.detailText}>
              <Ionicons name="calendar" size={20} color="#7B68EE" />
              <Text style={styles.detailText}>
                Vencimento: {new Date(task.due_date).toLocaleDateString()}
              </Text>
            </View>
          )}

          {task.category && (
            <View style={styles.detailText}>
              <MaterialCommunityIcons name="tag" size={20} color="#7B68EE" />
              <Text style={styles.detailText}>
                Categoria: {task.category}
              </Text>
            </View>
          )}
        </View>

        {task.assigned_users && task.assigned_users.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Responsáveis</Text>
            {task.assigned_users.map(userId => (
              <View key={userId} style={styles.assignedUserItem}>
                <Ionicons name="person" size={20} color="#7B68EE" />
                <Text style={styles.assignedUserText}>
                  {/* Aqui você pode adicionar a lógica para mostrar o nome do usuário */}
                  {userId === user?.uid ? 'Você' : userId}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#222',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
  },
  deleteButton: {
    marginLeft: 15,
  },
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  taskHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  taskTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 15,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  statusToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusToggleText: {
    marginLeft: 8,
    color: '#7B68EE',
    fontSize: 14,
  },
  completedStatusText: {
    color: '#aaa',
  },
  sectionContainer: {
    marginTop: 20,
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7B68EE',
    marginBottom: 10,
  },
  descriptionText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  detailsContainer: {
    marginTop: 20,
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 15,
  },
  detailText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  assignedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#444',
    borderRadius: 8,
    padding: 10,
  },
  assignedUserText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
});

export default TaskDetailsScreen;