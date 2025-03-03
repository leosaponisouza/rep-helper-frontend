// components/Home/HomeHeader.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getDisplayName } from '../../src/utils/userUtils';
import { User } from '../../src/models/user.model';

interface HomeStats {
  totalExpenses: number;
  pendingTasks: number;
  upcomingEvents: number;
  republicName: string;
}

interface HomeHeaderProps {
  user: User | null;
  stats: HomeStats | null;
  navigation: any;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ user, stats, navigation }) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.headerTitleSection}>
          <Text style={styles.welcomeText}>Bem-vindo(a),</Text>
          <Text style={styles.userNameText}>{getDisplayName(user, true)}</Text>
          <Text style={styles.republicName}>
            {stats?.republicName || 'Sua República'}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.push('/(panel)/settings/account')}
        >
          {user?.profile_picture_url ? (
            <Image 
              source={{ uri: user.profile_picture_url }} 
              style={styles.profileImage} 
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileInitials}>
                {user?.name?.charAt(0) || 'U'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Indicadores de atividade */}
      <View style={styles.activityIndicators}>
        <View style={styles.indicatorItem}>
          <MaterialCommunityIcons name="cash" size={20} color="#FFFFFF" />
          <Text style={styles.indicatorText}>
            R$ {stats?.totalExpenses?.toFixed(2) || '0,00'}
          </Text>
        </View>
        
        <View style={styles.indicatorDivider} />
        
        <View style={styles.indicatorItem}>
          <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.indicatorText}>
            {stats?.pendingTasks || 0} tarefas
          </Text>
        </View>
        
        <View style={styles.indicatorDivider} />
        
        <View style={styles.indicatorItem}>
          <MaterialCommunityIcons name="calendar-check" size={20} color="#FFFFFF" />
          <Text style={styles.indicatorText}>
            {stats?.upcomingEvents || 0} eventos
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 60, // Espaço adicional abaixo para as ações rápidas
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 5,
  },
  headerTitleSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  userNameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  republicName: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  profileButton: {
    height: 50,
    width: 50,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileImage: {
    height: 50,
    width: 50,
    borderRadius: 25,
  },
  profileImagePlaceholder: {
    height: 50,
    width: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  activityIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 15,
    margin: 15,
    padding: 10,
    marginTop: 20,
  },
  indicatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  indicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  indicatorDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default HomeHeader;