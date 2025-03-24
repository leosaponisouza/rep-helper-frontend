// components/TaskEdit/UserAssignmentSection.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface User {
  uid: string;
  name: string;
  nickname?: string;
  email: string;
  profilePictureUrl?: string;
}

interface UserAssignmentSectionProps {
  selectedUsers: string[];
  availableUsers: User[];
  currentUserId?: string;
  onChangeSelectedUsers: (users: string[]) => void;
}

const UserAssignmentSection: React.FC<UserAssignmentSectionProps> = ({
  selectedUsers,
  availableUsers,
  currentUserId,
  onChangeSelectedUsers,
}) => {
  const [isUserModalVisible, setUserModalVisible] = useState(false);

  const toggleUserSelection = (userId: string) => {
    const userIdStr = String(userId);
    onChangeSelectedUsers(
      selectedUsers.includes(userIdStr)
        ? selectedUsers.filter(id => id !== userIdStr)
        : [...selectedUsers, userIdStr]
    );
  };

  const renderUserSelectionModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={isUserModalVisible}
        onRequestClose={() => setUserModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Responsáveis</Text>
              <Text style={styles.modalSubtitle}>
                Selecione os usuários responsáveis pela tarefa
              </Text>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              {availableUsers.map(availableUser => {
                const userId = String(availableUser.uid);
                const isSelected = selectedUsers.includes(userId);
                const isCurrentUser = currentUserId && userId === String(currentUserId);
                
                return (
                  <TouchableOpacity
                    key={userId}
                    style={[
                      styles.userSelectItem,
                      isSelected && styles.selectedUserItem,
                      isCurrentUser && styles.currentUserItem
                    ]}
                    onPress={() => toggleUserSelection(userId)}
                  >
                    <View style={styles.userSelectLeftContent}>
                      {availableUser.profilePictureUrl ? (
                        <Image 
                          source={{ uri: availableUser.profilePictureUrl }} 
                          style={styles.userAvatar}
                        />
                      ) : (
                        <View style={[
                          styles.userAvatarPlaceholder,
                          isCurrentUser && styles.currentUserAvatarPlaceholder
                        ]}>
                          <Text style={styles.userInitials}>
                            {availableUser.name.substring(0, 2).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      
                      {isCurrentUser && (
                        <View style={styles.currentUserIndicator} />
                      )}
                      
                      <View style={styles.userInfo}>
                        <Text style={[
                          styles.userName,
                          isCurrentUser && styles.currentUserName
                        ]}>
                          {availableUser.nickname || availableUser.name} {isCurrentUser ? '(Você)' : ''}
                        </Text>
                        <Text style={styles.userEmail}>
                          {availableUser.email}
                        </Text>
                      </View>
                    </View>
                    
                    {isSelected ? (
                      <View style={styles.userSelectedCheckmark}>
                        <Ionicons name="checkmark-circle" size={24} color="#7B68EE" />
                      </View>
                    ) : (
                      <View style={styles.userUnselectedCheckmark}>
                        <Ionicons name="ellipse-outline" size={24} color="#aaa" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setUserModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={() => setUserModalVisible(false)}
              >
                <Text style={styles.modalConfirmButtonText}>
                  Confirmar ({selectedUsers.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Responsáveis</Text>
      <TouchableOpacity 
        style={styles.selectButton}
        onPress={() => setUserModalVisible(true)}
      >
        <View style={styles.selectButtonContent}>
          <View style={styles.selectButtonTextContainer}>
            <Text style={styles.selectButtonLabel}>Responsáveis</Text>
            <Text style={styles.selectButtonValue}>
              {selectedUsers.length > 0 
                ? `${selectedUsers.length} pessoa(s) selecionada(s)` 
                : 'Selecione os responsáveis'}
            </Text>
          </View>
          <Ionicons name="people" size={24} color="#7B68EE" />
        </View>
        
        {selectedUsers.length > 0 && (
          <View style={styles.selectedUsersPreview}>
            {availableUsers
              .filter(user => selectedUsers.includes(user.uid))
              .slice(0, 3)
              .map((user, index) => (
                <View 
                  key={user.uid} 
                  style={[
                    styles.userAvatarSmall, 
                    { marginLeft: index > 0 ? -10 : 0, zIndex: 10 - index }
                  ]}
                >
                  {user.profilePictureUrl ? (
                    <Image 
                      source={{ uri: user.profilePictureUrl }} 
                      style={styles.userAvatarSmallImage}
                    />
                  ) : (
                    <Text style={styles.userAvatarSmallInitials}>
                      {user.name.substring(0, 2).toUpperCase()}
                    </Text>
                  )}
                </View>
              ))}
              
            {selectedUsers.length > 3 && (
              <View style={[styles.userAvatarSmall, styles.moreBadge]}>
                <Text style={styles.moreBadgeText}>+{selectedUsers.length - 3}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>

      {renderUserSelectionModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginTop: 20,
  },
  inputLabel: {
    color: '#fff',
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '500',
  },
  selectButton: {
    backgroundColor: '#333',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444',
    overflow: 'hidden',
  },
  selectButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 16,
  },
  selectButtonTextContainer: {
    flex: 1,
  },
  selectButtonLabel: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 4,
  },
  selectButtonValue: {
    color: '#fff',
    fontSize: 16,
  },
  selectedUsersPreview: {
    flexDirection: 'row',
    padding: 12,
    paddingTop: 0,
    paddingLeft: 15,
  },
  userAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  userAvatarSmallImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  userAvatarSmallInitials: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  moreBadge: {
    backgroundColor: 'rgba(123, 104, 238, 0.3)',
  },
  moreBadgeText: {
    color: '#7B68EE',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#333',
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  modalSubtitle: {
    color: '#aaa',
    fontSize: 14,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  userSelectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  userSelectLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInitials: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  userEmail: {
    color: '#aaa',
    fontSize: 14,
  },
  selectedUserItem: {
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
  },
  userSelectedCheckmark: {
    marginLeft: 12,
  },
  userUnselectedCheckmark: {
    marginLeft: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  modalCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#666',
  },
  modalCancelButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalConfirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#7B68EE',
  },
  modalConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentUserItem: {
    backgroundColor: 'rgba(123, 104, 238, 0.1)',
  },
  currentUserName: {
    color: '#7B68EE',
    fontWeight: 'bold',
  },
  currentUserAvatarPlaceholder: {
    backgroundColor: '#7B68EE',
  },
  currentUserIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7B68EE',
    borderWidth: 2,
    borderColor: '#333',
    zIndex: 1,
  },
});

export default UserAssignmentSection;