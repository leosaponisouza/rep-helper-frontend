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
import { colors, createShadow } from '@/src/styles/sharedStyles';

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
    if (!item) return colors.primary.main;

    // Check if event is finished
    if (item.isFinished) return colors.grey[500];

    // Check if event is happening now
    if (item.isHappening) return colors.success.main;

    // Check invite status for current user
    if (currentUserId && item.invitations && Array.isArray(item.invitations)) {
      const userInvitation = item.invitations.find(inv => inv.userId === currentUserId);

      if (userInvitation) {
        switch (userInvitation.status) {
          case 'CONFIRMED': return colors.primary.main;
          case 'INVITED': return colors.warning.main;
          case 'DECLINED': return colors.error.main;
          default: return colors.primary.main;
        }
      }
    }

    return colors.primary.main;
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

    if (currentUserId && item.invitations && Array.isArray(item.invitations)) {
      const userInvitation = item.invitations.find(inv => inv.userId === currentUserId);

      if (userInvitation) {
        switch (userInvitation.status) {
          case 'CONFIRMED':
            return <View style={styles.confirmedBadge}><Text style={styles.badgeText}>Confirmado</Text></View>;
          case 'DECLINED':
            return <View style={styles.declinedBadge}><Text style={styles.badgeText}>Recusado</Text></View>;
          case 'INVITED':
            return <View style={styles.pendingBadge}><Text style={styles.badgeText}>Pendente</Text></View>;
        }
      }
    }

    return null;
  };

  // Obter convidados confirmados para mostrar avatares
  const getConfirmedParticipants = () => {
    if (!item.invitations || !Array.isArray(item.invitations)) return [];

    return item.invitations
      .filter(inv => inv.status === 'CONFIRMED')
      .map(inv => ({
        userId: inv.userId,
        name: inv.userName || '',
        status: inv.status
      }));
  };

  // Handler para clique no evento
  const handlePress = () => {
    onPress(item.id);
  };

  const confirmedParticipants = getConfirmedParticipants();

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
            <Ionicons name="location-outline" size={14} color={colors.text.tertiary} />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
        )}

        <View style={styles.eventFooter}>
          <View style={styles.attendeesRow}>
            <Ionicons name="people-outline" size={14} color={colors.text.tertiary} />
            <Text style={styles.attendeesText}>
              {confirmedCount} {confirmedCount === 1 ? 'participante' : 'participantes'}
            </Text>
          </View>

          {/* Participantes Confirmados (Avatares) */}
          {confirmedParticipants.length > 0 && (
            <View style={styles.participantsContainer}>
              {confirmedParticipants.slice(0, 3).map((participant, index) => {
                // Verifica se é o usuário atual
                const isCurrentUser = participant.userId === currentUserId;

                // Obtém a inicial para o avatar
                const initial = participant.name ? participant.name.charAt(0) : participant.userId.charAt(0);

                return (
                  <View
                    key={participant.userId || `participant-${index}`}
                    style={[
                      styles.participantAvatar,
                      { zIndex: 10 - index, marginLeft: index > 0 ? -10 : 0 },
                      isCurrentUser && styles.currentUserAvatar
                    ]}
                  >
                    <Text style={styles.avatarInitial}>
                      {initial.toUpperCase()}
                    </Text>
                  </View>
                );
              })}

              {confirmedParticipants.length > 3 && (
                <View style={[styles.participantAvatar, styles.moreParticipantsAvatar]}>
                  <Text style={styles.moreParticipantsText}>
                    +{confirmedParticipants.length - 3}
                  </Text>
                </View>
              )}
            </View>
          )}
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
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderLeftWidth: 5,
    overflow: 'hidden',
    ...createShadow(2)
  },
  eventInfo: {
    flex: 1,
  },
  eventTime: {
    color: colors.primary.main,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    color: colors.text.tertiary,
    fontSize: 14,
    marginLeft: 4,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeesText: {
    color: colors.text.tertiary,
    fontSize: 14,
    marginLeft: 4,
  },
  pendingBadge: {
    backgroundColor: colors.warning.main,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  confirmedBadge: {
    backgroundColor: colors.success.main,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  declinedBadge: {
    backgroundColor: colors.error.main,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  inProgressBadge: {
    backgroundColor: colors.primary.main,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Estilos para avatares dos participantes
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background.secondary,
  },
  avatarInitial: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  currentUserAvatar: {
    borderColor: colors.primary.main,
    backgroundColor: colors.background.secondary,
  },
  moreParticipantsAvatar: {
    backgroundColor: colors.primary.light,
  },
  moreParticipantsText: {
    color: colors.primary.main,
    fontSize: 10,
    fontWeight: 'bold',
  }
});

export default EventItem;