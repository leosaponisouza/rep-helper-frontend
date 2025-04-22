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
import React, { memo, useState, useMemo, useEffect, useCallback } from 'react';
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
import { Event, EventInvitation } from '@/src/services/events/eventsTypes';
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

  // Verificar status do usuário atual
  const getUserStatus = useMemo(() => {
    if (!event.invitations || !Array.isArray(event.invitations)) return null;
    
    const userInvitation = event.invitations.find(
      (inv: EventInvitation) => inv.userId === currentUserId
    );
    
    if (!userInvitation) return null;
    
    return userInvitation.status;
  }, [event.invitations, currentUserId]);

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
        color: '#2196F3', // Azul
        text: 'Acontecendo agora',
        icon: 'radio-outline' as const,
        backgroundColor: 'rgba(33, 150, 243, 0.1)'
      };
    }
    if (isFinished) {
      return {
        color: '#4CAF50', // Verde
        text: 'Concluído',
        icon: 'checkmark-circle-outline' as const,
        backgroundColor: 'rgba(76, 175, 80, 0.1)'
      };
    }
    return {
      color: '#FF9800',
      text: 'Agendado',
      icon: 'calendar-outline' as const,
      backgroundColor: 'rgba(255, 152, 0, 0.1)'
    };
  };

  const statusInfo = getStatusInfo();

  // Determinar cor do status ativo
  const getActiveStatusStyle = useCallback((status: string | null) => {
    switch (status) {
      case 'CONFIRMED':
        return {
          backgroundColor: 'rgba(76, 175, 80, 0.15)',
          borderColor: 'rgba(76, 175, 80, 0.3)'
        };
      case 'INVITED':
        return {
          backgroundColor: 'rgba(255, 193, 7, 0.15)',
          borderColor: 'rgba(255, 193, 7, 0.3)'
        };
      case 'DECLINED':
        return {
          backgroundColor: 'rgba(255, 99, 71, 0.15)',
          borderColor: 'rgba(255, 99, 71, 0.3)'
        };
      default:
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent'
        };
    }
  }, []);

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        { borderLeftWidth: 4, borderLeftColor: statusInfo.color }
      ]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.cardContent}>
        <View style={styles.mainContent}>
          <View style={styles.leftContent}>
            <View style={[
              styles.iconContainer,
              { borderColor: statusInfo.color }
            ]}>
              <Ionicons 
                name="calendar-outline" 
                size={16} 
                color={statusInfo.color} 
              />
            </View>
            <View style={styles.titleSection}>
              <Text style={styles.title} numberOfLines={1}>
                {event.title || "Evento sem título"}
              </Text>
              {event.description ? (
                <Text style={styles.description} numberOfLines={1}>
                  {event.description}
                </Text>
              ) : (
                <Text style={[styles.description, styles.emptyText]}>
                  Sem descrição
                </Text>
              )}
            </View>
          </View>
          
          <View style={styles.rightContent}>
            {isHappening ? (
              <Animated.View style={[
                styles.statusBadge, 
                { 
                  backgroundColor: statusInfo.backgroundColor,
                  borderColor: `${statusInfo.color}80`,
                  transform: [{ scale: pulseAnim }]
                }
              ]}>
                <View style={[styles.liveDot, { backgroundColor: statusInfo.color }]} />
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
                { 
                  backgroundColor: statusInfo.backgroundColor,
                  borderColor: `${statusInfo.color}80`
                }
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

        <View style={styles.midContent}>
          {event.location && (
            <View style={styles.locationInfo}>
              <Ionicons name="location-outline" size={14} color="#9C27B0" />
              <Text style={styles.locationInfoText} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Ionicons name="time-outline" size={14} color="#ADB5BD" />
            <Text style={styles.footerText}>
              {formatEventTime(event.startDate)} - {formatEventTime(event.endDate)}
            </Text>
          </View>

          {Array.isArray(event.invitations) && event.invitations.length > 0 && (
            <View style={styles.participantsInfo}>
              <View style={[
                styles.participantsCount,
                getUserStatus === 'CONFIRMED' && {
                  ...styles.activeStatus,
                  ...getActiveStatusStyle('CONFIRMED')
                }
              ]}>
                <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={[
                  styles.participantsText,
                  getUserStatus === 'CONFIRMED' && styles.activeStatusText
                ]}>
                  {event.invitations.filter((inv: EventInvitation) => inv.status === 'CONFIRMED').length}
                </Text>
              </View>
              <View style={[
                styles.participantsCount,
                getUserStatus === 'INVITED' && {
                  ...styles.activeStatus,
                  ...getActiveStatusStyle('INVITED')
                }
              ]}>
                <View style={[styles.statusDot, { backgroundColor: '#FFC107' }]} />
                <Text style={[
                  styles.participantsText,
                  getUserStatus === 'INVITED' && styles.activeStatusText
                ]}>
                  {event.invitations.filter((inv: EventInvitation) => inv.status === 'INVITED').length}
                </Text>
              </View>
              <View style={[
                styles.participantsCount,
                getUserStatus === 'DECLINED' && {
                  ...styles.activeStatus,
                  ...getActiveStatusStyle('DECLINED')
                }
              ]}>
                <View style={[styles.statusDot, { backgroundColor: '#FF6347' }]} />
                <Text style={[
                  styles.participantsText,
                  getUserStatus === 'DECLINED' && styles.activeStatusText
                ]}>
                  {event.invitations.filter((inv: EventInvitation) => inv.status === 'DECLINED').length}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardContent: {
    padding: 16,
  },
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    marginRight: 12,
  },
  rightContent: {
    alignItems: 'flex-end',
    gap: 4,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#CED4DA',
    lineHeight: 18,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    borderColor: 'rgba(156, $9, 176, 0.3)',
    borderWidth: 1,
  },
  locationText: {
    fontSize: 12,
    color: '#9C27B0',
    marginLeft: 4,
  },
  midContent: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: '90%',
  },
  locationInfoText: {
    fontSize: 12,
    color: '#9C27B0',
    marginLeft: 4,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 8,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  footerText: {
    fontSize: 12,
    color: '#ADB5BD',
    marginLeft: 4,
    fontWeight: '500',
  },
  participantsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  participantsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  activeStatus: {
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  participantsText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ADB5BD',
  },
  activeStatusText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  emptyText: {
    color: '#6C757D',
    fontStyle: 'italic',
  },
  iconContainer: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
});

export default memo(EventItem);