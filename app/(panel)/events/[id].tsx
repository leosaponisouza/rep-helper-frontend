// app/(panel)/events/[id].tsx - Versão otimizada com melhor UX e performance
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
  Platform,
  Animated,
  Share
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useEventsContext, Event } from '../../../src/context/EventsContext';
import { useAuth } from '../../../src/context/AuthContext';
import { format, parseISO, isToday, isTomorrow, isPast, isAfter, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Componente otimizado para detalhes do evento
const EventDetailsScreen: React.FC = () => {
  const router = useRouter();
  const { id, source } = useLocalSearchParams<{ id: string, source?: string }>();
  const { user } = useAuth();
  const { getEventById, updateInvitationStatus, deleteEvent } = useEventsContext();
  
  // Estados
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
  // Animações
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.95))[0];
  const scrollY = useState(new Animated.Value(0))[0];
  
  // Efeito de entrada com animação
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, []);
  
  // Carregar detalhes do evento
  const loadEventDetails = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const eventData = await getEventById(id);
      if (eventData) {
        setEvent(eventData);
      } else {
        setError('Evento não encontrado');
      }
    } catch (error) {
      console.error('Error loading event details:', error);
      setError('Não foi possível carregar os detalhes do evento');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, getEventById]);
  
  // Carregar evento ao montar o componente
  useEffect(() => {
    loadEventDetails();
  }, [loadEventDetails]);
  
  // Verificar se o usuário é o criador do evento
  const isCreator = useMemo(() => {
    if (!event || !user) return false;
    return event.creatorId === user.uid;
  }, [event, user]);
  
  // Obter o status do convite do usuário atual
  const userInvitation = useMemo(() => {
    if (!event || !user || !event.invitations) return null;
    return event.invitations.find(inv => inv.userId === user.uid) || null;
  }, [event, user]);
  
  // Formatar data para exibição amigável
  const formatEventDate = useCallback((dateString?: string): string => {
    if (!dateString) return '';
    
    try {
      const date = parseISO(dateString);
      
      if (isToday(date)) {
        return `Hoje, ${format(date, "HH:mm", { locale: ptBR })}`;
      } else if (isTomorrow(date)) {
        return `Amanhã, ${format(date, "HH:mm", { locale: ptBR })}`;
      } else {
        return format(date, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
      }
    } catch (error) {
      return dateString;
    }
  }, []);
  
  // Formatar duração do evento
  const formatEventDuration = useCallback((startDate?: string, endDate?: string): string => {
    if (!startDate || !endDate) return '';
    
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      
      const durationMinutes = differenceInMinutes(end, start);
      
      if (durationMinutes < 60) {
        return `${durationMinutes} minutos`;
      } else {
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        
        if (minutes === 0) {
          return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
        } else {
          return `${hours} ${hours === 1 ? 'hora' : 'horas'} e ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
        }
      }
    } catch (error) {
      return '';
    }
  }, []);
  
  // Atualizar status do convite
  const handleUpdateStatus = useCallback(async (status: 'CONFIRMED' | 'DECLINED') => {
    if (!event || !user) return;
    
    try {
      setRefreshing(true);
      
      await updateInvitationStatus(event.id, user.uid, status);
      
      // Recarregar detalhes do evento para atualizar a UI
      await loadEventDetails();
    } catch (error) {
      console.error('Error updating invitation status:', error);
      Alert.alert('Erro', 'Não foi possível atualizar seu status. Tente novamente.');
    } finally {
      setRefreshing(false);
    }
  }, [event, user, updateInvitationStatus, loadEventDetails]);
  
  // Compartilhar evento
  const handleShareEvent = useCallback(async () => {
    if (!event) return;
    
    try {
      const message = `Evento: ${event.title}\n` +
        `Data: ${formatEventDate(event.startDate)}\n` +
        (event.location ? `Local: ${event.location}\n` : '') +
        (event.description ? `\n${event.description}` : '');
      
      await Share.share({
        message,
        title: event.title,
      });
    } catch (error) {
      console.error('Error sharing event:', error);
      Alert.alert('Erro', 'Não foi possível compartilhar o evento');
    }
  }, [event, formatEventDate]);
  
  // Excluir evento
  const handleDeleteEvent = useCallback(async () => {
    if (!event) return;
    
    if (!showConfirmDelete) {
      setShowConfirmDelete(true);
      return;
    }
    
    try {
      setRefreshing(true);
      
      await deleteEvent(event.id);
      
      // Animação de saída
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => {
        Alert.alert(
          'Sucesso',
          'Evento excluído com sucesso!',
          [
            {
              text: 'OK',
              onPress: () => router.push('/(panel)/events')
            }
          ]
        );
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      Alert.alert('Erro', 'Não foi possível excluir o evento. Tente novamente.');
      setShowConfirmDelete(false);
    } finally {
      setRefreshing(false);
    }
  }, [event, showConfirmDelete, deleteEvent, fadeAnim, scaleAnim, router]);
  
  // Cancelar exclusão
  const handleCancelDelete = useCallback(() => {
    setShowConfirmDelete(false);
  }, []);
  
  // Calcular contagem de confirmados
  const confirmedCount = useMemo(() => {
    if (!event || !event.invitations) return 0;
    return event.invitations.filter(inv => inv.status === 'CONFIRMED').length;
  }, [event]);
  
  // Calcular contagem de convidados
  const invitedCount = useMemo(() => {
    if (!event || !event.invitations) return 0;
    return event.invitations.filter(inv => inv.status === 'INVITED').length;
  }, [event]);
  
  // Calcular contagem de recusados
  const declinedCount = useMemo(() => {
    if (!event || !event.invitations) return 0;
    return event.invitations.filter(inv => inv.status === 'DECLINED').length;
  }, [event]);
  
  // Verificar se o evento já aconteceu
  const eventHasPassed = useMemo(() => {
    if (!event || !event.endDate) return false;
    
    try {
      const endDate = parseISO(event.endDate);
      return isPast(endDate);
    } catch (error) {
      return false;
    }
  }, [event]);
  
  // Verificar se o evento está acontecendo agora
  const eventIsHappening = useMemo(() => {
    if (!event || !event.startDate || !event.endDate) return false;
    
    try {
      const now = new Date();
      const startDate = parseISO(event.startDate);
      const endDate = parseISO(event.endDate);
      
      return isAfter(now, startDate) && isAfter(endDate, now);
    } catch (error) {
      return false;
    }
  }, [event]);
  
  // Animação do header com base no scroll
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 60],
    extrapolate: 'clamp'
  });
  
  // Se estiver carregando, mostrar indicador
  if (loading && !event) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#222" />
        <ActivityIndicator size="large" color="#7B68EE" />
        <Text style={styles.loadingText}>Carregando detalhes do evento...</Text>
      </SafeAreaView>
    );
  }
  
  // Se houver erro, mostrar mensagem
  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#222" />
        <Ionicons name="alert-circle" size={64} color="#FF6347" />
        <Text style={styles.errorTitle}>Erro</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={loadEventDetails}
        >
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  // Se não houver evento, mostrar mensagem
  if (!event) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#222" />
        <Ionicons name="calendar" size={64} color="#7B68EE" />
        <Text style={styles.errorTitle}>Evento não encontrado</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/(panel)/events')}
        >
          <Text style={styles.backButtonText}>Voltar para Eventos</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      {/* Header animado */}
      <Animated.View 
        style={[
          styles.animatedHeader,
          { 
            opacity: headerOpacity,
            height: headerHeight
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#7B68EE" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {event.title}
        </Text>
        <View style={styles.headerRight}>
          {isCreator && (
            <TouchableOpacity 
              style={styles.headerActionButton}
              onPress={() => {
                if (source === 'home') {
                  router.navigate('/(panel)/home');
                } else {
                  router.back();
                }
              }}
            >
              <Ionicons name="create-outline" size={24} color="#7B68EE" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
      
      <Animated.ScrollView
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Cabeçalho */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#7B68EE" />
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleShareEvent}
            >
              <Ionicons name="share-outline" size={24} color="#7B68EE" />
            </TouchableOpacity>
            
            {isCreator && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push(`/(panel)/events/edit/${event.id}`)}
              >
                <Ionicons name="create-outline" size={24} color="#7B68EE" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Conteúdo principal */}
        <Animated.View 
          style={[
            styles.eventContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Status do evento */}
          {eventHasPassed ? (
            <View style={styles.eventStatusBadge}>
              <Text style={styles.eventStatusText}>Evento finalizado</Text>
            </View>
          ) : eventIsHappening ? (
            <View style={[styles.eventStatusBadge, styles.happeningNowBadge]}>
              <Text style={[styles.eventStatusText, styles.happeningNowText]}>Acontecendo agora</Text>
            </View>
          ) : null}
          
          {/* Título */}
          <Text style={styles.eventTitle}>{event.title}</Text>
          
          {/* Data e hora */}
          <View style={styles.eventInfoRow}>
            <Ionicons name="calendar" size={20} color="#7B68EE" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Data e hora</Text>
              <Text style={styles.infoText}>
                {formatEventDate(event.startDate)}
              </Text>
              {event.endDate && (
                <Text style={styles.infoSecondaryText}>
                  Término: {formatEventDate(event.endDate)}
                </Text>
              )}
              {event.startDate && event.endDate && (
                <Text style={styles.infoDurationText}>
                  Duração: {formatEventDuration(event.startDate, event.endDate)}
                </Text>
              )}
            </View>
          </View>
          
          {/* Local */}
          {event.location && (
            <View style={styles.eventInfoRow}>
              <Ionicons name="location" size={20} color="#7B68EE" style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Local</Text>
                <Text style={styles.infoText}>{event.location}</Text>
              </View>
            </View>
          )}
          
          {/* Descrição */}
          {event.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>Descrição</Text>
              <Text style={styles.descriptionText}>{event.description}</Text>
            </View>
          )}
          
          {/* Estatísticas de participação */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, styles.confirmedIconContainer]}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.statCount}>{confirmedCount}</Text>
              <Text style={styles.statLabel}>Confirmados</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, styles.invitedIconContainer]}>
                <Ionicons name="help-circle" size={24} color="#FFC107" />
              </View>
              <Text style={styles.statCount}>{invitedCount}</Text>
              <Text style={styles.statLabel}>Pendentes</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, styles.declinedIconContainer]}>
                <Ionicons name="close-circle" size={24} color="#FF6347" />
              </View>
              <Text style={styles.statCount}>{declinedCount}</Text>
              <Text style={styles.statLabel}>Recusados</Text>
            </View>
          </View>
          
          {/* Ações do usuário */}
          {!eventHasPassed && userInvitation && (
            <View style={styles.userActionsContainer}>
              <Text style={styles.userActionsTitle}>Sua participação</Text>
              
              <View style={styles.userStatusContainer}>
                <Text style={styles.userStatusLabel}>Status atual:</Text>
                <View style={[
                  styles.userStatusBadge,
                  userInvitation.status === 'CONFIRMED' ? styles.confirmedBadge :
                  userInvitation.status === 'INVITED' ? styles.invitedBadge :
                  styles.declinedBadge
                ]}>
                  <Text style={[
                    styles.userStatusText,
                    userInvitation.status === 'CONFIRMED' ? styles.confirmedText :
                    userInvitation.status === 'INVITED' ? styles.invitedText :
                    styles.declinedText
                  ]}>
                    {userInvitation.status === 'CONFIRMED' ? 'Confirmado' :
                     userInvitation.status === 'INVITED' ? 'Convidado' : 'Recusado'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.actionButtonsContainer}>
                {userInvitation.status !== 'CONFIRMED' && (
                  <TouchableOpacity 
                    style={[styles.participationButton, styles.confirmButton]}
                    onPress={() => handleUpdateStatus('CONFIRMED')}
                    disabled={refreshing}
                  >
                    {refreshing ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={20} color="#fff" style={styles.buttonIcon} />
                        <Text style={styles.confirmButtonText}>Confirmar presença</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                
                {userInvitation.status !== 'DECLINED' && (
                  <TouchableOpacity 
                    style={[styles.participationButton, styles.declineButton]}
                    onPress={() => handleUpdateStatus('DECLINED')}
                    disabled={refreshing}
                  >
                    {refreshing ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="close" size={20} color="#fff" style={styles.buttonIcon} />
                        <Text style={styles.declineButtonText}>Recusar convite</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          
          {/* Ações do criador */}
          {isCreator && (
            <View style={styles.creatorActionsContainer}>
              <Text style={styles.creatorActionsTitle}>Ações do organizador</Text>
              
              <View style={styles.creatorButtonsContainer}>
                <TouchableOpacity 
                  style={styles.creatorButton}
                  onPress={() => router.push(`/(panel)/events/invitations/${event.id}`)}
                >
                  <Ionicons name="people" size={20} color="#7B68EE" style={styles.buttonIcon} />
                  <Text style={styles.creatorButtonText}>Gerenciar convidados</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.creatorButton, styles.deleteButton]}
                  onPress={handleDeleteEvent}
                >
                  {refreshing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons 
                        name={showConfirmDelete ? "alert-circle" : "trash"} 
                        size={20} 
                        color="#fff" 
                        style={styles.buttonIcon} 
                      />
                      <Text style={styles.deleteButtonText}>
                        {showConfirmDelete ? "Confirmar exclusão" : "Excluir evento"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                
                {showConfirmDelete && (
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={handleCancelDelete}
                  >
                    <Ionicons name="close-circle" size={20} color="#aaa" style={styles.buttonIcon} />
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </Animated.View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#222',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
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
    backgroundColor: '#222',
    padding: 20,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: 'rgba(123, 104, 238, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  retryButtonText: {
    color: '#7B68EE',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(34, 34, 34, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 1000,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerActionButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#222',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  eventContainer: {
    backgroundColor: '#333',
    borderRadius: 16,
    margin: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  eventStatusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(158, 158, 158, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  happeningNowBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  eventStatusText: {
    color: '#9E9E9E',
    fontSize: 14,
    fontWeight: 'bold',
  },
  happeningNowText: {
    color: '#4CAF50',
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  eventInfoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 4,
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  infoSecondaryText: {
    color: '#ddd',
    fontSize: 14,
    marginTop: 4,
  },
  infoDurationText: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 4,
    fontStyle: 'italic',
  },
  descriptionContainer: {
    marginTop: 8,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#444',
    borderRadius: 12,
  },
  descriptionLabel: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 8,
  },
  descriptionText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#444',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  confirmedIconContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  invitedIconContainer: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
  },
  declinedIconContainer: {
    backgroundColor: 'rgba(255, 99, 71, 0.2)',
  },
  statCount: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#aaa',
    fontSize: 12,
  },
  userActionsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#444',
    borderRadius: 12,
  },
  userActionsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  userStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userStatusLabel: {
    color: '#aaa',
    fontSize: 14,
    marginRight: 8,
  },
  userStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  confirmedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  invitedBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
  },
  declinedBadge: {
    backgroundColor: 'rgba(255, 99, 71, 0.2)',
  },
  userStatusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  confirmedText: {
    color: '#4CAF50',
  },
  invitedText: {
    color: '#FFC107',
  },
  declinedText: {
    color: '#FF6347',
  },
  actionButtonsContainer: {
    marginTop: 8,
  },
  participationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    ...Platform.select({
      ios: {
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  declineButton: {
    backgroundColor: '#FF6347',
    ...Platform.select({
      ios: {
        shadowColor: '#FF6347',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonIcon: {
    marginRight: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  declineButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  creatorActionsContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#444',
    borderRadius: 12,
  },
  creatorActionsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  creatorButtonsContainer: {
    marginTop: 8,
  },
  creatorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: 'rgba(123, 104, 238, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(123, 104, 238, 0.3)',
  },
  creatorButtonText: {
    color: '#7B68EE',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#FF6347',
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#FF6347',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#444',
  },
  cancelButtonText: {
    color: '#aaa',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default EventDetailsScreen;