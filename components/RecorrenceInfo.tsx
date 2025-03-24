// components/RecurrenceInfo.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecurrenceType } from '../src/models/task.model';
import { formatDateWithTime } from '../src/utils/dateUtils';

interface RecurrenceInfoProps {
  isRecurring: boolean;
  recurrenceType?: RecurrenceType;
  recurrenceInterval?: number;
  recurrenceEndDate?: string;
  parentTaskId?: number;
  onNavigateToParent?: (parentTaskId: number) => void;
  onStopRecurrence?: () => void;
  isStoppingRecurrence?: boolean;
  canModifyTask?: boolean;
}

const RecurrenceInfo: React.FC<RecurrenceInfoProps> = ({
  isRecurring,
  recurrenceType,
  recurrenceInterval = 1,
  recurrenceEndDate,
  parentTaskId,
  onNavigateToParent,
  onStopRecurrence,
  isStoppingRecurrence = false,
  canModifyTask = false,
}) => {
  if (!isRecurring && !parentTaskId) return null;

  const getRecurrenceTypeLabel = (type?: RecurrenceType): string => {
    if (!type) return 'Desconhecido';
    
    switch (type) {
      case 'DAILY': return 'Diária';
      case 'WEEKLY': return 'Semanal';
      case 'MONTHLY': return 'Mensal';
      case 'YEARLY': return 'Anual';
      default: return 'Desconhecido';
    }
  };

  const getIntervalText = (type?: RecurrenceType, interval: number = 1): string => {
    if (!type || interval <= 1) return '';
    
    const unit = type === 'DAILY' ? 'dias' :
                 type === 'WEEKLY' ? 'semanas' :
                 type === 'MONTHLY' ? 'meses' : 'anos';
                 
    return `a cada ${interval} ${unit}`;
  };

  return (
    <View style={styles.recurrenceContainer}>
      <View style={styles.recurrenceBanner}>
        <Ionicons name="repeat" size={20} color="#4CAF50" />
        <Text style={styles.recurrenceBannerText}>
          {isRecurring ? 'Tarefa Recorrente' : 'Gerada por Recorrência'}
        </Text>
      </View>
      
      <View style={styles.recurrenceContent}>
        {/* Para tarefas recorrentes, mostrar configuração */}
        {isRecurring && recurrenceType && (
          <>
            <View style={styles.recurrenceRow}>
              <Text style={styles.recurrenceLabel}>Tipo:</Text>
              <Text style={styles.recurrenceValue}>
                {getRecurrenceTypeLabel(recurrenceType)}
                {recurrenceInterval && recurrenceInterval > 1 ?
                  ` (${getIntervalText(recurrenceType, recurrenceInterval)})` : ''
                }
              </Text>
            </View>
            
            {recurrenceEndDate && (
              <View style={styles.recurrenceRow}>
                <Text style={styles.recurrenceLabel}>Término:</Text>
                <Text style={styles.recurrenceValue}>
                  {formatDateWithTime(recurrenceEndDate)}
                </Text>
              </View>
            )}
          </>
        )}
        
        {/* Para tarefas geradas por recorrência, mostrar info da tarefa pai */}
        {parentTaskId && onNavigateToParent && (
          <View style={styles.recurrenceRow}>
            <Text style={styles.recurrenceLabel}>Origem:</Text>
            <TouchableOpacity 
              style={styles.parentTaskLink}
              onPress={() => onNavigateToParent(parentTaskId)}
            >
              <Text style={styles.parentTaskLinkText}>
                Ver tarefa original
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#7B68EE" />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Explicação sobre recorrência */}
        <View style={styles.recurrenceInfoBox}>
          <Ionicons name="information-circle" size={16} color="#aaa" />
          <Text style={styles.recurrenceInfoText}>
            {isRecurring
              ? 'Quando concluída, uma nova instância será criada automaticamente.'
              : 'Esta tarefa foi gerada automaticamente por uma recorrência.'}
          </Text>
        </View>
      </View>
      
      {/* Botão para interromper recorrência */}
      {canModifyTask && isRecurring && onStopRecurrence && (
        <TouchableOpacity 
          style={styles.stopRecurrenceButton}
          onPress={onStopRecurrence}
          disabled={isStoppingRecurrence}
        >
          {isStoppingRecurrence ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="stop-circle" size={18} color="#FF6347" />
              <Text style={styles.stopRecurrenceText}>
                Interromper Recorrência
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  recurrenceContainer: {
    backgroundColor: '#444',
    borderRadius: 12,
    overflow: 'hidden',
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  recurrenceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  recurrenceBannerText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  recurrenceContent: {
    padding: 16,
  },
  recurrenceRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  recurrenceLabel: {
    color: '#aaa',
    fontSize: 14,
    width: 70,
  },
  recurrenceValue: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  recurrenceInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'flex-start',
  },
  recurrenceInfoText: {
    color: '#ccc',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  parentTaskLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  parentTaskLinkText: {
    color: '#7B68EE',
    fontSize: 14,
    marginRight: 4,
  },
  stopRecurrenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 99, 71, 0.15)',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#555',
  },
  stopRecurrenceText: {
    color: '#FF6347',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default RecurrenceInfo;