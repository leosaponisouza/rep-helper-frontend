// app/(panel)/events/[id].tsx
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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useEvents, Event, InvitationStatus } from '../../../src/hooks/useEvents';
import { useAuth } from '../../../src/context/AuthContext';
import api from '../../../src/services/api';
import { ErrorHandler } from '../../../src/utils/errorHandling';
import { format, parseISO, isToday, isTomorrow, isPast, addDays } from 'date-fns';
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
      if (!id) return;
      
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
      
    } catch (error) {
      ErrorHandler.handle(error);
    } finally {
      setRespondingToInvite(false);
    }
  };
  
  // Formatar intervalo de data/hora do evento
  const formatEventDateRange = (startDateStr: string, endDateStr: string) => {
    try {
      const startDate = parseISO(startDateStr);
      const endDate = parseISO(endDateStr);
      
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
      return `${startDateStr} - ${endDateStr}`;
    }
  };
  
  // Função para excluir evento
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
  const confirmedCount = event.invitations.filter(inv => inv.status === 'CONFIRMED').length;
  const invitedCount = event.invitations.filter(inv => inv.status === 'INVITED').length;
  const declinedCount = event.invitations.filter(inv => inv.status === 'DECLINED').length;
  
  // Verificar estado do evento
  const isFinished = event.isFinished;
  const isHappening = event.isHappening;

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
        {isCreator && (
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={handleDeleteEvent}
          >
            <Ionicons name="trash-outline" size={24} color="#FF6347" />
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView style={styles.container}>
        <View style={styles.eventHeader}>
          {/* Status banner */}
          {(isFinished || isHappening || userStatus === 'INVITED') && (
            <View style={[
              styles.statusBanner,
              isFinished ? styles.finishedBanner : 
              isHappening ? styles.happeningBanner : 
              userStatus === 'INVITED' ? styles.invitedBanner : null
            ]}>
              <Ionicons 
                name={
                  isFinished ? "checkmark-done-circle" : 
                  isHappening ? "time" : 
                  "mail"
                } 
                size={20} 
                color="white" 
              />
              <Text style={styles.statusBannerText}>
                {isFinished ? "Este evento já aconteceu" : 
                 isHappening ? "Este evento está acontecendo agora" : 
                 userStatus === 'INVITED' ? "Você foi convidado para este evento" : ""}
              </Text>
            </View>
          )}
          
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
            {event.invitations
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
              ))}
            
            {event.invitations
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
              ))}
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
  headerActionButton: {
    padding: 5,
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
  eventHeader: {
    backgroundColor: '#333',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  finishedBanner: {
    backgroundColor: '#666',
  },
  happeningBanner: {
    backgroundColor: '#4CAF50',
  },
  invitedBanner: {
    backgroundColor: '#FFC107',
  },
  statusBannerText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '500',
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