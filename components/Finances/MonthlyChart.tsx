// components/Finances/MonthlyChart.tsx
import { MonthlyChartData, MonthlyData } from '@/src/models/finances.model';
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';


interface MonthlyChartProps {
  data?: MonthlyChartData | null;
  title?: string;
  loading?: boolean;
}

const MonthlyChart: React.FC<MonthlyChartProps> = ({
  data,
  title = "Análise Mensal",
  loading = false
}) => {
  // Ensure data.monthlyData is always an array
  const safeData: MonthlyData[] = data?.monthlyData || [];

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

  // Calcular largura apropriada para garantir que o gráfico caiba no container
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 64; // Considerando as margens e paddings

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
            width={chartWidth}
            height={220}
            withHorizontalLines={true}
            withVerticalLines={false}
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
                r: '4', // Reduzindo o tamanho dos pontos
                strokeWidth: '1',
              },
              propsForLabels: {
                fontSize: 10, // Reduzindo o tamanho da fonte
              }
            }}
            bezier
            style={styles.chart}
            yAxisSuffix="" // Remover sufixo do eixo Y
            yAxisInterval={1} // Controla a densidade das linhas horizontais
            withInnerLines={true}
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
    overflow: 'hidden', // Isso garante que nada vaze para fora
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    width: '100%',
    overflow: 'hidden',
  },
  chart: {
    borderRadius: 16,
    marginRight: -10, // Compensar o padding interno que o componente aplica
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