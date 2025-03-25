// components/EventParticipantsList.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image,
  FlatList, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event, InvitationStatus } from '../src/hooks/useEvents';

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
        <Text style={styles.title}>Participantes</Text>
        {isCreator && !isFinished && onInvite && (
          <TouchableOpacity onPress={onInvite} style={styles.inviteButton}>
            <Ionicons name="person-add" size={16} color="#7B68EE" />
            <Text style={styles.inviteButtonText}>Convidar</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{confirmedCount}</Text>
          <Text style={styles.statLabel}>Confirmados</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pendentes</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{declinedCount}</Text>
          <Text style={styles.statLabel}>Recusados</Text>
        </View>
      </View>
      
      <View style={styles.divider} />
      
      {totalCount > 0 ? (
        <>
          {/* Participantes confirmados */}
          {confirmedParticipants.length > 0 && (
            <View style={styles.participantsSection}>
              <Text style={styles.sectionLabel}>Confirmados</Text>
              {confirmedParticipants.map(participant => 
                renderParticipant(participant, { color: '#4CAF50', label: 'Confirmado' })
              )}
            </View>
          )}
          
          {/* Participantes pendentes */}
          {pendingParticipants.length > 0 && (
            <View style={styles.participantsSection}>
              <Text style={styles.sectionLabel}>Pendentes</Text>
              {pendingParticipants.map(participant => 
                renderParticipant(participant, { color: '#FFC107', label: 'Pendente' })
              )}
            </View>
          )}
          
          {/* Participantes que recusaram */}
          {declinedParticipants.length > 0 && (
            <View style={styles.participantsSection}>
              <Text style={styles.sectionLabel}>Recusaram</Text>
              {declinedParticipants.map(participant => 
                renderParticipant(participant, { color: '#FF6347', label: 'Recusou' })
              )}
            </View>
          )}
        </>
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
    backgroundColor: '#333',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7B68EE',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  inviteButtonText: {
    color: '#7B68EE',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7B68EE',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#aaa',
  },
  divider: {
    height: 1,
    backgroundColor: '#444',
    marginHorizontal: 16,
  },
  participantsSection: {
    padding: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
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
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    marginBottom: 2,
  },
  participantEmail: {
    fontSize: 12,
    color: '#aaa',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#aaa',
    marginVertical: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  invitePrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7B68EE',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  invitePrimaryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  buttonIcon: {
    marginRight: 8,
  }
});

export default EventParticipantsList;