// app/(panel)/events/[id].tsx - Versão corrigida com melhor manipulação de estados
import React, { useState, useEffect, useCallback } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useEvents, Event, InvitationStatus } from '../../../src/hooks/useEvents';
import { useAuth } from '../../../src/context/AuthContext';
import api from '../../../src/services/api';
import { ErrorHandler } from '../../../src/utils/errorHandling';
import { format, parseISO, isToday, isTomorrow, isPast, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getDisplayName } from '../../../src/utils/userUtils';

// Componentes internos importados
import EventInvitationCard from '../../../components/EventInvitationCard';
import EventAttendanceStatus from '../../../components/EventAttendanceStatus';
import EventParticipantsList from '../../../components/EventParticipantsList';

const EventDetailsScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [respondingToInvite, setRespondingToInvite] = useState(false);
  const [eventExists, setEventExists] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  const { 
    formatEventDate, 
    getCurrentUserEventStatus, 
    isCurrentUserCreator,
    respondToInvite,
    deleteEvent
  } = useEvents();

  // Buscar dados do evento
  const fetchEventDetails = useCallback(async () => {
    if (!id) {
      setEventExists(false);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/events/${id}`);
      setEvent(response.data);
      setEventExists(true);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error fetching event:", error);
      ErrorHandler.handle(error);
      setEventExists(false);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Carregar o evento inicialmente
  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  // Propriedades derivadas
  const userStatus = event ? getCurrentUserEventStatus(event) : null;
  const isCreator = event ? isCurrentUserCreator(event) : false;
  const isFinished = event?.isFinished || false;
  
  // Lidar com a resposta ao convite
  const handleRespondToInvite = async (status: InvitationStatus) => {
    if (!event || !id) return;
    
    try {
      setRespondingToInvite(true);
      await respondToInvite(parseInt(id), status as 'CONFIRMED' | 'DECLINED');
      
      // Atualizar evento para refletir a mudança
      await fetchEventDetails();
      
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
      Alert.alert('Erro', 'Não foi possível compartilhar o evento.');
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
              setLoading(true);
              await deleteEvent(parseInt(id));
              Alert.alert('Sucesso', 'Evento excluído com sucesso');
              router.replace('/(panel)/events/index');
            } catch (error) {
              ErrorHandler.handle(error);
            } finally {
              setLoading(false);
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
  
  // Navegar para tela de convidar pessoas
  const navigateToInvite = () => {
    if (event && event.id) {
      router.push(`/events/invite?id=${event.id}`);
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
          accessibilityRole="button"
          accessibilityLabel="Voltar"
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
              accessibilityRole="button"
              accessibilityLabel="Excluir evento"
            >
              <Ionicons name="trash-outline" size={24} color="#FF6347" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={shareEvent}
            accessibilityRole="button"
            accessibilityLabel="Compartilhar evento"
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
                event.isHappening ? "time" : 
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
        
        {/* Componente para Ações de convite */}
        <EventInvitationCard
          event={event}
          userStatus={userStatus}
          isFinished={isFinished}
          onRespond={handleRespondToInvite}
        />
        
        {/* Componente para Status de Participação do Usuário */}
        <EventAttendanceStatus
          userStatus={userStatus as InvitationStatus}
          isFinished={isFinished}
          onChangeStatus={handleRespondToInvite}
        />
        
        {/* Descrição */}
        {event.description && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Descrição</Text>
            <Text style={styles.descriptionText}>{event.description}</Text>
          </View>
        )}
        
        {/* Componente de Lista de Participantes */}
        <EventParticipantsList
          event={event}
          currentUserId={user?.uid}
          onInvite={isCreator ? navigateToInvite : undefined}
          isCreator={isCreator}
          isFinished={isFinished}
        />
      </ScrollView>
      
      {/* Botão de editar para o criador */}
      {isCreator && !isFinished && (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push(`/events/edit?id=${event.id}`)}
          accessibilityRole="button"
          accessibilityLabel="Editar evento"
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
  divider: {
    height: 1,
    backgroundColor: '#444',
    marginVertical: 16,
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