// components/Home/EventsSection.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Event } from '../../src/hooks/useEvents';
import { useRouter } from 'expo-router';

interface EventsSectionProps {
  events: Event[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onViewAll: () => void;
  onCreateEvent: () => void;
}

// Componente EventItem importado da tela events-list com pequenas adaptações
const EventItem = ({ event }: { event: Event }) => {
  const router = useRouter();
  
  // Determinar a cor do status do evento
  const getStatusColor = (event: Event): string => {
    if (event.isFinished) return '#9E9E9E';
    if (event.isHappening) return '#4CAF50';
    
    // Verificar status do convite para o usuário atual
    const invitation = event.invitations?.find(inv => inv.status === 'INVITED');
    if (invitation) {
      switch (invitation.status) {
        case 'CONFIRMED': return '#7B68EE';
        case 'INVITED': return '#FFC107';
        case 'DECLINED': return '#FF6347';
        default: return '#7B68EE';
      }
    }
    
    return '#7B68EE';
  };

  // Calcular contagem de confirmados com segurança
  let confirmedCount = 0;
  if (event.invitations && Array.isArray(event.invitations)) {
    confirmedCount = event.invitations.filter(inv => inv.status === 'CONFIRMED').length;
  }
    
  return (
    <TouchableOpacity
      style={[
        styles.eventItem,
        { borderLeftColor: getStatusColor(event) }
      ]}
      onPress={() => {
        router.push(`/(panel)/events/${event.id}`);
      }}
    >
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle} numberOfLines={1}>
          {event.title || 'Evento sem título'}
        </Text>
        
        {event.location && (
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color="#aaa" />
            <Text style={styles.locationText} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        )}
        
        <View style={styles.eventMeta}>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={14} color="#7B68EE" />
            <Text style={styles.dateText}>
              {new Date(event.startDate).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
          
          <View style={styles.attendeesInfo}>
            <Ionicons name="people-outline" size={14} color="#7B68EE" />
            <Text style={styles.attendeesText}>
              {confirmedCount} {confirmedCount === 1 ? 'confirmado' : 'confirmados'}
            </Text>
          </View>
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#7B68EE" />
    </TouchableOpacity>
  );
};

const EventsSection: React.FC<EventsSectionProps> = ({
  events,
  loading,
  error,
  onRetry,
  onViewAll,
  onCreateEvent
}) => {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name="calendar" size={20} color="#7B68EE" />
          <Text style={styles.sectionTitle}>Próximos Eventos</Text>
        </View>
        
        <TouchableOpacity 
          onPress={onViewAll}
          style={styles.viewAllButton}
        >
          <Text style={styles.viewAllText}>Ver todos</Text>
          <Ionicons name="chevron-forward" size={16} color="#7B68EE" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#7B68EE" />
          <Text style={styles.loadingText}>Carregando eventos...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#FF6347" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={onRetry}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : events.length > 0 ? (
        <View style={styles.eventsContainer}>
          {events.map(event => (
            <EventItem key={event.id?.toString()} event={event} />
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name="calendar" 
            size={40} 
            color="#7B68EE" 
            style={{ opacity: 0.6 }}
          />
          <Text style={styles.emptyText}>
            Nenhum evento programado
          </Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={onCreateEvent}
          >
            <Text style={styles.createButtonText}>Criar Evento</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#7B68EE',
    fontSize: 14,
    marginRight: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#aaa',
    marginTop: 10,
    fontSize: 14,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF6347',
    marginTop: 10,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 99, 71, 0.15)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#FF6347',
    fontWeight: 'bold',
  },
  eventsContainer: {
    marginBottom: 8,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    marginVertical: 16,
    fontSize: 14,
  },
  createButton: {
    backgroundColor: '#7B68EE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Estilos do EventItem
  eventItem: {
    backgroundColor: '#333',
    borderRadius: 10,
    marginBottom: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  eventContent: {
    flex: 1,
    marginRight: 10,
  },
  eventTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationText: {
    color: '#aaa',
    fontSize: 14,
    marginLeft: 4,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    color: '#ccc',
    fontSize: 12,
    marginLeft: 4,
  },
  attendeesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeesText: {
    color: '#aaa',
    fontSize: 12,
    marginLeft: 4,
  }
});

export default EventsSection;