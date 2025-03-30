import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '@/src/services/api';
import { colors } from '@/src/styles/sharedStyles';
import { useAuth } from '@/src/context/AuthContext';

// Interfaces
interface Member {
  uid: string;
  name: string;
  nickname?: string;
  email: string;
  profilePictureUrl?: string;
}

interface InviteUsersSectionProps {
  republicId: string;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

const InviteUsersSection: React.FC<InviteUsersSectionProps> = ({
  republicId,
  selectedIds,
  onSelectionChange
}) => {
  // Estados
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const { user } = useAuth();
  
  // Carregar membros da república
  useEffect(() => {
    if (!republicId) return;

    const fetchMembers = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/v1/republics/${republicId}/members`);
        // Ensure we're dealing with an array
        const memberData = Array.isArray(response.data) ? response.data : [];
        
        // Filtrar o usuário atual da lista de membros para convite
        const filteredData = memberData.filter(member => member.uid !== user?.uid);
        
        setMembers(filteredData);
        setFilteredMembers(filteredData);
      } catch (error) {
        console.error('Erro ao carregar membros:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [republicId, user?.uid]);

  // Filtrar membros ao digitar na busca
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMembers(members);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = members.filter(member => {
      const nameMatch = member.name?.toLowerCase().includes(query);
      const nicknameMatch = member.nickname?.toLowerCase().includes(query);
      const emailMatch = member.email?.toLowerCase().includes(query);
      return nameMatch || nicknameMatch || emailMatch;
    });

    setFilteredMembers(filtered);
  }, [searchQuery, members]);

  // Toggles para seleção de membros
  const toggleMember = (memberId: string) => {
    if (selectedIds.includes(memberId)) {
      onSelectionChange(selectedIds.filter(id => id !== memberId));
    } else {
      onSelectionChange([...selectedIds, memberId]);
    }
  };

  // Nome de exibição para o membro (nickname ou primeiro nome)
  const getDisplayName = (member: Member) => {
    if (member.nickname) return member.nickname;
    return member.name.split(' ')[0];
  };

  // Função para limpar todos os participantes selecionados
  const clearAllSelected = () => {
    onSelectionChange([]);
  };

  // Função para selecionar todos os participantes
  const selectAllMembers = () => {
    const allIds = members.map(member => member.uid);
    onSelectionChange(allIds);
  };

  // Renderização de cada item de membro
  const renderMemberItem = ({ item }: { item: Member }) => {
    const isSelected = selectedIds.includes(item.uid);
    
    return (
      <TouchableOpacity
        style={[
          styles.memberItem,
          isSelected && styles.memberItemSelected
        ]}
        onPress={() => toggleMember(item.uid)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {item.profilePictureUrl ? (
            <Image
              source={{ uri: item.profilePictureUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Informações */}
        <View style={styles.memberInfo}>
          <Text style={styles.memberName} numberOfLines={1}>
            {getDisplayName(item)}
          </Text>
          <Text style={styles.memberEmail} numberOfLines={1}>
            {item.email}
          </Text>
        </View>

        {/* Checkbox */}
        <View style={[
          styles.checkbox,
          isSelected && styles.checkboxSelected
        ]}>
          {isSelected && (
            <Ionicons name="checkmark" size={16} color="#fff" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Resumo dos membros selecionados para exibir no cabeçalho
  const getSelectionSummary = () => {
    if (selectedIds.length === 0) {
      return "Ninguém selecionado";
    } else if (selectedIds.length === members.length) {
      return "Todos selecionados";
    } else {
      return `${selectedIds.length} ${selectedIds.length === 1 ? 'membro' : 'membros'}`;
    }
  };

  return (
    <View style={[
      styles.container,
      { maxHeight: expanded ? 320 : 56 }
    ]}>
      {/* Cabeçalho */}
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="people" size={20} color={colors.primary.main} />
          <Text style={styles.headerTitle}>Convidar Participantes</Text>
        </View>
        
        <View style={styles.headerRight}>
          {selectedIds.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{selectedIds.length.toString()}</Text>
            </View>
          )}
          <Ionicons 
            name={expanded ? "chevron-up" : "chevron-down"} 
            size={22} 
            color="#BBBBBB" 
          />
        </View>
      </TouchableOpacity>
      
      {/* Conteúdo expandido */}
      {expanded && (
        <View style={styles.content}>
          {/* Barra de busca */}
          <View style={styles.searchBarContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#999999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar membros..."
                placeholderTextColor="#999999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#999999" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Botões de ação rápida */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={selectAllMembers}
              >
                <Text style={styles.actionButtonText}>Todos</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.clearButton]}
                onPress={clearAllSelected}
                disabled={selectedIds.length === 0}
              >
                <Text style={[
                  styles.actionButtonText, 
                  selectedIds.length === 0 && styles.disabledText
                ]}>Limpar</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Lista de membros */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary.main} size="large" />
              <Text style={styles.loadingText}>Carregando membros...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredMembers}
              renderItem={renderMemberItem}
              keyExtractor={(item) => item.uid}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="search" size={30} color="#999" />
                  <Text style={styles.emptyText}>
                    {searchQuery ? "Nenhum membro encontrado" : "Nenhum membro disponível"}
                  </Text>
                </View>
              }
              style={styles.list}
              // Removed contentContainerStyle with nested objects
              contentContainerStyle={filteredMembers.length === 0 ? {justifyContent: 'center'} : undefined}
              // Add nestedScrollEnabled to prevent issues with nested ScrollView
              nestedScrollEnabled={true}
            />
          )}
          
          {/* Resumo na parte inferior */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{getSelectionSummary()}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: colors.primary.main,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    maxHeight: 264, // 320 - 56 (altura do header)
  },
  searchBarContainer: {
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
    padding: 0,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: colors.primary.light,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  clearButton: {
    backgroundColor: 'rgba(255, 99, 71, 0.15)',
  },
  actionButtonText: {
    color: colors.primary.main,
    fontSize: 12,
    fontWeight: '500',
  },
  disabledText: {
    opacity: 0.5,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    minHeight: 150,
  },
  loadingText: {
    color: '#BBBBBB',
    marginTop: 8,
    fontSize: 14,
  },
  list: {
    height: 150,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  memberItemSelected: {
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
    borderColor: colors.primary.main,
    borderWidth: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  memberEmail: {
    color: '#BBBBBB',
    fontSize: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#666666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 150,
  },
  emptyText: {
    color: '#BBBBBB',
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#3A3A3A',
    paddingTop: 12,
    marginTop: 8,
  },
  footerText: {
    color: '#BBBBBB',
    fontSize: 14,
    textAlign: 'center',
  }
});

export default InviteUsersSection;