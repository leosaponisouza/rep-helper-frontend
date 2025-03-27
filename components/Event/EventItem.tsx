// components/EventItem.tsx
/**
 * Componente para exibir um evento na lista
 * 
 * Este componente utiliza as seguintes prioridades para exibição de avatares:
 * 1. Foto de perfil (profilePictureUrl)
 * 2. Inicial do nickname (nickName)
 * 3. Inicial do nome (userName)
 * 4. Inicial do email (userEmail)
 * 5. Inicial do ID (userId)
 */
import React, { memo, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Event } from '@/src/services/events/eventsTypes';
import { colors, createShadow } from '@/src/styles/sharedStyles';

interface EventItemProps {
  event: any;
  onPress: () => void;
  currentUserId: string;
}

/**
 * Extrai o nome de exibição de um usuário a partir do nome completo
 * - Se o nome contiver um apelido entre parênteses, retorna esse apelido
 * - Caso contrário, retorna o primeiro nome
 * 
 * @param fullName Nome completo do usuário
 * @returns Nome de exibição preferido
 */
const extractDisplayName = (fullName: string): string => {
  // Verifica se o nome contém um apelido entre parênteses: "Nome Sobrenome (Apelido)"
  const nicknameMatch = fullName.match(/\(([^)]+)\)/);
  if (nicknameMatch && nicknameMatch[1]) {
    return nicknameMatch[1].trim();
  }
  
  // Se não tiver apelido entre parênteses, retorna o primeiro nome
  return fullName.split(' ')[0] || fullName;
};

/**
 * Verifica se o URL da imagem de perfil é válido
 * - Verifica se não é nulo ou vazio
 * - Verifica se começa com http:// ou https://
 * 
 * @param url URL da imagem de perfil
 * @returns Booleano indicando se o URL é válido
 */
const isValidProfileImageUrl = (url: string | null): boolean => {
  if (!url || typeof url !== 'string' || url.trim() === '') return false;
  
  // Verificação básica para garantir que o URL é válido
  return url.startsWith('http://') || url.startsWith('https://');
};

const EventItem: React.FC<EventItemProps> = ({ event, onPress, currentUserId }) => {
  // Verificar se o evento existe e é um objeto
  if (!event || typeof event !== 'object') {
    return null;
  }

  // Formatar horário do evento com verificação de segurança
  const formatEventTime = (dateString?: string): string => {
    if (!dateString || typeof dateString !== 'string') return '';
    try {
      const parts = dateString.split('T');
      if (parts.length > 1) {
        return parts[1].substring(0, 5);
      }
      return '';
    } catch (error) {
      console.error("Erro ao formatar horário:", error);
      return '';
    }
  };

  // Verificar status do evento com verificação de segurança
  const isFinished = event.isFinished === true;
  const isHappening = event.isHappening === true;
  
  // Contar participantes confirmados com verificação de segurança
  const confirmedCount = Array.isArray(event.invitations) ? 
    event.invitations.filter((inv: any) => inv && inv.status === 'CONFIRMED').length : 0;

  return (
    <TouchableOpacity 
      style={styles.container}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {/* Horário */}
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>
          {formatEventTime(event.startDate)} - {formatEventTime(event.endDate)}
        </Text>
      </View>
      
      {/* Conteúdo */}
      <View style={styles.content}>
        <Text style={styles.title}>
          {event.title || "Evento sem título"}
        </Text>
        
        {/* Local */}
        {event.location && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={14} color="#888" />
            <Text style={styles.detailText}>{event.location}</Text>
          </View>
        )}
        
        {/* Participantes */}
        {Array.isArray(event.invitations) && event.invitations.length > 0 && (
          <View style={styles.detailRow}>
            <Ionicons name="people-outline" size={14} color="#888" />
            <Text style={styles.detailText}>
              {confirmedCount} {confirmedCount === 1 ? 'participante' : 'participantes'}
            </Text>
          </View>
        )}
        
        {/* Status */}
        {isFinished && (
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Concluído</Text>
          </View>
        )}
        
        {isHappening && (
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={[styles.statusText, { color: '#4CAF50' }]}>Acontecendo agora</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  timeContainer: {
    width: 90,
    paddingRight: 16,
  },
  timeText: {
    fontSize: 14,
    color: '#888',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 13,
    color: '#888',
    marginLeft: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#888',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#888',
  }
});

export default EventItem;