import React, { useState, useEffect, useCallback } from 'react';
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
  TextInput,
  Image,
  Share
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import api from '../../../src/services/api';
import { ErrorHandler } from '../../../src/utils/errorHandling';
import * as Haptics from 'expo-haptics';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

// Tipo de Membro da República (UserResponse)
interface RepublicMember {
  uid: string;
  name: string;
  nickname?: string;
  email: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  currentRepublicId?: string;
  currentRepublicName?: string;
  isAdmin: boolean;
  createdAt: string;
  lastLogin?: string;
  status?: string;
  firebaseUid?: string;
  provider?: string;
  entryDate?: string;
  departureDate?: string;
}

const MembersSettingsScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  // Estados
  const [members, setMembers] = useState<RepublicMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<RepublicMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inviteCode, setInviteCode] = useState<string>('');
  const [republicOwnerId, setRepublicOwnerId] = useState<string | null>(null);
  
  // Identificar o dono da república baseado no ownerId recebido da API
  const isOwner = user && republicOwnerId && user.uid === republicOwnerId;
  
  // Verificar se o usuário atual é admin (incluindo owner)
  const canManageUsers = user && (
    (isOwner) || // É o dono
    members.find(member => member.uid === user.uid && member.isAdmin === true) // É admin
  );

  // Buscar membros da república e o código de convite
  const fetchMembersAndInviteCode = useCallback(async () => {
    if (!user?.currentRepublicId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Buscar membros
      const membersResponse = await api.get<RepublicMember[]>(`/api/v1/republics/${user.currentRepublicId}/members`);
      const membersData = membersResponse.data;
      
      setMembers(membersData);
      setFilteredMembers(membersData);
      
      // Buscar dados da república para obter código e ownerId
      const republicResponse = await api.get(`/api/v1/republics/${user.currentRepublicId}`);
      console.log('Resposta completa da república:', republicResponse.data);
      
      // Salvar o ID do dono da república
      if (republicResponse.data && republicResponse.data.ownerId) {
        setRepublicOwnerId(republicResponse.data.ownerId);
        console.log('ID do dono da república:', republicResponse.data.ownerId);
      } else {
        console.error('ID do dono da república não encontrado na resposta:', republicResponse.data);
      }
      
      // Acessando o código da república
      if (republicResponse.data && republicResponse.data.code) {
        setInviteCode(republicResponse.data.code);
      } else {
        console.error('Código da república não encontrado na resposta:', republicResponse.data);
      }
      
    } catch (error) {
      const parsedError = await ErrorHandler.parseError(error);
      setError(parsedError.message);
      ErrorHandler.handle(error);
    } finally {
      setLoading(false);
    }
  }, [user?.currentRepublicId, user?.uid]);
  
  useEffect(() => {
    fetchMembersAndInviteCode();
  }, [fetchMembersAndInviteCode]);
  
  // Filtragem de membros
  useEffect(() => {
    if (searchQuery) {
      const filtered = members.filter(member => 
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.nickname && member.nickname.toLowerCase().includes(searchQuery.toLowerCase())) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(members);
    }
  }, [searchQuery, members]);
  
  // Modificar o papel de um membro
  const handleChangeRole = async (memberId: string, makeAdmin: boolean) => {
    if (!isOwner) {
      Alert.alert('Permissão Negada', 'Apenas o dono da república pode promover membros a administradores.');
      return;
    }
    
    if (!canManageUsers) {
      Alert.alert('Permissão Negada', 'Você não tem permissão para gerenciar funções de membros.');
      return;
    }
    
    try {
      const actionText = makeAdmin ? 'promover' : 'rebaixar';
      
      Alert.alert(
        'Confirmar Ação',
        `Tem certeza que deseja ${actionText} este membro?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Confirmar',
            onPress: async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              
              // Usar a API correta para adicionar ou remover administradores
              let response;
              if (makeAdmin) {
                // Adicionar como administrador (POST para adicionar)
                response = await api.post(`/api/v1/republics/${user?.currentRepublicId}/members/${memberId}/admin`);
              } else {
                // Remover como administrador (DELETE para remover)
                response = await api.delete(`/api/v1/republics/${user?.currentRepublicId}/members/${memberId}/admin`);
              }
              
              if (response.status === 200) {
                // Atualizar a lista de membros
                setMembers(prevMembers => 
                  prevMembers.map(member => 
                    member.uid === memberId 
                      ? { ...member, isAdmin: makeAdmin } 
                      : member
                  )
                );
                
                const actionMessage = makeAdmin ? 'promovido a administrador' : 'alterado para membro regular';
                Alert.alert('Sucesso', `Membro ${actionMessage} com sucesso!`);
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erro ao alterar papel do membro:', error);
      ErrorHandler.handle(error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };
  
  // Remover um membro da república
  const handleRemoveMember = async (memberId: string) => {
    if (!canManageUsers) {
      Alert.alert('Permissão Negada', 'Você não tem permissão para remover membros.');
      return;
    }
    
    // Não permitir que o dono seja removido
    if (memberId === republicOwnerId) {
      Alert.alert('Operação Inválida', 'O dono da república não pode ser removido.');
      return;
    }
    
    try {
      Alert.alert(
        'Confirmar Remoção',
        'Tem certeza que deseja remover este membro da república? Esta ação não pode ser desfeita.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Remover',
            style: 'destructive',
            onPress: async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              
              const response = await api.delete(`/api/v1/republics/${user?.currentRepublicId}/members/${memberId}`);
              
              if (response.status === 204) {
                // Atualizar a lista de membros removendo o membro
                setMembers(prevMembers => prevMembers.filter(member => member.uid !== memberId));
                
                Alert.alert('Sucesso', 'Membro removido da república com sucesso!');
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            }
          }
        ]
      );
    } catch (error) {
      ErrorHandler.handle(error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };
  
  // Compartilhar código de convite
  const handleShareInviteCode = async () => {
    if (inviteCode) {
      try {
        await Share.share({
          message: `Entre na minha república no RepHelper usando o código: ${inviteCode}`,
        });
      } catch (error) {
        Alert.alert('Erro', 'Houve um erro ao compartilhar o código');
      }
    }
  };
  
  // Componente de renderização de membro
  const MemberItem = ({ member }: { member: RepublicMember }) => {
    const isCurrentUser = member.uid === user?.uid;
    const isMemberOwner = member.uid === republicOwnerId;
    
    const handleMemberPress = () => {
      // Apenas admins podem gerenciar membros
      if (!canManageUsers) return;
      
      // Não permitir gerenciar a si mesmo ou o dono (se não for o próprio dono)
      if (isCurrentUser || (isMemberOwner && !isOwner)) return;
      
      // Preparar as opções do menu com base nos privilégios
      const actionButtons = [];
      
      // Apenas donos podem promover/rebaixar membros
      if (isOwner && !isMemberOwner) {
        actionButtons.push({
          text: member.isAdmin ? 'Rebaixar para Membro' : 'Promover a Administrador',
          onPress: () => handleChangeRole(member.uid, !member.isAdmin)
        });
      }
      
      // Opção para remover membro (disponível para admin se não for o dono)
      if (!isMemberOwner) {
        actionButtons.push({
          text: 'Remover da República',
          style: 'destructive' as 'destructive',
          onPress: () => handleRemoveMember(member.uid)
        });
      }
      
      // Se não houver ações disponíveis, não mostrar o menu
      if (actionButtons.length === 0) return;
      
      // Mostrar opções de gestão
      Alert.alert(
        `Gerenciar ${member.nickname || member.name}`,
        `Função atual: ${isMemberOwner ? 'Proprietário' : member.isAdmin ? 'Administrador' : 'Membro'}`,
        [
          { text: 'Cancelar', style: 'cancel' },
          ...actionButtons
        ]
      );
    };
    
    const renderRightActions = () => {
      // Não mostrar ações para si mesmo, para o dono (exceto se for o próprio dono), ou se não tiver permissão
      if (isCurrentUser || (isMemberOwner && !isOwner) || !canManageUsers) {
        return null;
      }
      
      return (
        <View style={styles.rightActions}>
          {isOwner && !isMemberOwner && (
            <TouchableOpacity 
              style={[styles.actionButton, member.isAdmin ? styles.demoteButton : styles.promoteButton]}
              onPress={() => handleChangeRole(member.uid, !member.isAdmin)}
            >
              <Ionicons 
                name={member.isAdmin ? 'arrow-down' : 'arrow-up'} 
                size={24} 
                color="#fff" 
              />
              <Text style={styles.actionButtonText}>
                {member.isAdmin ? 'Rebaixar' : 'Promover'}
              </Text>
            </TouchableOpacity>
          )}
          
          {!isMemberOwner && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleRemoveMember(member.uid)}
            >
              <Ionicons name="trash" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Remover</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    };
    
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Swipeable
          renderRightActions={renderRightActions}
          overshootRight={false}
          containerStyle={styles.swipeableContainer}
        >
          <TouchableOpacity 
            style={styles.memberItem}
            onPress={handleMemberPress}
            activeOpacity={canManageUsers && !isCurrentUser && !isMemberOwner ? 0.7 : 1}
          >
            <View style={styles.memberAvatarContainer}>
              {member.profilePictureUrl ? (
                <Image source={{ uri: member.profilePictureUrl }} style={styles.memberAvatar} />
              ) : (
                <View style={[styles.memberAvatarPlaceholder, 
                  isMemberOwner
                    ? styles.ownerAvatarBackground
                    : member.isAdmin 
                    ? styles.adminAvatarBackground
                    : styles.memberAvatarBackground
                ]}>
                  <Text style={styles.memberAvatarText}>
                    {member.nickname 
                      ? member.nickname[0].toUpperCase() 
                      : member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </Text>
                </View>
              )}
              
              {/* Mostrar badge de proprietário ou admin */}
              {(isMemberOwner || member.isAdmin) && (
                <View style={[styles.roleBadge, 
                  isMemberOwner ? styles.ownerBadge : styles.adminBadge
                ]}>
                  <MaterialIcons 
                    name={isMemberOwner ? "star" : "security"} 
                    size={12} 
                    color="#fff" 
                  />
                </View>
              )}
            </View>
            
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>
                {member.nickname || member.name}
                {isCurrentUser && <Text style={styles.currentUserText}> (Você)</Text>}
              </Text>
              <Text style={styles.memberEmail}>{member.email}</Text>
              <Text style={styles.memberRole}>
                {isMemberOwner ? 'Proprietário' : member.isAdmin ? 'Administrador' : 'Membro'}
              </Text>
              
              {/* Adicionando a data de entrada para todos, mas com uma string vazia se não existir 
                  para manter o layout consistente */}
              <Text style={styles.memberDate}>
                {member.entryDate ? `Desde: ${new Date(member.entryDate).toLocaleDateString()}` : ' '}
              </Text>
            </View>
            
            {/* Indicador de ação disponível para admins/owner que podem gerenciar este membro */}
            {canManageUsers && !isCurrentUser && (!isMemberOwner || isOwner) && (
              <Ionicons name="chevron-forward" size={20} color="#666" />
            )}
          </TouchableOpacity>
        </Swipeable>
      </GestureHandlerRootView>
    );
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Membros da República</Text>
          <Text style={styles.headerSubtitle}>
            {members.length} {members.length === 1 ? 'membro' : 'membros'} na república
          </Text>
        </View>
        
        {/* Barra de pesquisa */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#7B68EE" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar membro..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        {/* Código de convite para admins/donos */}
        {(isOwner || canManageUsers) && inviteCode && (
          <View style={styles.inviteCodeContainer}>
            <View style={styles.inviteCodeContent}>
              <Text style={styles.inviteCodeLabel}>Código para convidar novos membros:</Text>
              <Text style={styles.inviteCode}>{inviteCode}</Text>
            </View>
            <TouchableOpacity style={styles.shareButton} onPress={handleShareInviteCode}>
              <Ionicons name="share-social" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Mensagem de carregamento ou erro */}
        {loading ? (
          <View style={styles.centeredContainer}>
            <ActivityIndicator size="large" color="#7B68EE" />
            <Text style={styles.loadingText}>Carregando membros...</Text>
          </View>
        ) : error ? (
          <View style={styles.centeredContainer}>
            <Ionicons name="alert-circle" size={48} color="#FF6347" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchMembersAndInviteCode}>
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Lista de membros */}
            {filteredMembers.length > 0 ? (
              <ScrollView style={styles.membersList}>
                {filteredMembers.map((member) => (
                  <MemberItem key={member.uid} member={member} />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.centeredContainer}>
                <Ionicons name="people" size={48} color="#666" />
                <Text style={styles.emptyText}>
                  {searchQuery 
                    ? 'Nenhum membro encontrado para esta pesquisa' 
                    : 'Nenhum membro encontrado na república'}
                </Text>
              </View>
            )}
          </>
        )}
      </View>
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
  header: {
    padding: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#aaa',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    padding: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    padding: 0,
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    padding: 16,
  },
  inviteCodeContent: {
    flex: 1,
  },
  inviteCodeLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 4,
  },
  inviteCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7B68EE',
    letterSpacing: 1,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7B68EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  membersList: {
    flex: 1,
  },
  swipeableContainer: {
    backgroundColor: '#333',
  },
  memberItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    backgroundColor: '#333',
  },
  memberAvatarContainer: {
    position: 'relative',
    marginRight: 16,
    width: 50,
    height: 50,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  memberAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarBackground: {
    backgroundColor: '#555',
  },
  adminAvatarBackground: {
    backgroundColor: '#4A90E2',
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  roleBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: '#4A90E2',
    zIndex: 1,
  },
  memberInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  currentUserText: {
    fontStyle: 'italic',
    color: '#7B68EE',
  },
  memberEmail: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 4,
  },
  memberRole: {
    fontSize: 12,
    color: '#7B68EE',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    height: '100%',
  },
  promoteButton: {
    backgroundColor: '#4CAF50',
  },
  demoteButton: {
    backgroundColor: '#FF9800',
  },
  deleteButton: {
    backgroundColor: '#FF5252',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#aaa',
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    color: '#FF6347',
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    color: '#aaa',
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#7B68EE',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  memberDate: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  ownerAvatarBackground: {
    backgroundColor: '#F5A623',
  },
  ownerBadge: {
    backgroundColor: '#F5A623',
  },
  adminBadge: {
    backgroundColor: '#4A90E2',
  },
});

export default MembersSettingsScreen; 