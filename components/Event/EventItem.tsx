// components/EventItem.tsx
import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Event } from '@/src/services/events/eventsTypes';

interface EventItemProps {
  item: Event;
  onPress: (eventId: number) => void;
  currentUserId?: string;
}

// Componente otimizado com memo para evitar re-renderizações desnecessárias
const EventItem: React.FC<EventItemProps> = memo(({ 
  item, 
  onPress,
  currentUserId
}) => {

  // Calcular contagem de confirmados
  const confirmedCount = item.invitations ? 
    item.invitations.filter(inv => inv.status === 'CONFIRMED').length : 0;
  
  // Verificar status do usuário atual
  const isConfirmed = currentUserId && item.invitations && 
    item.invitations.some(inv => inv.userId === currentUserId && inv.status === 'CONFIRMED');
  
  // Obter cor do status do evento
  const getEventColor = (): string => {
    if (!item) return '#7B68EE';
    
    // Check if event is finished
    if (item.isFinished) return '#9E9E9E';
    
    // Check if event is happening now
    if (item.isHappening) return '#4CAF50';
    
    // Check invite status for current user
    if (currentUserId && item.invitations && Array.isArray(item.invitations)) {
      const userInvitation = item.invitations.find(inv => inv.userId === currentUserId);
      
      if (userInvitation) {
        switch (userInvitation.status) {
          case 'CONFIRMED': return '#7B68EE';
          case 'INVITED': return '#FFC107';
          case 'DECLINED': return '#FF6347';
          default: return '#7B68EE';
        }
      }
    }
    
    return '#7B68EE';
  };

  // Formatar hora do evento
  const formatEventTime = (dateString?: string): string => {
    if (!dateString) return '';
    
    try {
      const date = parseISO(dateString);
      return format(date, "HH:mm", { locale: ptBR });
    } catch (error) {
      return '';
    }
  };

  // Determinar badge de status
  const renderStatusBadge = () => {
    if (item.isHappening) {
      return <View style={styles.inProgressBadge}><Text style={styles.badgeText}>Em Progresso</Text></View>;
    } 
    
    if (isConfirmed) {
      return <View style={styles.confirmedBadge}><Text style={styles.badgeText}>Confirmado</Text></View>;
    }
    
    if (item.startDate) {
      const now = new Date();
      const eventDate = parseISO(item.startDate);
      if (eventDate > now) {
        return <View style={styles.pendingBadge}><Text style={styles.badgeText}>Pendente</Text></View>;
      }
    }
    
    return null;
  };

  // Handler para clique no evento
  const handlePress = () => {
    onPress(item.id);
  };

  return (
    <TouchableOpacity
      style={[
        styles.eventItem,
        { borderLeftColor: getEventColor() }
      ]}
      onPress={handlePress}
    >
      <View style={styles.eventInfo}>
        <Text style={styles.eventTime}>
          {formatEventTime(item.startDate)} - {formatEventTime(item.endDate)}
        </Text>
        <Text style={styles.eventTitle}>
          {item.title || 'Evento sem título'}
        </Text>
        
        {item.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#aaa" />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
        )}
        
        <View style={styles.attendeesRow}>
          <Ionicons name="people-outline" size={14} color="#aaa" />
          <Text style={styles.attendeesText}>
            {confirmedCount} {confirmedCount === 1 ? 'participante' : 'participantes'}
          </Text>
        </View>
      </View>
      
      {renderStatusBadge()}
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Função de comparação personalizada para o memo
  // Retorna true se as props não mudaram (não precisa re-renderizar)
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.title === nextProps.item.title &&
    prevProps.item.startDate === nextProps.item.startDate &&
    prevProps.item.endDate === nextProps.item.endDate &&
    prevProps.item.location === nextProps.item.location &&
    prevProps.item.isHappening === nextProps.item.isHappening &&
    prevProps.item.isFinished === nextProps.item.isFinished &&
    JSON.stringify(prevProps.item.invitations) === JSON.stringify(nextProps.item.invitations) &&
    prevProps.currentUserId === nextProps.currentUserId
  );
});

const styles = StyleSheet.create({
  eventItem: {
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 5,
    overflow: 'hidden',
  },
  eventInfo: {
    flex: 1,
  },
  eventTime: {
    color: '#7B68EE',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    color: '#aaa',
    fontSize: 14,
    marginLeft: 4,
  },
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeesText: {
    color: '#aaa',
    fontSize: 14,
    marginLeft: 4,
  },
  pendingBadge: {
    backgroundColor: '#FF6347',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  confirmedBadge: {
    backgroundColor: '#4CAF50',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  inProgressBadge: {
    backgroundColor: '#7B68EE',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default EventItem;