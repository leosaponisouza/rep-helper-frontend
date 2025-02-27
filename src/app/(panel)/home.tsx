// app/(tabs)/home.tsx
import React, { useState, useEffect, ReactNode } from 'react';
import {
  View,
  Text,
  Button,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Clipboard,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext'; // Make sure this path is correct
import { Ionicons } from '@expo/vector-icons'; // For icons
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import api from '../../services/api'; // Import your API client
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../../utils/firebaseClientConfig';

interface InformationItemProps {
    icon: string;
    label: string;
    value: string;
    onCopy?: () => void;
  }
  interface ChartData {
      labels: string[];
      datasets: {
          data: number[];
      }[];
  }
  
  interface ChartData {
      labels: string[];
      datasets: {
          data: number[];
      }[];
  }
  
  interface Activity {
    id: number;
    type: string; // tipo
    title: string; //titulo
    description: string; // descricao
  }
  
  interface Event {
    id: number;
    date: string;
    title: string;
    responsible: string; // Alterado para 'responsible'
  }
  
  // NEW: SectionProps interface
  interface SectionProps {
    title: string;
    isExpanded: boolean;
    onToggle: () => void;
    children: ReactNode; // Type for children
  }
  
  const screenWidth = Dimensions.get('window').width;

const HomeScreen = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isInformationExpanded, setIsInformationExpanded] = useState(false);
  const [isActivitiesExpanded, setIsActivitiesExpanded] = useState(true);
  const [isEventsExpanded, setIsEventsExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [republicCode, setRepublicCode] = useState<string | null>(null);
  const [residentsCount, setResidentsCount] = useState(0);
  const [problemsCount, setProblemsCount] = useState(0); 
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]); // Adjust the type if needed
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]); // Adjust the type if needed
  const [chartData, setChartData] = useState<any>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchHomeData = async () => {
    setLoading(true);
    try {
      if (user && firebaseUser) {
        const firebaseToken = await firebaseUser.getIdToken();
        const response = await api.get('/home', {
          headers: {
            Authorization: `Bearer ${firebaseToken}`,
          },
        });

        // Verificando se os dados existem e se estão na estrutura correta
        if (response.data && response.data.data) {
          const data = response.data.data;
            setRepublicCode(data.republicCode);
            setResidentsCount(data.residentsCount);
            setProblemsCount(data.problemsCount);

            // Ajuste para mapear corretamente para as interfaces
            setRecentActivities(data.recentActivities || []); // Certifique-se de que está recebendo um array de objetos
            setUpcomingEvents(data.upcomingEvents || []); // Certifique-se de que está recebendo um array de objetos

            setChartData(data.chartData || null);
        } else {
            throw new Error('Formato de dados inválido recebido do servidor');
        }
      }
    } catch (error: any) {
      console.error('Error fetching home data:', error);
      Alert.alert('Error', error.message || 'Failed to load home data.');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if(isAuthenticated){
        fetchHomeData();
    }
  }, [isAuthenticated]);

  const handleCopyCode = () => {
    if (republicCode) {
      Clipboard.setString(republicCode);
      Alert.alert(
        'Copiado',
        'Código da república copiado para a área de transferência!'
      );
    }
  };

  const getActivityIcon = (tipo: string) => {
    switch (tipo) {
      case 'tarefaConcluida':
        return 'checkmark-circle';
      case 'tarefaCriada':
        return 'add-circle';
      case 'tarefaEditada':
        return 'create';
      case 'tarefaExcluida':
        return 'trash';
      default:
        return 'information-circle';
    }
  };

  const getActivityColor = (tipo: string) => {
    switch (tipo) {
      case 'tarefaConcluida':
        return 'green';
      case 'tarefaCriada':
        return 'blue';
      case 'tarefaEditada':
        return 'orange';
      case 'tarefaExcluida':
        return 'red';
      default:
        return 'grey';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#636AE8" />
      </View>
    );
  }

  if (!chartData) {
    return (
        <ScrollView style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.greeting}>Olá, {user?.name}!</Text>
            <TouchableOpacity onPress={logout}>
            <Ionicons name="log-out-outline" size={24} color="#636AE8" />
            </TouchableOpacity>
        </View>
    
        <Text style={styles.republicName}>{user?.current_republic_id || "República"}</Text>
        <Text style={styles.noDataText}>Não foi possivel carregar as informações.</Text>
        </ScrollView>
    );
    }
    

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, {user?.name}!</Text>
        <TouchableOpacity onPress={logout}>
          <Ionicons name="log-out-outline" size={24} color="#636AE8" />
        </TouchableOpacity>
      </View>

      <Text style={styles.republicName}>
        {user?.current_republic_id || 'República'}
      </Text>

      <Section
        title="Informações"
        isExpanded={isInformationExpanded}
        onToggle={() => setIsInformationExpanded(!isInformationExpanded)}
      >
        {isInformationExpanded && (
          <>
            <InformationItem
              icon="key-outline"
              label="Código da República"
              value={republicCode || 'N/A'}
              onCopy={handleCopyCode}
            />
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Saldo Total</Text>
              <LineChart
                data={chartData}
                width={screenWidth - 48}
                height={220}
                yAxisLabel="R$"
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 2,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            </View>
            <InformationItem
                          icon="people-outline"
                          label="Moradores"
                          value={String(residentsCount)} onCopy={undefined}            />
            <InformationItem
                          icon="warning-outline"
                          label="Problemas"
                          value={String(problemsCount)} onCopy={undefined}            />
          </>
        )}
      </Section>

      <Section
        title="Atividades Recentes"
        isExpanded={isActivitiesExpanded}
        onToggle={() => setIsActivitiesExpanded(!isActivitiesExpanded)}
      >
        {isActivitiesExpanded &&
          (recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))
          ) : (
            <Text style={styles.noDataText}>Nenhuma atividade recente.</Text>
          ))}
      </Section>

      <Section
        title="Próximos Eventos"
        isExpanded={isEventsExpanded}
        onToggle={() => setIsEventsExpanded(!isEventsExpanded)}
      >
        {isEventsExpanded &&
          (upcomingEvents.length > 0 ? ( 
            upcomingEvents.map((event) => (
              <EventItem key={event.id} event={event} />
            ))
          ) : (
            <Text style={styles.noDataText}>Nenhum evento próximo.</Text>
          ))}
      </Section>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const Section = ({ title, isExpanded, onToggle, children }: SectionProps) => (
  <View style={styles.section}>
    <TouchableOpacity style={styles.sectionHeader} onPress={onToggle}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Ionicons
        name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
        size={24}
        color="#636AE8"
      />
    </TouchableOpacity>
    {children}
  </View>
);

const InformationItem = ({ icon, label, value, onCopy }: InformationItemProps) => (
  <View style={styles.infoItemContainer}>
    <View style={styles.infoItem}>
      {/* <Ionicons name={icon} size={24} color="#636AE8" /> */}
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
    {onCopy && (
      <TouchableOpacity onPress={onCopy}>
        <Ionicons name="copy-outline" size={20} color="#636AE8" />
      </TouchableOpacity>
    )}
  </View>
);
const getActivityIcon = (tipo: string) => {
    switch (tipo) {
        case 'Concluded': // Corrigido: Usando os mesmos nomes que no backend
            return 'checkmark-circle';
        case 'Created': // Corrigido: Usando os mesmos nomes que no backend
            return 'add-circle';
        case 'Edited': // Corrigido: Usando os mesmos nomes que no backend
            return 'create';
        case 'Deleted': // Corrigido: Usando os mesmos nomes que no backend
            return 'trash';
        default:
            return 'information-circle';
    }
};

const getActivityColor = (tipo: string) => {
    switch (tipo) {
        case 'Concluded': // Corrigido: Usando os mesmos nomes que no backend
            return 'green';
        case 'Created': // Corrigido: Usando os mesmos nomes que no backend
            return 'blue';
        case 'Edited': // Corrigido: Usando os mesmos nomes que no backend
            return 'orange';
        case 'Deleted': // Corrigido: Usando os mesmos nomes que no backend
            return 'red';
        default:
            return 'grey';
    }
};


const ActivityItem = ({ activity }: { activity: Activity }) => {
    const iconName = getActivityIcon(activity.type); // Usando 'type' aqui
    const iconColor = getActivityColor(activity.type); // Usando 'type' aqui
  
    return (
      <View style={styles.activityItemContainer}>
        <View
          style={[
            styles.activityIconContainer,
            { backgroundColor: iconColor + '1A' },
          ]}
        >
          <Ionicons name={iconName} size={24} color={iconColor} />
        </View>
        <View style={styles.activityText}>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <Text style={styles.activityDescription}>
            {activity.description}
          </Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={18} color="grey" />
      </View>
    );
  };
  
  const EventItem = ({ event }: { event: Event }) => (
    <View style={styles.eventItemContainer}>
      <View style={[styles.eventDateContainer, { backgroundColor: '#636AE81A' }]}>
        <Text style={styles.eventDate}>{event.date}</Text>
      </View>
      <View style={styles.eventText}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventAssigned}>Responsável: {event.responsible}</Text> {/* Corrigido */}
      </View>
      <Ionicons name="chevron-forward-outline" size={18} color="grey" />
    </View>
  );
  

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#636AE8',
  },
  republicName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 32,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  infoItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 12,
  },
  infoLabel: {
    color: 'grey',
    fontSize: 14,
  },
  infoValue: {
    color: '#212121',
    fontWeight: 'bold',
    fontSize: 16,
  },
  activityItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activityIconContainer: {
    padding: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  activityText: {
    flex: 1,
  },
  activityTitle: {
    color: '#212121',
    fontSize: 16,
    fontWeight: '600',
  },
  activityDescription: {
    color: '#757575',
    fontSize: 12,
  },
  eventItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  eventDateContainer: {
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  eventDate: {
    color: '#636AE8',
    fontWeight: 'bold',
    fontSize: 14,
  },
  eventText: {
    flex: 1,
  },
  eventTitle: {
    color: '#212121',
    fontWeight: 'bold',
    fontSize: 16,
  },
  eventAssigned: {
    color: '#757575',
    fontSize: 12,
  },
  noDataText: {
    textAlign: 'center',
    color: 'grey',
    fontStyle: 'italic',
    marginTop: 8,
  },
  chartContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartTitle: {
    color: 'grey',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'left',
  },
});

export default HomeScreen;
