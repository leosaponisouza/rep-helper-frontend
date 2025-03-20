// src/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Task } from '../models/task.model';

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
    if (task.is_recurring) {
      notificationContent.title = 'Lembrete de Tarefa Recorrente';
      notificationContent.body = `A tarefa recorrente "${task.title}" vence em 1 hora.`;
    }

    // Schedule the notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: notificationDate,
    });

    return notificationId;
  }

  // Schedule a notification for a recurring task that was just completed
  async scheduleRecurringTaskNotification(task: Task, nextDueDate: string) {
    if (!task.is_recurring || !nextDueDate) return null;

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
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: null, // Send immediately
    });

    return notificationId;
  }

  // Cancel a scheduled notification
  async cancelNotification(notificationId: string) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  // Cancel all notifications
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

export default new NotificationService();