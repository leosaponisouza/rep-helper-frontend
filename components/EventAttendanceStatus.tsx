// components/EventAttendanceStatus.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InvitationStatus } from '../src/hooks/useEvents';

interface EventAttendanceStatusProps {
  userStatus: InvitationStatus;
  isFinished: boolean;
  onChangeStatus: (status: 'CONFIRMED' | 'DECLINED') => Promise<void>;
}

const EventAttendanceStatus: React.FC<EventAttendanceStatusProps> = ({
  userStatus,
  isFinished,
  onChangeStatus
}) => {
  const [processing, setProcessing] = useState<boolean>(false);

  // Don't show if there's no valid status to display
  if (!userStatus || (userStatus !== 'CONFIRMED' && userStatus !== 'DECLINED')) {
    return null;
  }

  const handleChangeStatus = async (status: 'CONFIRMED' | 'DECLINED') => {
    if (processing || isFinished) return;

    try {
      setProcessing(true);
      await onChangeStatus(status);
    } finally {
      setProcessing(false);
    }
  };

  // For confirmed status
  if (userStatus === 'CONFIRMED') {
    return (
      <View style={styles.container}>
        <View style={styles.statusHeader}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          <Text style={styles.statusText}>You've confirmed attendance</Text>
        </View>
        
        {!isFinished && (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton, processing && styles.disabledButton]}
            onPress={() => handleChangeStatus('DECLINED')}
            disabled={processing || isFinished}
          >
            {processing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Cancel Attendance</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // For declined status
  return (
    <View style={[styles.container, styles.declinedContainer]}>
      <View style={styles.statusHeader}>
        <Ionicons name="close-circle" size={24} color="#FF6347" />
        <Text style={[styles.statusText, styles.declinedText]}>You've declined this invitation</Text>
      </View>
      
      {!isFinished && (
        <TouchableOpacity
          style={[styles.actionButton, styles.joinButton, processing && styles.disabledButton]}
          onPress={() => handleChangeStatus('CONFIRMED')}
          disabled={processing || isFinished}
        >
          {processing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.actionButtonText}>Attend Event</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  declinedContainer: {
    backgroundColor: 'rgba(255, 99, 71, 0.1)',
    borderColor: 'rgba(255, 99, 71, 0.3)',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  declinedText: {
    color: '#FF6347',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF6347',
  },
  joinButton: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default EventAttendanceStatus;