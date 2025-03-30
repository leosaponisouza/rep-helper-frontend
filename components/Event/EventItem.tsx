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
import React, { memo, useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Event } from '@/src/services/events/eventsTypes';
import { colors, createShadow } from '@/src/styles/sharedStyles';
import { LinearGradient } from 'expo-linear-gradient';

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
  // Animated value para o efeito pulsante
  const pulseAnim = new Animated.Value(1);
  
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

  // Formatar data do evento com verificação de segurança
  const formatEventDate = (dateString?: string): string => {
    if (!dateString || typeof dateString !== 'string') return '';
    try {
      const date = parseISO(dateString);
      return format(date, "EEE, dd 'de' MMM", { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return '';
    }
  };

  // Verificar status do evento com verificação de segurança
  const isFinished = event.isFinished === true;
  const isHappening = event.isHappening === true;
  
  // Contar participantes confirmados com verificação de segurança
  const confirmedCount = Array.isArray(event.invitations) ? 
    event.invitations.filter((inv: any) => inv && inv.status === 'CONFIRMED').length : 0;

  // Efeito para animação pulsante quando o evento estiver acontecendo
  useEffect(() => {
    if (isHappening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true
          })
        ])
      ).start();
    }
  }, [isHappening]);

  // Determinar informações de status do evento
  const getStatusInfo = () => {
    if (isHappening) {
      return {
        color: '#4CAF50',
        text: 'Acontecendo agora',
        icon: 'radio-outline' as const
      };
    }
    if (isFinished) {
      return {
        color: '#9E9E9E',
        text: 'Concluído',
        icon: 'checkmark-circle-outline' as const
      };
    }
    return {
      color: '#FF9800',
      text: 'Agendado',
      icon: 'calendar-outline' as const
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <TouchableOpacity 
      style={styles.container}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <LinearGradient
        colors={['#2A2A2A', '#333']}
        style={styles.gradient}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {event.title || "Evento sem título"}
            </Text>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={14} color="#bbb" />
              <Text style={styles.dateText}>
                {formatEventDate(event.startDate)}
              </Text>
            </View>
          </View>
          
          <View style={styles.statusContainer}>
            {isHappening ? (
              <Animated.View style={[
                styles.statusBadge, 
                styles.liveStatusBadge,
                { 
                  backgroundColor: `${statusInfo.color}20`,
                  transform: [{ scale: pulseAnim }]
                }
              ]}>
                <View style={styles.liveDot} />
                <Ionicons 
                  name={statusInfo.icon} 
                  size={12} 
                  color={statusInfo.color} 
                />
                <Text style={[
                  styles.statusText, 
                  { color: statusInfo.color, fontWeight: 'bold' }
                ]}>
                  {statusInfo.text}
                </Text>
              </Animated.View>
            ) : (
              <View style={[
                styles.statusBadge, 
                { backgroundColor: `${statusInfo.color}20` }
              ]}>
                <Ionicons 
                  name={statusInfo.icon} 
                  size={12} 
                  color={statusInfo.color} 
                />
                <Text style={[
                  styles.statusText, 
                  { color: statusInfo.color }
                ]}>
                  {statusInfo.text}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {event.description && (
          <Text style={styles.description} numberOfLines={1}>
            {event.description}
          </Text>
        )}
        
        <View style={styles.footer}>
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={14} color="#aaa" />
              <Text style={styles.infoText}>
                {formatEventTime(event.startDate)} - {formatEventTime(event.endDate)}
              </Text>
            </View>
            
            {event.location && (
              <View style={styles.infoItem}>
                <Ionicons name="location-outline" size={14} color="#aaa" />
                <Text style={styles.infoText} numberOfLines={1} ellipsizeMode="tail">
                  {event.location}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.participantsContainer}>
            {Array.isArray(event.invitations) && event.invitations.length > 0 && (
              <View style={styles.participantsInfo}>
                <Ionicons name="people-outline" size={14} color="#aaa" />
                <Text style={styles.participantsText}>
                  {confirmedCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  gradient: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  titleContainer: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 3,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
    color: '#bbb',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveStatusBadge: {
    borderWidth: 1,
    borderColor: '#4CAF5080',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 3,
  },
  description: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 8,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  infoContainer: {
    flex: 1,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 11,
    color: '#bbb',
    marginLeft: 4,
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(120, 120, 120, 0.2)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  participantsText: {
    fontSize: 10,
    color: '#aaa',
    marginLeft: 3,
  }
});

export default memo(EventItem);