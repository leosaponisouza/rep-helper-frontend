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
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';

const AboutScreen = () => {
  const router = useRouter();
  
  // Lista de links legais e políticas
  const legalLinks = [
    {
      id: 'terms',
      title: 'Termos de Uso',
      description: 'Condições de uso do aplicativo',
      icon: 'document-text',
      route: '/(panel)/settings/terms-of-use',
    },
    {
      id: 'privacy',
      title: 'Política de Privacidade',
      description: 'Como tratamos seus dados e informações',
      icon: 'shield-checkmark',
      route: '/(panel)/settings/privacy-policy',
    },
    {
      id: 'licenses',
      title: 'Licenças de Software',
      description: 'Bibliotecas e componentes de código aberto',
      icon: 'code-slash',
      route: '/(panel)/settings/software-licenses',
    },
  ];
  
  // Lista de canais de contato
  const contactChannels = [
    {
      id: 'email',
      title: 'E-mail',
      value: 'contato@rephelper.com.br',
      icon: 'mail',
      action: () => Linking.openURL('mailto:contato@rephelper.com.br'),
    },
    {
      id: 'website',
      title: 'Website',
      value: 'www.rephelper.com.br',
      icon: 'globe',
      action: () => Linking.openURL('https://www.rephelper.com.br'),
    },
    {
      id: 'instagram',
      title: 'Instagram',
      value: '@rephelper',
      icon: 'logo-instagram',
      action: () => Linking.openURL('https://instagram.com/rephelper'),
    },
  ];

  // Renderizador de item de link
  const LinkItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity 
        style={styles.linkItem}
        onPress={() => router.push(item.route)}
      >
        <View style={styles.linkIconContainer}>
          <Ionicons name={item.icon} size={22} color="#7B68EE" />
        </View>
        <View style={styles.linkContent}>
          <Text style={styles.linkTitle}>{item.title}</Text>
          <Text style={styles.linkDescription}>{item.description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#666" />
      </TouchableOpacity>
    );
  };
  
  // Renderizador de item de contato
  const ContactItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity 
        style={styles.contactItem}
        onPress={item.action}
      >
        <View style={styles.contactIconContainer}>
          <Ionicons name={item.icon} size={22} color="#7B68EE" />
        </View>
        <View style={styles.contactContent}>
          <Text style={styles.contactTitle}>{item.title}</Text>
          <Text style={styles.contactValue}>{item.value}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      <Stack.Screen
        options={{
          title: "Sobre o App",
          headerStyle: {
            backgroundColor: "#333",
          },
          headerTintColor: "#fff",
          headerShadowVisible: false,
        }}
      />
      
      <ScrollView style={styles.container}>
        {/* Cabeçalho com logo e informações do app */}
        <View style={styles.header}>
          <Image 
            source={require('../../../assets/icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>RepHelper</Text>
          <Text style={styles.appVersion}>Versão 1.0.0</Text>
          <Text style={styles.appDescription}>
            O aplicativo essencial para gerenciar repúblicas e moradias compartilhadas.
          </Text>
        </View>
        
        {/* Seção: Sobre Nós */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre Nós</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutText}>
              RepHelper foi criado para simplificar a vida em moradias compartilhadas, ajudando a administrar despesas, tarefas e comunicação entre os moradores de forma eficiente e transparente.
            </Text>
            <Text style={styles.aboutText}>
              Nossa missão é tornar a vida em república mais harmoniosa e organizada, reduzindo conflitos e facilitando a gestão financeira coletiva.
            </Text>
          </View>
        </View>
        
        {/* Seção: Recursos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Principais Recursos</Text>
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <MaterialCommunityIcons name="cash-multiple" size={22} color="#7B68EE" />
              </View>
              <Text style={styles.featureTitle}>Divisão de Despesas</Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="calendar" size={22} color="#7B68EE" />
              </View>
              <Text style={styles.featureTitle}>Agenda Compartilhada</Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="list" size={22} color="#7B68EE" />
              </View>
              <Text style={styles.featureTitle}>Gestão de Tarefas</Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="chatbubbles" size={22} color="#7B68EE" />
              </View>
              <Text style={styles.featureTitle}>Chat Integrado</Text>
            </View>
          </View>
        </View>
        
        {/* Seção: Legal e Políticas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal e Políticas</Text>
          <View style={styles.linksContainer}>
            {legalLinks.map((item) => (
              <LinkItem key={item.id} item={item} />
            ))}
          </View>
        </View>
        
        {/* Seção: Contato */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contato</Text>
          <View style={styles.contactsContainer}>
            {contactChannels.map((item) => (
              <ContactItem key={item.id} item={item} />
            ))}
          </View>
        </View>
        
        {/* Créditos */}
        <View style={styles.creditsContainer}>
          <Text style={styles.creditsText}>© 2025 RepHelper - Todos os direitos reservados</Text>
          <Text style={styles.creditsText}>Desenvolvido com ❤️ no Brasil</Text>
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
    alignItems: 'center',
    padding: 24,
    paddingBottom: 32,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7B68EE',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 16,
  },
  appDescription: {
    fontSize: 16,
    color: '#ddd',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7B68EE',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  aboutCard: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
  },
  aboutText: {
    fontSize: 15,
    color: '#ddd',
    marginBottom: 12,
    lineHeight: 22,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 16,
  },
  featureItem: {
    width: '48%',
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    textAlign: 'center',
  },
  linksContainer: {
    backgroundColor: '#333',
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  linkIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    marginBottom: 2,
  },
  linkDescription: {
    fontSize: 14,
    color: '#aaa',
  },
  contactsContainer: {
    backgroundColor: '#333',
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: '#aaa',
  },
  creditsContainer: {
    padding: 24,
    alignItems: 'center',
  },
  creditsText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
});

export default AboutScreen;