// components/Finances/CategoryChart.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryExpense } from '../../src/models/finances.model';

const categoryColors = [
  '#FF6347', '#4CAF50', '#2196F3', '#FFC107', '#9C27B0', 
  '#FF9800', '#00BCD4', '#795548', '#607D8B', '#E91E63',
];

interface CategoryChartProps {
  data: CategoryExpense[];
  title?: string;
  onViewDetails?: () => void;
}

const CategoryChart: React.FC<CategoryChartProps> = ({ 
  data, 
  title = 'Despesas por Categoria',
  onViewDetails
}) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.emptyText}>Sem dados para exibir</Text>
      </View>
    );
  }

  // Preparar dados do gráfico
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

  // Mostrar apenas as top 3 categorias quando não expandido
  const displayData = expanded ? data : data.slice(0, 3);
  const hasMoreData = data.length > 3;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        
        {onViewDetails && (
          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={onViewDetails}
          >
            <Text style={styles.viewDetailsText}>Detalhes</Text>
            <Ionicons name="chevron-forward" size={16} color="#7B68EE" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Lista de categorias */}
      <View style={styles.categoriesList}>
        {displayData.map((item, index) => (
          <View key={index} style={styles.categoryItem}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryColor, { backgroundColor: chartData[index].color }]} />
              <Text style={styles.categoryName}>{item.category}</Text>
              <Text style={styles.categoryPercentage}>{item.percentage.toFixed(1)}%</Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${item.percentage}%`, 
                    backgroundColor: chartData[index].color 
                  }
                ]} 
              />
            </View>
            
            <Text style={styles.categoryAmount}>{formatCurrency(item.amount)}</Text>
          </View>
        ))}
      </View>

      {/* Botão "Ver mais" ou "Ver menos" */}
      {hasMoreData && (
        <TouchableOpacity 
          style={styles.toggleButton}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={styles.toggleButtonText}>
            {expanded ? 'Ver menos' : `Ver mais ${data.length - 3} categorias`}
          </Text>
          <Ionicons 
            name={expanded ? "chevron-up" : "chevron-down"} 
            size={16} 
            color="#7B68EE" 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#333',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyContainer: {
    backgroundColor: '#333',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    color: '#7B68EE',
    fontSize: 14,
    marginRight: 4,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 10,
  },
  categoriesList: {
    // Sem height fixa para expandir conforme necessário
  },
  categoryItem: {
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  categoryPercentage: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#444',
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  categoryAmount: {
    color: '#ccc',
    fontSize: 12,
    textAlign: 'right',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 8,
  },
  toggleButtonText: {
    color: '#7B68EE',
    fontSize: 14,
    marginRight: 4,
  }
});

export default CategoryChart;