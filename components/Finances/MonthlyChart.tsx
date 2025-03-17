// components/Finances/Charts/MonthlyChart.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { MonthlyExpenseData } from '../../src/models/finances.model';

const screenWidth = Dimensions.get('window').width;

interface MonthlyChartProps {
  data: MonthlyExpenseData[];
  title?: string;
}

const MonthlyChart: React.FC<MonthlyChartProps> = ({ 
  data, 
  title = 'Movimentação Financeira Mensal' 
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.emptyText}>Sem dados para exibir</Text>
      </View>
    );
  }

  // Formatar dados para o gráfico
  const months = data.map(item => {
    // Converter formato "YYYY-MM" para abreviação do mês
    const [year, month] = item.month.split('-');
    // Obter abreviação do mês em português
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'short' });
  });

  const expenses = data.map(item => item.expenses);
  const incomes = data.map(item => item.incomes);

  // Encontrar maior valor para definir escala do gráfico
  const maxValue = Math.max(
    ...expenses,
    ...incomes
  );

  const chartData = {
    labels: months,
    datasets: [
      {
        data: expenses,
        color: (opacity = 1) => `rgba(255, 99, 71, ${opacity})`, // vermelho para despesas
        strokeWidth: 2,
      },
      {
        data: incomes,
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // verde para receitas
        strokeWidth: 2,
      }
    ],
    legend: ['Despesas', 'Receitas']
  };

  const chartConfig = {
    backgroundColor: '#333',
    backgroundGradientFrom: '#333',
    backgroundGradientTo: '#333',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
    },
    formatYLabel: (value: string) => {
      const num = parseFloat(value);
      if (num >= 1000) {
        return `R$${(num / 1000).toFixed(0)}k`;
      }
      return `R$${num}`;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <LineChart
        data={chartData}
        width={screenWidth - 40}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        fromZero
        yAxisSuffix=""
      />
      
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: 'rgba(255, 99, 71, 1)' }]} />
          <Text style={styles.legendText}>Despesas</Text>
        </View>
        
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: 'rgba(76, 175, 80, 1)' }]} />
          <Text style={styles.legendText}>Receitas</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#333',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  emptyContainer: {
    backgroundColor: '#333',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyText: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 10,
  },
  chart: {
    borderRadius: 16,
    paddingRight: 20,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    color: '#fff',
    fontSize: 12,
  }
});

export default MonthlyChart;