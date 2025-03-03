// app/(panel)/events/[id].tsx - Enhanced version with better error handling and UX
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
  Share
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useEvents, Event, InvitationStatus } from '../../../src/hooks/useEvents';
import { useAuth } from '../../../src/context/AuthContext';
import api from '../../../src/services/api';
import { ErrorHandler } from '../../../src/utils/errorHandling';
import { format, parseISO, isToday, isTomorrow, isPast, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getDisplayName } from '../../../src/utils/userUtils';

const EventDetailsScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [respondingToInvite, setRespondingToInvite] = useState(false);
  const [eventExists, setEventExists] = useState(true);
  
  const { 
    formatEventDate, 
    getCurrentUserEventStatus, 
    isCurrentUserCreator,
    respondToInvite,
    deleteEvent
  } = useEvents();

  // Buscar dados do evento
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!id) {
        setEventExists(false);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await api.get(`/api/v1/events/${id}`);
        setEvent(response.data);
      } catch (error) {
        console.error("Error fetching event:", error);
        ErrorHandler.handle(error);
        setEventExists(false);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [id]);

  // Status do usuário atual
  const userStatus = event ? getCurrentUserEventStatus(event) : null;
  
  // Verificar se o usuário é criador
  const isCreator = event ? isCurrentUserCreator(event) : false;
  
  // Lidar com a resposta ao convite
  const handleRespondToInvite = async (status: InvitationStatus) => {
    if (!event || !id) return;
    
    try {
      setRespondingToInvite(true);
      await respondToInvite(parseInt(id), status as 'CONFIRMED' | 'DECLINED');
      
      // Atualizar evento para refletir a mudança
      const response = await api.get(`/api/v1/events/${id}`);
      setEvent(response.data);
      
      // Mostrar mensagem de confirmação
      const actionText = status === 'CONFIRMED' ? 'confirmado' : 'recusado';
      Alert.alert(
        'Sucesso',
        `Você ${actionText} sua participação no evento.`
      );
    } catch (error) {
      ErrorHandler.handle(error);
    } finally {
      setRespondingToInvite(false);
    }
  };
  
  // Compartilhar evento
  const shareEvent = async () => {
    if (!event) return;
    
    try {
      const eventDate = formatEventDateRange(event.startDate, event.endDate);
      const message = `Evento: ${event.title}\nData: ${eventDate}\n${event.location ? `Local: ${event.location}\n` : ''}`;
      
      await Share.share({
        message
      });
    } catch (error) {
      console.error('Error sharing event:', error);
    }
  };
  
  // Formatar intervalo de data/hora do evento com tratamento de erro aprimorado
  const formatEventDateRange = (startDateStr: string, endDateStr: string) => {
    try {
      if (!startDateStr || !endDateStr) {
        return 'Data não definida';
      }
      
      const startDate = parseISO(startDateStr);
      const endDate = parseISO(endDateStr);
      
      // Validar datas
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return 'Data inválida';
      }
      
      // Mesmo dia
      if (format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd')) {
        const dayStr = isToday(startDate) 
          ? 'Hoje' 
          : isTomorrow(startDate)
            ? 'Amanhã'
            : format(startDate, "dd 'de' MMMM", { locale: ptBR });
            
        return `${dayStr}, ${format(startDate, 'HH:mm', { locale: ptBR })} - ${format(endDate, 'HH:mm', { locale: ptBR })}`;
      }
      
      // Dias diferentes
      return `${format(startDate, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })} - ${format(endDate, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}`;
    } catch (error) {
      console.error('Error formatting date range:', error);
      return 'Data indisponível';
    }
  };
  
  // Função para excluir evento com confirmação
  const handleDeleteEvent = async () => {
    if (!event || !id) return;
    
    Alert.alert(
      'Excluir Evento',
      'Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(parseInt(id));
              Alert.alert('Sucesso', 'Evento excluído com sucesso');
              router.replace('/(panel)/events/index');
            } catch (error) {
              ErrorHandler.handle(error);
            }
          }
        }
      ]
    );
  };
  
  // Função utilitária para obter cores baseadas no status do evento
  const getEventStatusStyle = (event: Event) => {
    if (event.isFinished) {
      return { 
        color: '#9E9E9E', 
        backgroundColor: 'rgba(158, 158, 158, 0.2)',
        text: 'Evento finalizado'
      };
    }
    
    if (event.isHappening) {
      return { 
        color: '#4CAF50', 
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        text: 'Acontecendo agora'
      };
    }
    
    // Verificar status de convite
    if (userStatus === 'INVITED') {
      return { 
        color: '#FFC107', 
        backgroundColor: 'rgba(255, 193, 7, 0.2)',
        text: 'Você foi convidado'
      };
    }
    
    if (userStatus === 'CONFIRMED') {
      return { 
        color: '#7B68EE', 
        backgroundColor: 'rgba(123, 104, 238, 0.2)',
        text: 'Você confirmou presença'
      };
    }
    
    if (userStatus === 'DECLINED') {
      return { 
        color: '#FF6347', 
        backgroundColor: 'rgba(255, 99, 71, 0.2)',
        text: 'Você recusou o convite'
      };
    }
    
    return { 
      color: '#7B68EE', 
      backgroundColor: 'rgba(123, 104, 238, 0.2)',
      text: 'Evento futuro'
    };
  };
  
  // Formatar datas relativas (quando ocorre)
  const getRelativeDateText = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      const now = new Date();
      
      if (isToday(date)) {
        return { text: 'Hoje', color: '#4CAF50' };
      }
      
      if (isTomorrow(date)) {
        return { text: 'Amanhã', color: '#7B68EE' };
      }
      
      const daysUntil = differenceInDays(date, now);
      
      if (daysUntil < 0) {
        return { 
          text: `${Math.abs(daysUntil)} dias atrás`, 
          color: '#9E9E9E' 
        };
      }
      
      if (daysUntil < 7) {
        return { 
          text: `Em ${daysUntil} dias`, 
          color: '#7B68EE' 
        };
      }
      
      return { 
        text: format(date, "dd 'de' MMMM", { locale: ptBR }), 
        color: '#7B68EE' 
      };
    } catch (error) {
      return { text: 'Data indisponível', color: '#9E9E9E' };
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#222" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B68EE" />
          <Text style={styles.loadingText}>Carregando evento...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!eventExists || !event) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#222" />
        <View style={styles.errorContainer}>
          <Ionicons name="calendar-outline" size={80} color="#7B68EE" />
          <Text style={styles.errorTitle}>Evento não encontrado</Text>
          <Text style={styles.errorMessage}>O evento que você está procurando não existe ou foi removido.</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  // Contagem de participantes
  const confirmedCount = event.invitations ? 
    event.invitations.filter(inv => inv.status === 'CONFIRMED').length : 0;
  const invitedCount = event.invitations ? 
    event.invitations.filter(inv => inv.status === 'INVITED').length : 0;
  const declinedCount = event.invitations ? 
    event.invitations.filter(inv => inv.status === 'DECLINED').length : 0;
  
  // Verificar estado do evento
  const isFinished = event.isFinished;
  const isHappening = event.isHappening;
  
  // Obter estilo baseado no status
  const eventStatusStyle = getEventStatusStyle(event);
  
  // Obter informações de data relativa
  const relativeDateInfo = event.startDate ? 
    getRelativeDateText(event.startDate) : 
    { text: '', color: '#7B68EE' };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButtonHeader}
        >
          <Ionicons name="arrow-back" size={24} color="#7B68EE" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Detalhes do Evento
        </Text>
        
        <View style={styles.headerActions}>
          {isCreator && (
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleDeleteEvent}
            >
              <Ionicons name="trash-outline" size={24} color="#FF6347" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={shareEvent}
          >
            <Ionicons name="share-social-outline" size={24} color="#7B68EE" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Evento Banner/Header */}
        <View style={styles.eventHeaderSection}>
          <View style={[
            styles.statusBanner,
            { backgroundColor: eventStatusStyle.backgroundColor }
          ]}>
            <Ionicons 
              name={
                isFinished ? "checkmark-done-circle" : 
                isHappening ? "time" : 
                userStatus === 'INVITED' ? "mail" :
                userStatus === 'CONFIRMED' ? "checkmark-circle" : "calendar"
              } 
              size={20} 
              color={eventStatusStyle.color} 
            />
            <Text style={[styles.statusBannerText, { color: eventStatusStyle.color }]}>
              {eventStatusStyle.text}
            </Text>
            
            <View style={styles.relativeDateBadge}>
              <Text style={[styles.relativeDateText, { color: relativeDateInfo.color }]}>
                {relativeDateInfo.text}
              </Text>
            </View>
          </View>
          
          <Text style={styles.eventTitle}>{event.title}</Text>
          
          <View style={styles.creatorInfo}>
            <Text style={styles.createdByText}>
              Criado por <Text style={styles.creatorName}>{event.creatorName}</Text>
            </Text>
          </View>
          
          <View style={styles.dateTimeContainer}>
            <Ionicons name="calendar" size={20} color="#7B68EE" style={styles.infoIcon} />
            <Text style={styles.dateTimeText}>
              {formatEventDateRange(event.startDate, event.endDate)}
            </Text>
          </View>
          
          {event.location && (
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={20} color="#7B68EE" style={styles.infoIcon} />
              <Text style={styles.locationText}>{event.location}</Text>
            </View>
          )}
        </View>
        
        {/* Ações de convite */}
        {userStatus === 'INVITED' && !isFinished && (
          <View style={styles.inviteActionContainer}>
            <Text style={styles.inviteActionTitle}>Você foi convidado para este evento</Text>
            
            <View style={styles.inviteButtonsContainer}>
              <TouchableOpacity
                style={[styles.inviteActionButton, styles.declineButton]}
                onPress={() => handleRespondToInvite('DECLINED')}
                disabled={respondingToInvite}
              >
                {respondingToInvite ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={20} color="white" style={styles.buttonIcon} />
                    <Text style={styles.inviteActionButtonText}>Recusar</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.inviteActionButton, styles.acceptButton]}
                onPress={() => handleRespondToInvite('CONFIRMED')}
                disabled={respondingToInvite}
              >
                {respondingToInvite ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="white" style={styles.buttonIcon} />
                    <Text style={styles.inviteActionButtonText}>Aceitar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Status de Participação do Usuário */}
        {userStatus === 'CONFIRMED' && !isFinished && (
          <View style={styles.userAttendanceContainer}>
            <View style={styles.userStatusIndicator}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.userStatusText}>Você confirmou presença</Text>
            </View>
            
            <TouchableOpacity
              style={styles.changeStatusButton}
              onPress={() => handleRespondToInvite('DECLINED')}
              disabled={respondingToInvite}
            >
              {respondingToInvite ? (
                <ActivityIndicator size="small" color="#FF6347" />
              ) : (
                <Text style={styles.changeStatusButtonText}>Cancelar participação</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {/* Status de Participação do Usuário - Recusado */}
        {userStatus === 'DECLINED' && !isFinished && (
          <View style={styles.userAttendanceContainer}>
            <View style={styles.userStatusIndicator}>
              <Ionicons name="close-circle" size={24} color="#FF6347" />
              <Text style={styles.userStatusText}>Você recusou o convite</Text>
            </View>
            
            <TouchableOpacity
              style={styles.rejoinButton}
              onPress={() => handleRespondToInvite('CONFIRMED')}
              disabled={respondingToInvite}
            >
              {respondingToInvite ? (
                <ActivityIndicator size="small" color="#4CAF50" />
              ) : (
                <Text style={styles.rejoinButtonText}>Participar</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {/* Descrição */}
        {event.description && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Descrição</Text>
            <Text style={styles.descriptionText}>{event.description}</Text>
          </View>
        )}
        
        {/* Participantes */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Participantes</Text>
          
          <View style={styles.participantsStats}>
            <View style={styles.participantsStat}>
              <Text style={styles.participantsStatNumber}>{confirmedCount}</Text>
              <Text style={styles.participantsStatLabel}>Confirmados</Text>
            </View>
            
            <View style={styles.participantsStat}>
              <Text style={styles.participantsStatNumber}>{invitedCount}</Text>
              <Text style={styles.participantsStatLabel}>Pendentes</Text>
            </View>
            
            <View style={styles.participantsStat}>
              <Text style={styles.participantsStatNumber}>{declinedCount}</Text>
              <Text style={styles.participantsStatLabel}>Recusados</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          {/* Lista de participantes */}
          <View style={styles.participantsList}>
            {event.invitations && 
              event.invitations
                .filter(inv => inv.status === 'CONFIRMED')
                .map(invitation => (
                  <View key={invitation.userId} style={styles.participantItem}>
                    {invitation.userProfilePicture ? (
                      <Image 
                        source={{ uri: invitation.userProfilePicture }} 
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
                        {invitation.userId === user?.uid && ' (Você)'}
                      </Text>
                      <Text style={styles.participantEmail}>{invitation.userEmail}</Text>
                    </View>
                    <View style={styles.participantStatusBadge}>
                      <Text style={styles.participantStatusText}>Confirmado</Text>
                    </View>
                  </View>
                ))
            }
            
            {event.invitations && 
              event.invitations
                .filter(inv => inv.status === 'INVITED')
                .map(invitation => (
                  <View key={invitation.userId} style={styles.participantItem}>
                    {invitation.userProfilePicture ? (
                      <Image 
                        source={{ uri: invitation.userProfilePicture }} 
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
                        {invitation.userId === user?.uid && ' (Você)'}
                      </Text>
                      <Text style={styles.participantEmail}>{invitation.userEmail}</Text>
                    </View>
                    <View style={[styles.participantStatusBadge, styles.pendingBadge]}>
                      <Text style={[styles.participantStatusText, styles.pendingStatusText]}>Pendente</Text>
                    </View>
                  </View>
                ))
            }
            
            {(!event.invitations || event.invitations.length === 0) && (
              <Text style={styles.noParticipantsText}>
                Nenhum participante confirmado ainda.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
      
      {/* Botão de editar para o criador */}
      {isCreator && !isFinished && (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push(`/events/edit?id=${event.id}`)}
        >
          <Ionicons name="pencil" size={24} color="white" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#222',
  },
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  backButtonHeader: {
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginHorizontal: 10,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerActionButton: {
    padding: 5,
    marginLeft: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  errorMessage: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#7B68EE',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventHeaderSection: {
    backgroundColor: '#333',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  statusBannerText: {
    marginLeft: 8,
    fontWeight: '500',
    flex: 1,
  },
  relativeDateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  relativeDateText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  creatorInfo: {
    marginBottom: 15,
  },
  createdByText: {
    color: '#ccc',
    fontSize: 14,
  },
  creatorName: {
    color: '#7B68EE',
    fontWeight: '500',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    marginRight: 10,
  },
  dateTimeText: {
    color: '#fff',
    fontSize: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#fff',
    fontSize: 16,
  },
  inviteActionContainer: {
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(123, 104, 238, 0.3)',
  },
  inviteActionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },
  inviteButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inviteActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 0.48,
  },
  declineButton: {
    backgroundColor: '#FF6347',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  buttonIcon: {
    marginRight: 8,
  },
  inviteActionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userAttendanceContainer: {
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(123, 104, 238, 0.3)',
  },
  userStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'center',
  },
  userStatusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  changeStatusButton: {
    backgroundColor: '#FF6347',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  changeStatusButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  rejoinButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejoinButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  sectionContainer: {
    backgroundColor: '#333',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    color: '#7B68EE',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  descriptionText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  participantsStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  participantsStat: {
    alignItems: 'center',
    flex: 1,
  },
  participantsStatNumber: {
    color: '#7B68EE',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  participantsStatLabel: {
    color: '#ccc',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#444',
    marginVertical: 16,
  },
  participantsList: {
    
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    backgroundColor: '#7B68EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantInitials: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  participantEmail: {
    color: '#ccc',
    fontSize: 12,
  },
  participantStatusBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  pendingBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
  },
  participantStatusText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pendingStatusText: {
    color: '#FFC107',
  },
  noParticipantsText: {
    color: '#aaa',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  editButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7B68EE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7B68EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});

export default EventDetailsScreen;