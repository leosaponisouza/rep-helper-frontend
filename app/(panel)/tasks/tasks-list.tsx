// app/(panel)/tasks/tasks-list.tsx
import React, { useState } from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import TaskFilter, { FilterOption } from '../../../components/TaskFilter';
import { useTasks } from '../../../src/hooks/useTasks';
import { Task } from '../../../src/models/task.model';
import { useAuth } from '../../../src/context/AuthContext';

const TasksListScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>('all');

  const taskFilters: FilterOption[] = [
    { key: 'all', label: 'Todas' },
    { key: 'pending', label: 'Pendentes' },
    { key: 'completed', label: 'Concluídas' }
  ];

  const {
    tasks,
    loading,
    refreshTasks,
    loadMoreTasks,
    updateTask,
    deleteTask
  } = useTasks({ 
    status: filter === 'all' ? undefined : filter as 'pending' | 'completed' 
  });

  const toggleTaskStatus = async (task: Task) => {
    try {
      const newStatus = task.status === 'pending' ? 'completed' : 'pending';
      await updateTask(task.id!, { status: newStatus });
    } catch (error) {
      // O erro já é tratado no hook
    }
  };

  const confirmDeleteTask = (task: Task) => {
    Alert.alert(
      'Excluir Tarefa',
      `Tem certeza que deseja excluir a tarefa "${task.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive', 
          onPress: () => deleteTask(task.id!) 
        }
      ]
    );
  };

  const renderTaskItem = ({ item }: { item: Task }) => {
    const isAssignedToCurrentUser = 
      item.assigned_users?.includes(user?.uid || '');
    
    return (
      <TouchableOpacity
        style={[
          styles.taskItem, 
          item.status === 'completed' && styles.completedTask
        ]}
        onPress={() => router.push(`/tasks/${item.id}`)}
      >
        <View style={styles.taskContent}>
          <TouchableOpacity 
            onPress={() => toggleTaskStatus(item)}
            style={styles.checkboxContainer}
          >
            <Ionicons 
              name={
                item.status === 'completed' 
                  ? 'checkbox' 
                  : 'checkbox-outline'
              } 
              size={24} 
              color={
                item.status === 'completed' 
                  ? '#7B68EE' 
                  : '#aaa'
              } 
            />
          </TouchableOpacity>
          
          <View style={styles.taskTextContainer}>
            <Text 
              style={[
                styles.taskTitle, 
                item.status === 'completed' && styles.completedTaskText
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {item.due_date && (
              <Text style={styles.taskDueDate}>
                {new Date(item.due_date).toLocaleDateString()}
              </Text>
            )}
          </View>
          
          {isAssignedToCurrentUser && (
            <View style={styles.taskActions}>
              <TouchableOpacity 
                onPress={() => confirmDeleteTask(item)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash" size={20} color="#FF6347" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Tarefas</Text>
        <TaskFilter 
          filters={taskFilters}
          activeFilter={filter}
          onFilterChange={setFilter}
        />
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id?.toString() || ''}
        renderItem={renderTaskItem}
        ListEmptyComponent={() => (
          <View style={styles.emptyStateContainer}>
            <MaterialCommunityIcons 
              name="checkbox-marked-outline" 
              size={64} 
              color="#7B68EE" 
            />
            <Text style={styles.emptyStateText}>
              Nenhuma tarefa encontrada
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Crie sua primeira tarefa clicando no botão "+"
            </Text>
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshTasks}
            colors={['#7B68EE']}
            tintColor={'#7B68EE'}
          />
        }
        onEndReached={loadMoreTasks}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContainer}
      />

      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => router.push('/(panel)/tasks/create')}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
    // Mantém os mesmos estilos do exemplo anterior
    safeArea: {
      flex: 1,
      backgroundColor: '#222',
    },
    headerContainer: {
      backgroundColor: '#333',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#444',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 15,
    },
    listContainer: {
      flexGrow: 1,
      backgroundColor: '#222',
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    taskItem: {
      backgroundColor: '#333',
      borderRadius: 10,
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    completedTask: {
      opacity: 0.6,
    },
    taskContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
    },
    checkboxContainer: {
      marginRight: 15,
    },
    taskTextContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    taskTitle: {
      fontSize: 16,
      color: '#fff',
      marginBottom: 5,
    },
    completedTaskText: {
      textDecorationLine: 'line-through',
      color: '#aaa',
    },
    taskDueDate: {
      fontSize: 12,
      color: '#7B68EE',
    },
    taskActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    deleteButton: {
      padding: 5,
    },
    addButton: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#7B68EE',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#7B68EE',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 100,
    },
    emptyStateText: {
      fontSize: 18,
      color: '#fff',
      marginTop: 20,
      textAlign: 'center',
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: '#aaa',
      marginTop: 10,
      textAlign: 'center',
    },
  });
  
export default TasksListScreen;
