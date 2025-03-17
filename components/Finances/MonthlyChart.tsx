// components/Finances/MonthlyChart.tsx
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

// Definindo a interface para os dados do gráfico
interface MonthlyChartData {
  month: string;
  expenses: number;
  incomes: number;
}

interface MonthlyChartProps {
  data?: MonthlyChartData[] | null;
  title?: string;
  loading?: boolean;
}

const MonthlyChart: React.FC<MonthlyChartProps> = ({ 
  data, 
  title = "Análise Mensal", 
  loading = false 
}) => {
  // Ensure data is always an array
  const safeData = Array.isArray(data) ? data : [];
  
  // Handle case where data is empty
  if (safeData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {loading ? "Carregando dados..." : "Não há dados suficientes para exibir o gráfico"}
          </Text>
          {loading && <ActivityIndicator size="large" color="#7B68EE" style={{ marginTop: 10 }} />}
        </View>
      </View>
    );
  }

  // Prepare data for chart - with extra safety checks
  const labels = safeData.map(item => (item && item.month) || '');
  const expensesData = safeData.map(item => (item && item.expenses) || 0);
  const incomesData = safeData.map(item => (item && item.incomes) || 0);

  const chartData = {
    labels,
    datasets: [
      {
        data: expensesData,
        color: (opacity = 1) => `rgba(255, 99, 71, ${opacity})`, // Red for expenses
        strokeWidth: 2
      },
      {
        data: incomesData,
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Green for incomes
        strokeWidth: 2
      }
    ],
    legend: ["Despesas", "Receitas"]
  };

  const width = Dimensions.get('window').width - 40;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B68EE" />
        </View>
      ) : (
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={width}
            height={220}
            chartConfig={{
              backgroundColor: '#333',
              backgroundGradientFrom: '#333',
              backgroundGradientTo: '#333',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
              }
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#333',
    borderRadius: 16,
    padding: 16,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: 16,
    paddingRight: 20,
  },
  loadingContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    fontSize: 16,
  }
});

export default MonthlyChart;