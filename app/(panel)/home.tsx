import React, { useState, useEffect } from 'react';
import {
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, LineChartData } from 'react-native-chart-kit';
import api from '../../src/services/api';
import { ErrorHandler } from '../../src/utils/errorHandling';
import { useRouter } from 'expo-router';
import { StatusBar } from 'react-native';

// Tipos para melhor tipagem
interface QuickAction {
  id: string;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  onPress: () => void;
}

interface HomeStats {
  totalExpenses: number;
  pendingTasks: number;
  upcomingEvents: number;
  republicName: string;
}

interface RecentActivity {
  id: string;
  type: 'task' | 'expense' | 'event';
  title: string;
  description: string;
  timestamp: string;
}

interface ChartDataResponse {
  labels: string[];
  datasets: Array<{
    data: number[];
  }>;
}

const HomeScreen = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [chartData, setChartData] = useState<LineChartData | null>(null);

  // Buscar dados da home
  const fetchHomeData = async () => {
    try {
      setRefreshing(true);
      const [statsResponse, activitiesResponse, chartResponse] = await Promise.all([
        api.get('/home/stats'),
        api.get('/home/recent-activities'),
        api.get('/home/expense-chart')
      ]);

      setStats(statsResponse.data.data);
      setRecentActivities(activitiesResponse.data.data);
      
      // Mapear dados do gráfico para o formato do LineChart
      const chartResponseData = chartResponse.data.data;
      const formattedChartData: LineChartData = {
        labels: Array.isArray(chartResponseData?.labels) ? chartResponseData.labels : [],
        datasets: Array.isArray(chartResponseData?.datasets) 
          ? chartResponseData.datasets.map(dataset => ({
              data: Array.isArray(dataset.data) 
                ? dataset.data.map(value => Number(value) || 0) 
                : []
            }))
          : [],
        legend: ['Despesas']
      };

      setChartData(formattedChartData);
    } catch (error) {
      ErrorHandler.handle(error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  // Ações rápidas
  const quickActions: QuickAction[] = [
    {
      id: 'new-task',
      title: 'Nova Tarefa',
      icon: 'plus-circle-outline',
      color: '#7B68EE',
      onPress: () => router.push('/(panel)/tasks/create')
    },
    {
      id: 'new-expense',
      title: 'Registrar Despesa',
      icon: 'cash-plus',
      color: '#7B68EE',
      onPress: () => router.push('/(panel)/expenses/create')
    },
    {
      id: 'new-event',
      title: 'Novo Evento',
      icon: 'calendar-plus',
      color: '#7B68EE',
      onPress: () => router.push('/(panel)/events/create')
    }
  ];

  // Renderizar ação rápida
  const QuickActionButton = ({ action }: { action: QuickAction }) => (
    <TouchableOpacity 
      style={[styles.quickActionButton, { backgroundColor: action.color + '15' }]}
      onPress={action.onPress}
    >
      <MaterialCommunityIcons 
        name={action.icon} 
        size={24} 
        color={action.color} 
      />
      <Text style={[styles.quickActionText, { color: action.color }]}>
        {action.title}
      </Text>
    </TouchableOpacity>
  );

  // Renderizar atividade recente
  const RecentActivityItem = ({ activity }: { activity: RecentActivity }) => {
    const getIconAndColor = () => {
      switch (activity.type) {
        case 'task':
          return { icon: 'checklist', color: '#7B68EE' };
        case 'expense':
          return { icon: 'cash', color: '#7B68EE' };
        case 'event':
          return { icon: 'calendar', color: '#7B68EE' };
        default:
          return { icon: 'information-outline', color: '#9E9E9E' };
      }
    };

    const { icon, color } = getIconAndColor();

    return (
      <View style={styles.activityItem}>
        <View style={[styles.activityIconContainer, { backgroundColor: color + '15' }]}>
          <MaterialCommunityIcons name={icon} size={24} color={color} />
        </View>
        <View style={styles.activityDetails}>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <Text style={styles.activityDescription}>{activity.description}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchHomeData}
            colors={['#7B68EE']}
            tintColor={'#7B68EE'}
          />
        }
      >
        {/* Cabeçalho */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]}!</Text>
            <Text style={styles.republicName}>
              {stats?.republicName || 'Sua República'}
            </Text>
          </View>
          <TouchableOpacity onPress={logout}>
            <Ionicons name="log-out-outline" size={28} color="#7B68EE" />
          </TouchableOpacity>
        </View>

        {/* Estatísticas Rápidas */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="cash" size={24} color="#7B68EE" />
            <Text style={styles.statValue}>
              R$ {stats?.totalExpenses?.toFixed(2) || '0,00'}
            </Text>
            <Text style={styles.statLabel}>Despesas</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="checklist" size={24} color="#7B68EE" />
            <Text style={styles.statValue}>
              {stats?.pendingTasks || 0}
            </Text>
            <Text style={styles.statLabel}>Tarefas Pendentes</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="calendar" size={24} color="#7B68EE" />
            <Text style={styles.statValue}>
              {stats?.upcomingEvents || 0}
            </Text>
            <Text style={styles.statLabel}>Próximos Eventos</Text>
          </View>
        </View>

        {/* Gráfico de Despesas */}
        {chartData && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Resumo de Despesas</Text>
            <LineChart
              data={chartData}
              width={Dimensions.get('window').width - 40}
              height={220}
              yAxisLabel="R$ "
              chartConfig={{
                backgroundColor: '#333',
                backgroundGradientFrom: '#333',
                backgroundGradientTo: '#333',
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(123, 104, 238, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: "#7B68EE"
                }
              }}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {/* Ações Rápidas */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.quickActionsScroll}
          >
            {quickActions.map(action => (
              <QuickActionButton key={action.id} action={action} />
            ))}
          </ScrollView>
        </View>

        {/* Atividades Recentes */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Atividades Recentes</Text>
          {recentActivities.length > 0 ? (
            recentActivities.map(activity => (
              <RecentActivityItem 
                key={activity.id} 
                activity={activity} 
              />
            ))
          ) : (
            <Text style={styles.emptyStateText}>Nenhuma atividade recente</Text>
          )}
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#222',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  republicName: {
    fontSize: 16,
    color: '#aaa',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  statBox: {
    alignItems: 'center',
    width: '30%',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  sectionContainer: {
    backgroundColor: '#333',
    marginTop: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#fff',
  },
  quickActionsScroll: {
    flexDirection: 'row',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#444',
  },
  quickActionText: {
    marginLeft: 8,
    fontWeight: '600',
    color: '#fff',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#444',
    padding: 15,
    borderRadius: 10,
  },
  activityIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  activityDescription: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 5,
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#aaa',
    fontStyle: 'italic',
  },
});

export default HomeScreen