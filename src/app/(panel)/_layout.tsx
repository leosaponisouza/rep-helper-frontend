// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Importe o Ionicons ou outro pacote de ícones
import { StyleSheet } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Oculta o header padrão para todas as telas
        tabBarActiveTintColor: '#7B68EE', // Cor do ícone/texto ativo
        tabBarInactiveTintColor: 'gray', // Cor do ícone/texto inativo
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="home" // Nome da tela (deve corresponder ao nome do arquivo home.tsx)
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="activities" // Nome da tela (deve corresponder ao nome do arquivo activities.tsx)
        options={{
          tabBarLabel: 'Atividades',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="events" // Nome da tela (deve corresponder ao nome do arquivo events.tsx)
        options={{
          tabBarLabel: 'Eventos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings" // Nome da tela (deve corresponder ao nome do arquivo settings.tsx)
        options={{
          tabBarLabel: 'Configurações',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#333', // Cor de fundo da barra de navegação
    borderTopColor: '#555',
    borderTopWidth: 1,
    
  },
  tabBarLabel: {
    fontFamily: 'Roboto', // Defina a família de fontes desejada
    fontSize: 12,
  },
});

