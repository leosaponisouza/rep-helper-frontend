// components/RecurrenceInfo.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, RecurrenceType } from '../src/models/task.model';
import { colors } from '../src/styles/sharedStyles';
import { formatLocalDate } from '../src/utils/dateUtils';

interface RecurrenceInfoProps {
  task: Task;
  showDetailed?: boolean;
  showStopButton?: boolean;
  showParentLink?: boolean;
  onStopRecurrence?: (taskId: number) => void;
  onNavigateToParent?: (taskId: number) => void;
}

/**
 * Componente para exibir informações de recorrência de uma tarefa
 * Pode ser utilizado na tela de detalhes da tarefa, ou em outros locais
 */
export const RecurrenceInfo: React.FC<RecurrenceInfoProps> = ({
  task,
  showDetailed = false,
  showStopButton = false,
  showParentLink = false,
  onStopRecurrence,
  onNavigateToParent
}) => {
  // Se a tarefa não for recorrente, não renderiza nada
  if (!task.is_recurring && !task.parent_task_id) return null;
  
  // Formatar o tipo de recorrência para texto amigável
  const recurrenceTypeText = useMemo(() => {
    switch (task.recurrence_type) {
      case 'DAILY': return 'Diária';
      case 'WEEKLY': return 'Semanal';
      case 'MONTHLY': return 'Mensal';
      case 'YEARLY': return 'Anual';
      default: return 'Recorrente';
    }
  }, [task.recurrence_type]);
  
  // Formatar o padrão completo de recorrência
  const recurrencePattern = useMemo(() => {
    if (!task.is_recurring) return '';
    
    const type = recurrenceTypeText;
    const interval = task.recurrence_interval || 1;
    
    // Se o intervalo for 1, apenas exibe o tipo
    if (interval === 1) {
      return type;
    }
    
    // Caso contrário, mostra o padrão com o intervalo
    let unit = '';
    switch (task.recurrence_type) {
      case 'DAILY': unit = 'dias'; break;
      case 'WEEKLY': unit = 'semanas'; break;
      case 'MONTHLY': unit = 'meses'; break;
      case 'YEARLY': unit = 'anos'; break;
      default: unit = 'períodos';
    }
    
    return `${type} (a cada ${interval} ${unit})`;
  }, [task.is_recurring, task.recurrence_type, task.recurrence_interval, recurrenceTypeText]);
  
  // Handler para interromper recorrência
  const handleStopRecurrence = () => {
    if (onStopRecurrence && task.is_recurring) {
      onStopRecurrence(task.id);
    }
  };
  
  // Handler para navegar para a tarefa pai
  const handleNavigateToParent = () => {
    if (onNavigateToParent && task.parent_task_id) {
      onNavigateToParent(task.parent_task_id);
    }
  };
  
  // Componente compacto para uso em listas
  if (!showDetailed) {
    return (
      <View style={styles.compactContainer}>
        <Ionicons name="repeat" size={12} color={colors.success.main} />
        <Text style={styles.compactText}>{recurrencePattern}</Text>
        
        {showStopButton && task.is_recurring && onStopRecurrence && (
          <TouchableOpacity 
            style={styles.stopButton}
            onPress={handleStopRecurrence}
          >
            <Ionicons name="close-circle" size={14} color={colors.error.main} />
          </TouchableOpacity>
        )}
      </View>
    );
  }
  
  // Componente detalhado para a tela de detalhes
  return (
    <View style={styles.container}>
      {/* Banner superior */}
      <View style={styles.banner}>
        <Ionicons name="repeat" size={20} color={colors.success.main} />
        <Text style={styles.bannerText}>
          {task.is_recurring ? 'Tarefa Recorrente' : 'Gerada por Recorrência'}
        </Text>
      </View>
      
      {/* Detalhes da recorrência */}
      <View style={styles.content}>
        {/* Para tarefas recorrentes, mostrar configuração */}
        {task.is_recurring && (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Tipo:</Text>
              <Text style={styles.value}>{recurrencePattern}</Text>
            </View>
            
            {task.recurrence_end_date && (
              <View style={styles.row}>
                <Text style={styles.label}>Término:</Text>
                <Text style={styles.value}>
                  {formatLocalDate(task.recurrence_end_date, "dd 'de' MMMM 'de' yyyy")}
                </Text>
              </View>
            )}
          </>
        )}
        
        {/* Para tarefas geradas por recorrência, mostrar info da tarefa pai */}
        {task.parent_task_id && showParentLink && (
          <View style={styles.row}>
            <Text style={styles.label}>Origem:</Text>
            <TouchableOpacity 
              style={styles.parentLink}
              onPress={handleNavigateToParent}
            >
              <Text style={styles.parentLinkText}>
                Ver tarefa original
              </Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primary.main} />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Explicação sobre recorrência */}
        <View style={styles.infoRow}>
          <Ionicons name="information-circle" size={16} color={colors.text.secondary} />
          <Text style={styles.infoText}>
            {task.is_recurring
              ? 'Quando concluída, uma nova instância será criada automaticamente.'
              : 'Esta tarefa foi gerada automaticamente por uma recorrência.'}
          </Text>
        </View>
      </View>
      
      {/* Botão para interromper recorrência */}
      {showStopButton && task.is_recurring && onStopRecurrence && (
        <TouchableOpacity 
          style={styles.stopRecurrenceButton}
          onPress={handleStopRecurrence}
        >
          <Ionicons name="stop-circle" size={18} color={colors.error.main} />
          <Text style={styles.stopRecurrenceText}>
            Interromper Recorrência
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Estilos para o componente compacto
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success.main}15`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  compactText: {
    color: colors.success.main,
    fontSize: 12,
    marginLeft: 4,
  },
  stopButton: {
    marginLeft: 4,
    padding: 2,
  },
  
  // Estilos para o componente detalhado
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.success.main,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success.main}15`,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  bannerText: {
    color: colors.success.main,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  content: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    color: colors.text.secondary,
    fontSize: 14,
    width: 70,
  },
  value: {
    color: colors.text.primary,
    fontSize: 14,
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    backgroundColor: colors.background.tertiary,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    color: colors.text.secondary,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  parentLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  parentLinkText: {
    color: colors.primary.main,
    fontSize: 14,
    marginRight: 4,
  },
  stopRecurrenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.error.main}15`,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.background.tertiary,
  },
  stopRecurrenceText: {
    color: colors.error.main,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default RecurrenceInfo;