// components/Finances/CategoryChart.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { CategoryExpense } from '../../src/models/finances.model';

const screenWidth = Dimensions.get('window').width;

// Cores para as categorias
const categoryColors = [
  '#FF6347', // Vermelho
  '#4CAF50', // Verde
  '#2196F3', // Azul
  '#FFC107', // Amarelo
  '#9C27B0', // Roxo
  '#FF9800', // Laranja
  '#00BCD4', // Ciano
  '#795548', // Marrom
  '#607D8B', // Azul acinzentado
  '#E91E63', // Rosa
];

interface CategoryChartProps {
  data: CategoryExpense[];
  title?: string;
}

const CategoryChart: React.FC<CategoryChartProps> = ({ 
  data, 
  title = 'Despesas por Categoria' 
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
  const chartData = data.map((item, index) => ({
    name: item.category,
    amount: item.amount,
    percentage: item.percentage,
    color: item.color || categoryColors[index % categoryColors.length],
    legendFontColor: '#fff',
    legendFontSize: 12,
  }));

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const chartConfig = {
    backgroundColor: '#333',
    backgroundGradientFrom: '#333',
    backgroundGradientTo: '#333',
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <PieChart
        data={chartData}
        width={screenWidth - 40}
        height={220}
        chartConfig={chartConfig}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
      
      <View style={styles.categoriesList}>
        {data.map((item, index) => (
          <View key={index} style={styles.categoryItem}>
            <View style={[styles.categoryColor, { backgroundColor: chartData[index].color }]} />
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{item.category}</Text>
              <View style={styles.categoryValues}>
                <Text style={styles.categoryAmount}>{formatCurrency(item.amount)}</Text>
                <Text style={styles.categoryPercentage}>{item.percentage.toFixed(1)}%</Text>
              </View>
            </View>
          </View>
        ))}
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
  categoriesList: {
    marginTop: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  categoryValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryAmount: {
    color: '#ccc',
    fontSize: 12,
  },
  categoryPercentage: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: 'bold',
  }
});

export default CategoryChart;