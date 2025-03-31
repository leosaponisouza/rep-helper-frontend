// app/(panel)/events/invitations/[id].tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  Animated
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEvents } from '../../../../src/hooks/useEvents';
import { Event } from '../../../../src/services/events';
import { useAuth } from '../../../../src/context/AuthContext';
import api from '../../../../src/services/api';

// Importar estilos
import { sharedStyles, colors } from '../../../../src/styles/sharedStyles';
import eventsStyles from '../../../../src/styles/eventStyles';

// Definir interface para membros
interface Member {
  uid: string;
  name: string;
  nickname?: string;
  email: string;
  profilePictureUrl?: string;
  isInvited: boolean;
  status?: string;
}

const InvitationsScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { getEventById, isCurrentUserCreator, inviteUsers, updateInvitationStatus } = useEvents();
  
  // Animações
  const fadeAnim = useState(new Animated.Value(0))[0];
  
  // Estados
  const [event, setEvent] = useState<Event | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedMembersIds, setSelectedMembersIds] = useState<string[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [tab, setTab] = useState<'invited' | 'new'>('invited');
  
  // Efeito de entrada com animação
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);
  
  // Função para buscar dados do evento e membros
  const fetchData = useCallback(async () => {
    if (!id || !user?.currentRepublicId) return;
    
    try {
      setLoading(true);
      
      // Buscar dados do evento
      const eventData = await getEventById(id);
      
      if (!eventData) {
        Alert.alert('Erro', 'Evento não encontrado');
        router.back();
        return;
      }
      
      // Garantir que invitations é sempre um array
      if (!eventData.invitations) {
        eventData.invitations = [];
      }
      
      setEvent(eventData);
      
      // Verificar se o usuário é o criador para gerenciar permissões
      if (!isCurrentUserCreator(eventData)) {
        Alert.alert('Erro', 'Você não tem permissão para gerenciar convites para este evento');
        router.back();
        return;
      }
      
      try {
        // Buscar membros da república
        const membersResponse = await api.get(`/api/v1/republics/${user.currentRepublicId}/members`);
        const membersData = membersResponse.data;
        
        // Mapear status dos convites para cada membro
        const mappedMembers = membersData.map((member: any) => {
          const invitation = eventData.invitations.find(
            (inv: any) => inv.userId === member.uid
          );
          
          return {
            ...member,
            isInvited: !!invitation,
            status: invitation?.status
          };
        });
        
        setMembers(mappedMembers);
        setFilteredMembers(mappedMembers);
        
        // Inicializar seleção com membros já convidados
        const invitedMembersIds = eventData.invitations.map((inv: any) => inv.userId);
        setSelectedMembersIds(invitedMembersIds);
        
      } catch (error) {
        console.error("Error fetching members:", error);
        Alert.alert('Erro', 'Não foi possível carregar os membros');
      }
      
    } catch (error) {
      console.error("Error fetching event:", error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do evento');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, getEventById, isCurrentUserCreator, router, user?.uid, user?.currentRepublicId]);
  
  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Filtrar membros quando a busca muda
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMembers(members);
      return;
    }
    
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = members.filter(member => 
      member.name.toLowerCase().includes(lowerQuery) || 
      (member.nickname && member.nickname.toLowerCase().includes(lowerQuery)) ||
      member.email.toLowerCase().includes(lowerQuery)
    );
    
    setFilteredMembers(filtered);
  }, [searchQuery, members]);
  
  // Membros não convidados e convidados
  const notInvitedMembers = useMemo(() => {
    return filteredMembers.filter(member => !member.isInvited);
  }, [filteredMembers]);
  
  const invitedMembers = useMemo(() => {
    return filteredMembers.filter(member => member.isInvited);
  }, [filteredMembers]);
  
  // Alternar seleção de membro
  const toggleMemberSelection = useCallback((memberId: string) => {
    setSelectedMembersIds(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  }, []);
  
  // Convidar membros selecionados
  const handleInviteMembers = useCallback(async () => {
    if (!id || !event) return;
    
    try {
      setActionLoading(true);
      
      // Filtrar apenas IDs que não estão na lista de convites
      const newInvitees = selectedMembersIds.filter(memberId => 
        !event.invitations?.some(inv => inv.userId === memberId)
      );
      
      if (newInvitees.length === 0) {
        Alert.alert('Info', 'Nenhum novo membro para convidar');
        setActionLoading(false);
        return;
      }
      
      await inviteUsers(parseInt(id), newInvitees);
      
      // Recarregar dados após convidar
      await fetchData();
      
      Alert.alert(
        'Sucesso',
        `${newInvitees.length} ${newInvitees.length === 1 ? 'membro convidado' : 'membros convidados'} com sucesso!`
      );
      
    } catch (error) {
      console.error('Error inviting members:', error);
      Alert.alert('Erro', 'Não foi possível enviar os convites. Tente novamente.');
    } finally {
      setActionLoading(false);
    }
  }, [id, event, selectedMembersIds, inviteUsers, fetchData]);
  
  // Alterar status de um convite
  const handleUpdateInvitationStatus = useCallback(async (userId: string, status: 'CONFIRMED' | 'DECLINED' | 'INVITED') => {
    if (!id) return;
    
    try {
      setActionLoading(true);
      
      await updateInvitationStatus(id, userId, status);
      
      // Recarregar dados após atualizar status
      await fetchData();
      
      Alert.alert(
        'Sucesso',
        'Status do convite atualizado com sucesso!'
      );
      
    } catch (error) {
      console.error('Error updating invitation status:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o status do convite. Tente novamente.');
    } finally {
      setActionLoading(false);
    }
  }, [id, updateInvitationStatus, fetchData]);
  
  // Renderizar item de membro para lista de não convidados
  const renderNewMemberItem = useCallback(({ item }: { item: Member }) => {
    const isSelected = selectedMembersIds.includes(item.uid);
    const displayName = item.nickname || item.name;
    
    return (
      <TouchableOpacity
        style={[
          eventsStyles.memberItem,
          isSelected && eventsStyles.selectedMemberItem
        ]}
        onPress={() => toggleMemberSelection(item.uid)}
        disabled={actionLoading}
        activeOpacity={0.7}
      >
        <View style={eventsStyles.memberInfoContainer}>
          {item.profilePictureUrl ? (
            <Image 
              source={{ uri: item.profilePictureUrl }} 
              style={[
                eventsStyles.memberAvatar,
                isSelected && styles.selectedMemberAvatar
              ]}
            />
          ) : (
            <View style={[
              eventsStyles.memberAvatarPlaceholder,
              isSelected && styles.selectedMemberAvatar
            ]}>
              <Text style={eventsStyles.memberInitials}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          
          <View style={eventsStyles.memberTextInfo}>
            <Text style={[
              eventsStyles.memberName,
              isSelected && styles.selectedMemberText
            ]}>
              {displayName}
              {item.uid === user?.uid ? ' (Você)' : ''}
            </Text>
            <Text style={eventsStyles.memberEmail}>{item.email}</Text>
          </View>
        </View>
        
        <View style={eventsStyles.memberStatusContainer}>
          <View style={[
            eventsStyles.checkboxContainer,
            isSelected && eventsStyles.checkboxSelected
          ]}>
            {isSelected && (
              <Ionicons name="checkmark" size={18} color="#fff" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [selectedMembersIds, toggleMemberSelection, user?.uid, actionLoading]);
  
  // Renderizar item de membro para lista de convidados
  const renderInvitedMemberItem = useCallback(({ item }: { item: Member }) => {
    const displayName = item.nickname || item.name;
    
    // Componente para renderizar o status do convite
    const renderStatusBadge = () => {
      switch (item.status) {
        case 'CONFIRMED':
          return (
            <View style={[sharedStyles.badge, sharedStyles.confirmedBadge]}>
              <Text style={[sharedStyles.badgeText, sharedStyles.confirmedText]}>Confirmado</Text>
            </View>
          );
        case 'DECLINED':
          return (
            <View style={[sharedStyles.badge, sharedStyles.cancelledBadge]}>
              <Text style={[sharedStyles.badgeText, sharedStyles.cancelledText]}>Recusado</Text>
            </View>
          );
        default: // 'INVITED'
          return (
            <View style={[sharedStyles.badge, sharedStyles.pendingBadge]}>
              <Text style={[sharedStyles.badgeText, sharedStyles.pendingText]}>Convidado</Text>
            </View>
          );
      }
    };
    
    return (
      <View style={eventsStyles.memberItem}>
        <View style={eventsStyles.memberInfoContainer}>
          {item.profilePictureUrl ? (
            <Image 
              source={{ uri: item.profilePictureUrl }} 
              style={eventsStyles.memberAvatar}
            />
          ) : (
            <View style={eventsStyles.memberAvatarPlaceholder}>
              <Text style={eventsStyles.memberInitials}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          
          <View style={eventsStyles.memberTextInfo}>
            <Text style={eventsStyles.memberName}>
              {displayName}
              {item.uid === user?.uid ? ' (Você)' : ''}
            </Text>
            <Text style={eventsStyles.memberEmail}>{item.email}</Text>
          </View>
        </View>
        
        <View style={eventsStyles.memberStatusContainer}>
          {renderStatusBadge()}
        </View>
      </View>
    );
  }, [user?.uid]);
  
  // Renderizar estado vazio
  const renderEmptyState = useCallback(() => {
    if (loading) {
      return (
        <View style={sharedStyles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={sharedStyles.loadingText}>Carregando membros...</Text>
        </View>
      );
    }
    
    if (tab === 'invited' && invitedMembers.length === 0) {
      return (
        <View style={sharedStyles.emptyContainer}>
          <Ionicons name="people" size={56} color={colors.primary.main} style={{ opacity: 0.6 }} />
          <Text style={[sharedStyles.emptyText, { marginTop: 16 }]}>
            Nenhum membro convidado para este evento
          </Text>
          <TouchableOpacity 
            style={[sharedStyles.button, { marginTop: 24 }]}
            onPress={() => setTab('new')}
          >
            <Ionicons name="person-add" size={20} color={colors.text.primary} style={sharedStyles.buttonIcon} />
            <Text style={sharedStyles.buttonText}>Convidar Membros</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (tab === 'new' && notInvitedMembers.length === 0) {
      return (
        <View style={sharedStyles.emptyContainer}>
          <Ionicons name="checkmark-circle" size={56} color="#4CAF50" style={{ opacity: 0.6 }} />
          <Text style={[sharedStyles.emptyText, { marginTop: 16 }]}>
            Todos os membros já foram convidados!
          </Text>
          <Text style={{ color: '#aaa', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
            Você pode gerenciar os convites existentes na aba "Convidados".
          </Text>
          <TouchableOpacity 
            style={[sharedStyles.button, { marginTop: 24 }]}
            onPress={() => setTab('invited')}
          >
            <Ionicons name="people" size={20} color={colors.text.primary} style={sharedStyles.buttonIcon} />
            <Text style={sharedStyles.buttonText}>Ver Convidados</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (searchQuery && filteredMembers.length === 0) {
      return (
        <View style={sharedStyles.emptyContainer}>
          <Ionicons name="search" size={56} color={colors.primary.main} style={{ opacity: 0.6 }} />
          <Text style={[sharedStyles.emptyText, { marginTop: 16 }]}>
            Nenhum membro encontrado com "{searchQuery}"
          </Text>
          <TouchableOpacity 
            style={[sharedStyles.button, { marginTop: 24 }]}
            onPress={() => setSearchQuery('')}
          >
            <Ionicons name="close-circle" size={20} color={colors.text.primary} style={sharedStyles.buttonIcon} />
            <Text style={sharedStyles.buttonText}>Limpar Busca</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return null;
  }, [loading, tab, invitedMembers.length, notInvitedMembers.length, searchQuery, filteredMembers.length]);
  
  if (loading && !event) {
    return (
      <SafeAreaView style={sharedStyles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />
        <View style={sharedStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={sharedStyles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={sharedStyles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />
      
      <View style={sharedStyles.container}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#7B68EE" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gerenciar Convidados</Text>
        </View>
        
        <Animated.View style={[{ padding: 16, opacity: fadeAnim }]}>
          {event && (
            <View style={sharedStyles.card}>
              <Text style={sharedStyles.cardTitle} numberOfLines={1}>{event.title}</Text>
            </View>
          )}
          
          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabButton, tab === 'invited' && styles.activeTab]}
              onPress={() => setTab('invited')}
            >
              <Text style={[styles.tabText, tab === 'invited' && styles.activeTabText]}>
                Convidados ({invitedMembers.length})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tabButton, tab === 'new' && styles.activeTab]}
              onPress={() => setTab('new')}
            >
              <Text style={[styles.tabText, tab === 'new' && styles.activeTabText]}>
                Convidar ({notInvitedMembers.length})
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Barra de pesquisa */}
          <View style={[
            sharedStyles.searchContainer,
            searchFocused && { borderColor: colors.primary.main }
          ]}>
            <Ionicons name="search" size={20} color={colors.primary.main} style={{ marginRight: 10 }} />
            <TextInput
              style={sharedStyles.searchInput}
              placeholder="Buscar membro por nome ou email"
              placeholderTextColor={colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={{ padding: 4 }}
                onPress={() => setSearchQuery('')}
              >
                <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Contador de seleção (apenas na aba de convidar) */}
          {tab === 'new' && notInvitedMembers.length > 0 && (
            <View style={styles.selectionCountContainer}>
              <Text style={styles.selectionCountText}>
                {selectedMembersIds.filter(id => 
                  !event?.invitations.some(inv => inv.userId === id)
                ).length} membros selecionados
              </Text>
              {selectedMembersIds.filter(id => 
                !event?.invitations.some(inv => inv.userId === id)
              ).length > 0 && (
                <TouchableOpacity
                  style={styles.clearSelectionButton}
                  onPress={() => setSelectedMembersIds([])}
                >
                  <Text style={styles.clearSelectionText}>Limpar seleção</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Animated.View>
        
        {/* Lista de membros */}
        {tab === 'invited' ? (
          <FlatList
            data={invitedMembers}
            renderItem={renderInvitedMemberItem}
            keyExtractor={(item) => item.uid}
            contentContainerStyle={{ padding: 16, paddingTop: 0 }}
            ListEmptyComponent={renderEmptyState}
          />
        ) : (
          <>
            <FlatList
              data={notInvitedMembers}
              renderItem={renderNewMemberItem}
              keyExtractor={(item) => item.uid}
              contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 150 }}
              ListEmptyComponent={renderEmptyState}
            />
            
            {notInvitedMembers.length > 0 && (
              <View style={styles.bottomButtonContainer}>
                <TouchableOpacity 
                  style={[
                    styles.inviteButton,
                    (actionLoading || selectedMembersIds.filter(id => 
                      !event?.invitations.some(inv => inv.userId === id)
                    ).length === 0) && styles.inviteButtonDisabled
                  ]}
                  onPress={handleInviteMembers}
                  disabled={actionLoading || selectedMembersIds.filter(id => 
                    !event?.invitations.some(inv => inv.userId === id)
                  ).length === 0}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="mail" size={22} color="#fff" style={{ marginRight: 10 }} />
                      <Text style={styles.inviteButtonText}>
                        Convidar {selectedMembersIds.filter(id => 
                          !event?.invitations.some(inv => inv.userId === id)
                        ).length} {selectedMembersIds.filter(id => 
                          !event?.invitations.some(inv => inv.userId === id)
                        ).length === 1 ? 'Membro' : 'Membros'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.background.tertiary,
  },
  activeTab: {
    borderBottomColor: colors.primary.main,
  },
  tabText: {
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary.main,
    fontWeight: 'bold',
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 30,
    backgroundColor: 'rgba(34, 34, 34, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#444',
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    zIndex: 1000
  },
  selectionCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  selectionCountText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  clearSelectionButton: {
    padding: 4,
  },
  clearSelectionText: {
    color: colors.primary.main,
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectedMemberAvatar: {
    borderWidth: 2,
    borderColor: colors.primary.main,
  },
  selectedMemberText: {
    color: colors.primary.main,
    fontWeight: 'bold',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B68EE',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#7B68EE',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  inviteButtonDisabled: {
    backgroundColor: 'rgba(123, 104, 238, 0.5)',
    shadowOpacity: 0,
    elevation: 0,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default InvitationsScreen;