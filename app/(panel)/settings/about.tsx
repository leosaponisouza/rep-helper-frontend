// app/(panel)/settings/about.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const AboutScreen = () => {
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  
  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Erro ao abrir link:', err));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      <ScrollView style={styles.container}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBackground}>
            <Text style={styles.logoText}>RH</Text>
          </View>
          <Text style={styles.appName}>RepHelper</Text>
          <Text style={styles.versionText}>Versão {appVersion}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre o App</Text>
          <Text style={styles.sectionContent}>
            RepHelper é um aplicativo para gerenciamento de repúblicas, facilitando 
            a organização de tarefas, despesas e eventos entre moradores.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recursos</Text>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkbox-outline" size={24} color="#7B68EE" style={styles.featureIcon} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Gerenciamento de Tarefas</Text>
              <Text style={styles.featureDesc}>Organize e atribua tarefas aos moradores</Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="cash-outline" size={24} color="#7B68EE" style={styles.featureIcon} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Controle de Despesas</Text>
              <Text style={styles.featureDesc}>Acompanhe gastos e divida contas facilmente</Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="calendar-outline" size={24} color="#7B68EE" style={styles.featureIcon} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Agenda de Eventos</Text>
              <Text style={styles.featureDesc}>Crie e gerencie eventos compartilhados</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Termos e Políticas</Text>
          
          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => handleOpenLink('https://rephelper.com/terms')}
          >
            <Ionicons name="document-text-outline" size={22} color="#7B68EE" style={styles.linkIcon} />
            <Text style={styles.linkText}>Termos de Uso</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => handleOpenLink('https://rephelper.com/privacy')}
          >
            <Ionicons name="shield-outline" size={22} color="#7B68EE" style={styles.linkIcon} />
            <Text style={styles.linkText}>Política de Privacidade</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => handleOpenLink('https://rephelper.com/licenses')}
          >
            <Ionicons name="code-slash-outline" size={22} color="#7B68EE" style={styles.linkIcon} />
            <Text style={styles.linkText}>Licenças de Software</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contato e Suporte</Text>
          
          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => handleOpenLink('mailto:suporte@rephelper.com')}
          >
            <Ionicons name="mail-outline" size={22} color="#7B68EE" style={styles.linkIcon} />
            <Text style={styles.linkText}>suporte@rephelper.com</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => handleOpenLink('https://rephelper.com/feedback')}
          >
            <Ionicons name="chatbubble-outline" size={22} color="#7B68EE" style={styles.linkIcon} />
            <Text style={styles.linkText}>Enviar Feedback</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.credits}>
          <Text style={styles.footerText}>
            © 2025 RepHelper. Todos os direitos reservados.
          </Text>
          <Text style={styles.footerText}>
            Feito com ❤️ para estudantes e moradores de repúblicas
          </Text>
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
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#7B68EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
  },
  appName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  versionText: {
    fontSize: 16,
    color: '#aaa',
  },
  section: {
    backgroundColor: '#333',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7B68EE',
    marginBottom: 16,
  },
  sectionContent: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  featureIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  linkIcon: {
    marginRight: 16,
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    color: 'white',
  },
  credits: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 8,
  },
});

export default AboutScreen;