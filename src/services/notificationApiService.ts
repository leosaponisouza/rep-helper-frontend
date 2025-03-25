import api from './api';

// Interface para o modelo de notificação
export interface ApiNotification {
  id: number;
  recipientId: string;
  title: string;
  message: string;
  type: string;
  entityType?: string;
  entityId?: string;
  read: boolean;
  createdAt: string;
}

// Interface para a solicitação de criação de notificação
export interface CreateNotificationRequest {
  recipientId: string;
  title: string;
  message: string;
  type: string;
  entityType?: string;
  entityId?: string;
}

class NotificationApiService {
  /**
   * Obtém todas as notificações do usuário
   */
  async getNotifications(): Promise<ApiNotification[]> {
    try {
      const response = await api.get('api/v1/notifications');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      return [];
    }
  }

  /**
   * Obtém notificações não lidas do usuário
   */
  async getUnreadNotifications(): Promise<ApiNotification[]> {
    try {
      const response = await api.get('api/v1/notifications/unread');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar notificações não lidas:', error);
      return [];
    }
  }

  /**
   * Obtém a contagem de notificações não lidas
   */
  async countUnreadNotifications(): Promise<number> {
    try {
      const response = await api.get('api/v1/notifications/count');
      return response.data.count;
    } catch (error) {
      console.error('Erro ao contar notificações não lidas:', error);
      return 0;
    }
  }

  /**
   * Obtém uma notificação específica pelo ID
   */
  async getNotificationById(id: number): Promise<ApiNotification | null> {
    try {
      const response = await api.get(`api/v1/notifications/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar notificação ${id}:`, error);
      return null;
    }
  }

  /**
   * Marca uma notificação como lida
   */
  async markAsRead(id: number): Promise<ApiNotification | null> {
    try {
      const response = await api.post(`api/v1/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao marcar notificação ${id} como lida:`, error);
      return null;
    }
  }

  /**
   * Marca todas as notificações do usuário como lidas
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      await api.post('api/v1/notifications/mark-all-read');
      return true;
    } catch (error) {
      console.error('Erro ao marcar todas notificações como lidas:', error);
      return false;
    }
  }

  /**
   * Cria uma nova notificação
   */
  async createNotification(request: CreateNotificationRequest): Promise<ApiNotification | null> {
    try {
      const response = await api.post('api/v1/notifications', request);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      return null;
    }
  }

  /**
   * Exclui uma notificação
   */
  async deleteNotification(id: number): Promise<boolean> {
    try {
      await api.delete(`api/v1/notifications/${id}`);
      return true;
    } catch (error) {
      console.error(`Erro ao excluir notificação ${id}:`, error);
      return false;
    }
  }

  /**
   * Limpa notificações antigas
   */
  async clearOldNotifications(days: number = 30): Promise<boolean> {
    try {
      await api.delete(`api/v1/notifications/clear-old?days=${days}`);
      return true;
    } catch (error) {
      console.error('Erro ao limpar notificações antigas:', error);
      return false;
    }
  }
}

export default new NotificationApiService(); 