// src/utils/recurrenceUtils.ts
import { RecurrenceType } from '../models/task.model';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata o padrão de recorrência para exibição ao usuário
 */
export const formatRecurrencePattern = (
  type?: RecurrenceType,
  interval: number = 1
): string => {
  if (!type) return 'Recorrente';
  
  const intervalText = interval > 1 ? `a cada ${interval} ` : '';
  
  switch (type) {
    case 'DAILY':
      return interval === 1 ? 'Diária' : `${intervalText}dias`;
    case 'WEEKLY':
      return interval === 1 ? 'Semanal' : `${intervalText}semanas`;
    case 'MONTHLY':
      return interval === 1 ? 'Mensal' : `${intervalText}meses`;
    case 'YEARLY':
      return interval === 1 ? 'Anual' : `${intervalText}anos`;
    default:
      return 'Recorrente';
  }
};

/**
 * Calcula a próxima data com base no padrão de recorrência
 */
export const calculateNextRecurrenceDate = (
  currentDate: Date,
  type: RecurrenceType,
  interval: number = 1
): Date => {
  const nextDate = new Date(currentDate);
  
  switch (type) {
    case 'DAILY':
      nextDate.setDate(nextDate.getDate() + interval);
      break;
    case 'WEEKLY':
      nextDate.setDate(nextDate.getDate() + (interval * 7));
      break;
    case 'MONTHLY':
      nextDate.setMonth(nextDate.getMonth() + interval);
      break;
    case 'YEARLY':
      nextDate.setFullYear(nextDate.getFullYear() + interval);
      break;
  }
  
  return nextDate;
};

/**
 * Verifica se uma recorrência expirou com base na data de término
 */
export const isRecurrenceExpired = (
  nextDate: Date,
  endDate?: Date | string | null
): boolean => {
  if (!endDate) return false;
  
  const endDateObj = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  return nextDate > endDateObj;
};

/**
 * Gera uma descrição textual do padrão de recorrência
 */
export const getRecurrenceDescription = (
  type?: RecurrenceType,
  interval: number = 1,
  endDate?: Date | string | null
): string => {
  if (!type) return '';
  
  let description = '';
  
  if (interval === 1) {
    description = type === 'DAILY' ? 'A tarefa será recriada todos os dias' :
      type === 'WEEKLY' ? 'A tarefa será recriada toda semana' :
      type === 'MONTHLY' ? 'A tarefa será recriada todo mês' :
      'A tarefa será recriada todo ano';
  } else {
    description = type === 'DAILY' ? `A tarefa será recriada a cada ${interval} dias` :
      type === 'WEEKLY' ? `A tarefa será recriada a cada ${interval} semanas` :
      type === 'MONTHLY' ? `A tarefa será recriada a cada ${interval} meses` :
      `A tarefa será recriada a cada ${interval} anos`;
  }
  
  if (endDate) {
    const endDateObj = typeof endDate === 'string' ? new Date(endDate) : endDate;
    const formattedEndDate = format(endDateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    description += `, até ${formattedEndDate}`;
  }
  
  return description;
};