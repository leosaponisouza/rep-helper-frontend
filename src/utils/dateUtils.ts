// src/utils/dateUtils.ts
import { format, parseISO, formatDistance } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Converte uma data JavaScript para string ISO no formato que o backend Java espera
 * para o tipo LocalDateTime (sem informação de fuso horário).
 * 
 * @param date Data a ser convertida
 * @returns String ISO no formato yyyy-MM-dd'T'HH:mm:ss
 */
export const formatToBackendDateTime = (date: Date): string => {
  // Formato compatível com LocalDateTime do Java (sem fuso horário)
  return format(date, "yyyy-MM-dd'T'HH:mm:ss");
};

/**
 * Parse de uma string ISO para objeto Date mantendo o horário conforme
 * especificado na string (sem conversão automática de fuso)
 * 
 * @param dateString String ISO com data
 * @returns Date object
 */
export const parseISOPreservingTime = (dateString: string): Date => {
  const date = parseISO(dateString);
  return date;
};

/**
 * Formata uma data para exibição amigável com base na localização ptBR
 * 
 * @param date Data a ser formatada
 * @param formatString String de formato
 * @returns String formatada
 */
export const formatLocalDate = (
  date: Date | string,
  formatString: string = "dd 'de' MMMM 'de' yyyy"
): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString, { locale: ptBR });
};

/**
 * Retorna um texto de tempo relativo (ex: "há 5 minutos", "há 2 horas")
 * 
 * @param date Data para calcular o tempo relativo até agora
 * @returns String formatada com o tempo relativo
 */
export const getRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(dateObj, new Date(), { 
    addSuffix: true,
    locale: ptBR 
  });
};

/**
 * Formata um horário para exibição (apenas horas e minutos)
 * 
 * @param date Data contendo o horário a ser formatado
 * @returns String formatada HH:mm
 */
export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, "HH:mm", { locale: ptBR });
};