// components/EventParticipantsList.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image,
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event } from '../src/hooks/useEvents';

interface EventParticipantsListProps {
  event: Event;
  currentUserId?: string;
  onInvite?: () => void;
  isCreator: boolean;
  isFinished: boolean;
}

const EventParticipantsList: React.FC<EventParticipantsListProps> = ({
  event,
  currentUserId,
  onInvite,
  isCreator,
  isFinished
}) => {
  // Agrupamentos de participantes por status
  const confirmedParticipants = event.invitations?.filter(inv => inv.status === 'CONFIRMED') || [];
  const pendingParticipants = event.invitations?.filter(inv => inv.status === 'INVITED') || [];
  const declinedParticipants = event.invitations?.filter(inv => inv.status === 'DECLINED') || [];

  // Estatísticas
  const confirmedCount = confirmedParticipants.length;
  const pendingCount = pendingParticipants.length;
  const declinedCount = declinedParticipants.length;
  const totalCount = event.invitations?.length || 0;

  // Renderizador para cada tipo de status
  const renderParticipant = (invitation: any, statusInfo: { color: string, label: string }) => {
    const isCurrentUser = invitation.userId === currentUserId;

    return (
      <View key={invitation.userId} style={styles.participantItem}>
        {invitation.profilePictureUrl ? (
          <Image 
            source={{ uri: invitation.profilePictureUrl }} 
            style={styles.participantAvatar}
          />
        ) : (
          <View style={styles.participantAvatarPlaceholder}>
            <Text style={styles.participantInitials}>
              {invitation.userName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        <View style={styles.participantInfo}>
          <Text style={styles.participantName}>
            {invitation.userName}
            {isCurrentUser && ' (Você)'}
          </Text>
          <Text style={styles.participantEmail}>{invitation.userEmail}</Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}20` }]}>
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Participantes</Text>
          <Text style={styles.subtitle}>
            {totalCount} {totalCount === 1 ? 'convidado' : 'convidados'} no total
          </Text>
        </View>
        {isCreator && !isFinished && onInvite && (
          <TouchableOpacity onPress={onInvite} style={styles.inviteButton}>
            <Ionicons name="person-add" size={16} color="#7B68EE" />
            <Text style={styles.inviteButtonText}>Convidar</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.statsContainer}>
        <View style={[styles.statItem, { backgroundColor: '#4CAF5020' }]}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{confirmedCount}</Text>
          <Text style={[styles.statLabel, { color: '#4CAF50' }]}>Confirmados</Text>
        </View>
        
        <View style={[styles.statItem, { backgroundColor: '#FFC10720' }]}>
          <Ionicons name="help-circle" size={20} color="#FFC107" />
          <Text style={[styles.statNumber, { color: '#FFC107' }]}>{pendingCount}</Text>
          <Text style={[styles.statLabel, { color: '#FFC107' }]}>Pendentes</Text>
        </View>
        
        <View style={[styles.statItem, { backgroundColor: '#F4433620' }]}>
          <Ionicons name="close-circle" size={20} color="#F44336" />
          <Text style={[styles.statNumber, { color: '#F44336' }]}>{declinedCount}</Text>
          <Text style={[styles.statLabel, { color: '#F44336' }]}>Recusados</Text>
        </View>
      </View>
      
      <View style={styles.divider} />
      
      {event.invitations && event.invitations.length > 0 ? (
        <View style={styles.participantsList}>
          {/* Confirmados */}
          {confirmedParticipants.length > 0 && (
            <View style={styles.statusSection}>
              <Text style={[styles.statusSectionTitle, { color: '#4CAF50' }]}>
                Confirmados ({confirmedCount})
              </Text>
              {confirmedParticipants.map(invitation => 
                renderParticipant(invitation, { color: '#4CAF50', label: 'Confirmado' })
              )}
            </View>
          )}
          
          {/* Pendentes */}
          {pendingParticipants.length > 0 && (
            <View style={styles.statusSection}>
              <Text style={[styles.statusSectionTitle, { color: '#FFC107' }]}>
                Pendentes ({pendingCount})
              </Text>
              {pendingParticipants.map(invitation => 
                renderParticipant(invitation, { color: '#FFC107', label: 'Pendente' })
              )}
            </View>
          )}
          
          {/* Recusados */}
          {declinedParticipants.length > 0 && (
            <View style={styles.statusSection}>
              <Text style={[styles.statusSectionTitle, { color: '#F44336' }]}>
                Recusados ({declinedCount})
              </Text>
              {declinedParticipants.map(invitation => 
                renderParticipant(invitation, { color: '#F44336', label: 'Recusado' })
              )}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="people" size={50} color="#7B68EE" style={{ opacity: 0.5 }} />
          <Text style={styles.emptyText}>
            Nenhum participante convidado ainda
          </Text>
          {isCreator && !isFinished && onInvite && (
            <TouchableOpacity 
              style={styles.invitePrimaryButton} 
              onPress={onInvite}
            >
              <Ionicons name="person-add" size={18} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.invitePrimaryText}>Convidar Participantes</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7B68EE20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  inviteButtonText: {
    color: '#7B68EE',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  participantsList: {
    marginTop: 8,
  },
  statusSection: {
    marginBottom: 16,
  },
  statusSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 8,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  participantAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7B68EE20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantInitials: {
    color: '#7B68EE',
    fontSize: 16,
    fontWeight: 'bold',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  participantEmail: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  invitePrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7B68EE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  invitePrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default EventParticipantsList;