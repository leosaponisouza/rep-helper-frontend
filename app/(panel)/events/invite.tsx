// app/(panel)/events/invite.tsx
import React, { useState, useEffect } from 'react';
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
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEvents, Event } from '../../../src/hooks/useEvents';
import { useAuth } from '../../../src/context/AuthContext';
import api from '../../../src/services/api';
import { ErrorHandler } from '../../../src/utils/errorHandling';

interface Member {
  uid: string;
  name: string;
  nickname?: string;
  email: string;
  profilePictureUrl?: string;
  isInvited: boolean;
}

// Import the EventInvitation type from useEvents.ts
import { EventInvitation } from '../../../src/hooks/useEvents';

// Update the interface to match useEvents.ts definition
interface EventWithInvitations extends Event {
  invitations: EventInvitation[];
}

const InviteMembersScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { isCurrentUserCreator, inviteUsers } = useEvents();
  
  const [event, setEvent] = useState<EventWithInvitations | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [selectedMembersIds, setSelectedMembersIds] = useState<string[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  
  // Fetch event data and republic members
  useEffect(() => {
    const fetchData = async () => {
      if (!id || !user?.currentRepublicId) return;
      
      try {
        setLoading(true);
        
        // Fetch event data
        const eventResponse = await api.get(`/api/v1/events/${id}`);
        const eventData = eventResponse.data;
        
        // Ensure invitations is always an array
        if (!eventData.invitations) {
          eventData.invitations = [];
        }
        
        // Check if user is the creator to manage permissions
        if (!isCurrentUserCreator(eventData)) {
          Alert.alert('Error', 'You do not have permission to manage invitations for this event');
          router.back();
          return;
        }
        
        setEvent(eventData);
        
        // Fetch republic members
        const membersResponse = await api.get(`/api/v1/republics/${user.currentRepublicId}/members`);
        const membersData = membersResponse.data;
        
        // Map invitation status for each member
        const mappedMembers = membersData.map((member: any) => {
          const isInvited = eventData.invitations?.some(
            (inv: any) => inv.userId === member.uid
          );
          
          return {
            ...member,
            isInvited: !!isInvited // Ensure boolean value
          };
        });
        
        setMembers(mappedMembers);
        setFilteredMembers(mappedMembers);
        
        // Initialize selection with already invited members
        const invitedMembersIds = eventData.invitations.map((inv: any) => inv.userId);
        setSelectedMembersIds(invitedMembersIds);
        
      } catch (error) {
        console.error("Error fetching data:", error);
        ErrorHandler.handle(error);
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user?.currentRepublicId]);
  
  // Filter members when search query changes
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
  
  // Toggle member selection
  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembersIds(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };
  
  // Invite selected members
  const handleInviteMembers = async () => {
    if (!id || !event) return;
    
    try {
      setInviting(true);
      
      // Only send IDs that are not already in the invitation list
      const newInvitees = selectedMembersIds.filter(memberId => 
        !event.invitations?.some(inv => inv.userId === memberId)
      );
      
      if (newInvitees.length === 0) {
        Alert.alert('Info', 'No new members to invite');
        setInviting(false);
        return;
      }
      
      // Make sure to use the correct ID format that your API expects
      // If it expects a number, parse it, otherwise use it as a string
      const eventId = parseInt(id);
      await inviteUsers(eventId, newInvitees);
      
      Alert.alert(
        'Success',
        `${newInvitees.length} member(s) invited successfully!`,
        [
          {
            text: 'OK',
            onPress: () => router.push(`/(panel)/events/${id}`)
          }
        ]
      );
    } catch (error) {
      console.error('Error inviting members:', error);
      Alert.alert('Error', 'Could not send invitations. Please try again.');
    } finally {
      setInviting(false);
    }
  };
  
  // Render member item
  const renderMemberItem = ({ item }: { item: Member }) => {
    const isSelected = selectedMembersIds.includes(item.uid);
    const displayName = item.nickname || item.name;
    
    return (
      <TouchableOpacity
        style={[
          styles.memberItem,
          isSelected && styles.selectedMemberItem
        ]}
        onPress={() => toggleMemberSelection(item.uid)}
      >
        <View style={styles.memberInfoContainer}>
          {item.profilePictureUrl ? (
            <Image 
              source={{ uri: item.profilePictureUrl }} 
              style={styles.memberAvatar}
            />
          ) : (
            <View style={styles.memberAvatarPlaceholder}>
              <Text style={styles.memberInitials}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          
          <View style={styles.memberTextInfo}>
            <Text style={styles.memberName}>
              {displayName}
              {item.uid === user?.uid ? ' (You)' : ''}
            </Text>
            <Text style={styles.memberEmail}>{item.email}</Text>
          </View>
        </View>
        
        <View style={styles.memberStatusContainer}>
          {item.isInvited ? (
            <View style={styles.invitedBadge}>
              <Text style={styles.invitedText}>Invited</Text>
            </View>
          ) : (
            <View style={[
              styles.checkboxContainer,
              isSelected && styles.checkboxSelected
            ]}>
              {isSelected && (
                <Ionicons name="checkmark" size={18} color="#fff" />
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#222" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B68EE" />
          <Text style={styles.loadingText}>Loading members...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#7B68EE" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite Members</Text>
      </View>
      
      <View style={styles.container}>
        {event && (
          <View style={styles.eventInfoContainer}>
            <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
          </View>
        )}
        
        <View style={[
          styles.searchContainer,
          searchFocused && styles.searchContainerFocused
        ]}>
          <Ionicons name="search" size={20} color="#7B68EE" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search member"
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={20} color="#aaa" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionCount}>
            {selectedMembersIds.length} member(s) selected
          </Text>
        </View>
        
        <FlatList
          data={filteredMembers}
          renderItem={renderMemberItem}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.membersList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="people" size={50} color="#7B68EE" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No members found' : 'No members available'}
              </Text>
            </View>
          )}
        />
        
        <TouchableOpacity
          style={[
            styles.inviteButton,
            (inviting || selectedMembersIds.length === 0) && styles.buttonDisabled
          ]}
          onPress={handleInviteMembers}
          disabled={inviting || selectedMembersIds.length === 0}
        >
          {inviting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="mail" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.inviteButtonText}>Invite Selected Members</Text>
            </>
          )}
        </TouchableOpacity>
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
    padding: 16,
  },
  headerContainer: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  eventInfoContainer: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  searchContainerFocused: {
    borderColor: '#7B68EE',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  selectionInfo: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  selectionCount: {
    color: '#ccc',
    fontSize: 14,
  },
  membersList: {
    paddingBottom: 20,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  selectedMemberItem: {
    borderColor: '#7B68EE',
    backgroundColor: 'rgba(123, 104, 238, 0.1)',
  },
  memberInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  memberAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7B68EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInitials: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  memberTextInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 12,
    color: '#ccc',
  },
  memberStatusContainer: {
    marginLeft: 10,
  },
  invitedBadge: {
    backgroundColor: 'rgba(123, 104, 238, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  invitedText: {
    color: '#7B68EE',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#7B68EE',
    borderColor: '#7B68EE',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  inviteButton: {
    flexDirection: 'row',
    backgroundColor: '#7B68EE',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#7B68EE',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#5a5a5a',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonIcon: {
    marginRight: 8,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default InviteMembersScreen;