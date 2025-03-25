// src/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Task } from '../models/task.model';
import Constants from 'expo-constants';

// Verificar se estamos no Expo Go ou em um development build
const isExpoGo = Constants.appOwnership === 'expo';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  // Request permission for notifications
  async requestPermissions() {
    // Em Expo Go com SDK 53+, notificações push não funcionam completamente
    if (isExpoGo) {
      console.log('Expo Go: Notificações push não são totalmente suportadas, usando funcionalidade limitada');
    }
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for notification!');
      return false;
    }
    
    return true;
  }

  // Schedule a notification for a task
  async scheduleTaskNotification(task: Task) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    if (!task.due_date) return null;

    const dueDate = new Date(task.due_date);
    const notificationDate = new Date(dueDate);
    notificationDate.setHours(notificationDate.getHours() - 1); // Notify 1 hour before

    // Don't schedule if the notification time is in the past
    if (notificationDate <= new Date()) return null;

    // Create notification content
    const notificationContent = {
      title: 'Lembrete de Tarefa',
      body: `A tarefa "${task.title}" vence em 1 hora.`,
      data: { taskId: task.id },
    };

    // Add extra info for recurring tasks
    if (task.recurring) {
      notificationContent.title = 'Lembrete de Tarefa Recorrente';
      notificationContent.body = `A tarefa recorrente "${task.title}" vence em 1 hora.`;
    }

    // Schedule the notification
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: {
          seconds: Math.floor((notificationDate.getTime() - new Date().getTime()) / 1000),
          channelId: 'default',
        },
      });
      return notificationId;
    } catch (error) {
      console.error('Erro ao agendar notificação:', error);
      return null;
    }
  }

  // Schedule a notification for a recurring task that was just completed
  async scheduleRecurringTaskNotification(task: Task, nextDueDate: string) {
    if (!task.recurring || !nextDueDate) return null;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    const nextDate = new Date(nextDueDate);
    
    // Create notification content
    const notificationContent = {
      title: 'Nova Tarefa Recorrente',
      body: `Uma nova instância da tarefa recorrente "${task.title}" foi criada.`,
      data: { taskId: task.id, isRecurring: true },
    };

    // Schedule the notification for now
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // Send immediately
      });
      return notificationId;
    } catch (error) {
      console.error('Erro ao agendar notificação imediata:', error);
      return null;
    }
  }

  // Cancel a scheduled notification
  async cancelNotification(notificationId: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Erro ao cancelar notificação:', error);
    }
  }

  // Cancel all notifications
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Erro ao cancelar todas as notificações:', error);
    }
  }
}

export default new NotificationService();