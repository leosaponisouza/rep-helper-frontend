// components/TaskEdit/CategorySection.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';

// Common categories that users might want to use
const COMMON_CATEGORIES = [
  'Limpeza', 
  'Compras', 
  'Manutenção', 
  'Contas', 
  'Alimentação',
  'Outros'
];

interface CategorySectionProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
}

const CategorySection: React.FC<CategorySectionProps> = ({ control, setValue, watch }) => {
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const selectCategory = (category: string) => {
    setValue('category', category);
    setCategoryModalVisible(false);
  };

  const handleCustomCategory = () => {
    if (customCategory.trim()) {
      setValue('category', customCategory.trim());
      setCustomCategory('');
      setCategoryModalVisible(false);
    }
  };

  const renderCategoryModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isCategoryModalVisible}
      onRequestClose={() => setCategoryModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar Categoria</Text>
            <Text style={styles.modalSubtitle}>
              Escolha uma categoria para sua tarefa
            </Text>
          </View>
          
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.categoryGrid}>
              {COMMON_CATEGORIES.map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    watch('category') === category && styles.selectedCategoryChip
                  ]}
                  onPress={() => selectCategory(category)}
                >
                  <Text 
                    style={[
                      styles.categoryChipText,
                      watch('category') === category && styles.selectedCategoryChipText
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.customCategoryContainer}>
              <Text style={styles.customCategoryLabel}>Categoria Personalizada</Text>
              <View style={styles.customCategoryInputRow}>
                <TextInput
                  style={styles.customCategoryInput}
                  value={customCategory}
                  onChangeText={setCustomCategory}
                  placeholder="Digite uma categoria..."
                  placeholderTextColor="#aaa"
                />
                <TouchableOpacity
                  style={[
                    styles.customCategoryButton,
                    !customCategory.trim() && styles.disabledButton
                  ]}
                  onPress={handleCustomCategory}
                  disabled={!customCategory.trim()}
                >
                  <Text style={styles.customCategoryButtonText}>Aplicar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
          
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setCategoryModalVisible(false)}
          >
            <Text style={styles.modalCloseButtonText}>Concluir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Categoria (opcional)</Text>
      <TouchableOpacity 
        style={styles.selectButton}
        onPress={() => setCategoryModalVisible(true)}
      >
        <View style={styles.selectButtonContent}>
          <View style={styles.selectButtonTextContainer}>
            <Text style={styles.selectButtonLabel}>Categoria</Text>
            <Text style={styles.selectButtonValue}>
              {watch('category') || 'Selecione uma categoria'}
            </Text>
          </View>
          <FontAwesome5 name="tag" size={20} color="#7B68EE" />
        </View>
        
        {watch('category') && (
          <View style={styles.categoryPreview}>
            <View style={styles.categoryPreviewBadge}>
              <Text style={styles.categoryPreviewText}>{watch('category')}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {renderCategoryModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginTop: 20,
  },
  inputLabel: {
    color: '#fff',
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '500',
  },
  selectButton: {
    backgroundColor: '#333',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444',
    overflow: 'hidden',
  },
  selectButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 16,
  },
  selectButtonTextContainer: {
    flex: 1,
  },
  selectButtonLabel: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 4,
  },
  selectButtonValue: {
    color: '#fff',
    fontSize: 16,
  },
  categoryPreview: {
    padding: 12,
    paddingTop: 0,
    paddingLeft: 15,
  },
  categoryPreviewBadge: {
    backgroundColor: 'rgba(123, 104, 238, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  categoryPreviewText: {
    color: '#7B68EE',
    fontSize: 14,
    fontWeight: '500',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#333',
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  modalSubtitle: {
    color: '#aaa',
    fontSize: 14,
  },
  modalScrollView: {
    maxHeight: 400,
    padding: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryChip: {
    backgroundColor: '#444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    margin: 6,
  },
  selectedCategoryChip: {
    backgroundColor: '#7B68EE',
  },
  categoryChipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCategoryChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  customCategoryContainer: {
    marginTop: 24,
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    padding: 16,
  },
  customCategoryLabel: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
  },
  customCategoryInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customCategoryInput: {
    flex: 1,
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
    marginRight: 10,
  },
  customCategoryButton: {
    backgroundColor: '#7B68EE',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#555',
  },
  customCategoryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    margin: 16,
    backgroundColor: '#7B68EE',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CategorySection;