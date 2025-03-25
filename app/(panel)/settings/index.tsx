// app/(panel)/settings/index.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const SettingsScreen = () => {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Agrupar configurações por seções
  const settingsSections = [
    {
      title: 'Conta',
      items: [
        {
          id: 'account',
          title: 'Perfil',
          description: 'Editar informações pessoais',
          icon: 'person-circle',
          iconType: 'ionicons',
          route: '/(panel)/settings/account'
        }
      ]
    },
    {
      title: 'República',
      items: [
        {
          id: 'republic',
          title: 'Configurações da República',
          description: 'Gerenciar nome, endereço, código de convite',
          icon: 'home',
          iconType: 'ionicons',
          route: '/(panel)/settings/republic'
        },
        {
          id: 'members',
          title: 'Membros',
          description: 'Gerenciar os moradores',
          icon: 'people',
          iconType: 'ionicons',
          route: '/(panel)/settings/members'
        }
      ]
    },
    {
      title: 'Aplicativo',
      items: [
        {
          id: 'about',
          title: 'Sobre o App',
          description: 'Informações, termos e licenças',
          icon: 'information-circle',
          iconType: 'ionicons',
          route: '/(panel)/settings/about'
        },
        {
          id: 'help',
          title: 'Ajuda',
          description: 'Perguntas frequentes e suporte',
          icon: 'help-circle',
          iconType: 'ionicons',
          route: '/(panel)/settings/help'
        }
      ]
    }
  ];

  // Renderizador de item de configuração
  const SettingItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity 
        style={styles.settingItem}
        onPress={() => router.push(item.route)}
      >
        <View style={styles.settingIconContainer}>
          {item.iconType === 'ionicons' && (
            <Ionicons name={item.icon} size={24} color="#7B68EE" />
          )}
          {item.iconType === 'material' && (
            <MaterialCommunityIcons name={item.icon} size={24} color="#7B68EE" />
          )}
          {item.iconType === 'fontawesome' && (
            <FontAwesome5 name={item.icon} size={22} color="#7B68EE" />
          )}
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          <Text style={styles.settingDescription}>{item.description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#666" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      <ScrollView style={styles.container}>
        {/* Cabeçalho da Tela */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Configurações</Text>
          <Text style={styles.headerSubtitle}>Personalize sua experiência no app</Text>
        </View>

        {/* Seções de Configurações */}
        {settingsSections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item) => (
                <SettingItem key={item.id} item={item} />
              ))}
            </View>
          </View>
        ))}

        {/* Botão de logout */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={logout}
        >
          <Ionicons name="log-out" size={20} color="#FF6347" />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>

        {/* Informações da versão */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>RepHelper v1.0.0</Text>
        </View>
      </ScrollView>
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7B68EE',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  sectionContent: {
    backgroundColor: '#333',
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#aaa',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 99, 71, 0.2)',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 16,
    marginTop: 20,
    marginBottom: 16,
  },
  logoutText: {
    color: '#FF6347',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  versionContainer: {
    alignItems: 'center',
    padding: 16,
    marginBottom: 20,
  },
  versionText: {
    color: '#666',
    fontSize: 14,
  },
});

export default SettingsScreen;