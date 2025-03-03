// components/EventInvitationCard.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event, InvitationStatus } from '../src/hooks/useEvents';

interface EventInvitationCardProps {
  event: Event;
  userStatus: InvitationStatus | null;
  isFinished: boolean;
  onRespond: (status: 'CONFIRMED' | 'DECLINED') => Promise<void>;
}

const EventInvitationCard: React.FC<EventInvitationCardProps> = ({
  event,
  userStatus,
  isFinished,
  onRespond
}) => {
  const [responding, setResponding] = useState<boolean>(false);

  // Don't show if the event is finished or user isn't invited
  if (isFinished || userStatus !== 'INVITED') {
    return null;
  }

  const handleResponse = async (status: 'CONFIRMED' | 'DECLINED') => {
    if (responding) return;

    try {
      setResponding(true);
      await onRespond(status);
    } finally {
      setResponding(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="mail" size={20} color="#FFC107" />
        <Text style={styles.headerText}>You're invited to this event</Text>
      </View>

      <Text style={styles.instructionText}>
        Please respond to this invitation:
      </Text>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.declineButton, responding && styles.disabledButton]}
          onPress={() => handleResponse('DECLINED')}
          disabled={responding}
        >
          {responding ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="close-circle" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Decline</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.acceptButton, responding && styles.disabledButton]}
          onPress={() => handleResponse('CONFIRMED')}
          disabled={responding}
        >
          {responding ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Accept</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    color: '#FFC107',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  instructionText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.48,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  declineButton: {
    backgroundColor: '#FF6347',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default EventInvitationCard;