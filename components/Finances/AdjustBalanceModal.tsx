import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface AdjustBalanceModalProps {
  visible: boolean;
  currentBalance: number;
  onClose: () => void;
  onSubmit: (newBalance: number, description: string) => Promise<boolean>;
}

const AdjustBalanceModal: React.FC<AdjustBalanceModalProps> = ({
  visible,
  currentBalance,
  onClose,
  onSubmit
}) => {
  const [balance, setBalance] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setBalance(currentBalance.toString());
      setDescription('');
    }
  }, [visible, currentBalance]);

  // Format input as currency
  const handleChangeText = (text: string) => {
    // Remove non-numeric characters
    const numericValue = text.replace(/[^0-9]/g, '');
    
    // Convert to float value (divide by 100 to handle decimals)
    const floatValue = numericValue ? parseInt(numericValue) / 100 : 0;
    
    // Format as currency without symbol
    const formattedValue = floatValue.toFixed(2).replace('.', ',');
    
    setBalance(formattedValue);
  };

  const handleSubmit = async () => {
    // Show haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      setLoading(true);
      
      // Parse balance value to number
      const valueText = balance.replace(',', '.');
      const newBalance = parseFloat(valueText);
      
      if (isNaN(newBalance)) {
        Alert.alert('Erro', 'Por favor, insira um valor válido');
        return;
      }
      
      const success = await onSubmit(newBalance, description);
      
      if (success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error('Erro ao ajustar saldo:', error);
      Alert.alert('Erro', 'Não foi possível ajustar o saldo. Tente novamente.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <View style={styles.modalContainer}>
                <View style={styles.header}>
                  <Text style={styles.title}>Ajustar Saldo</Text>
                  <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.content}>
                  <Text style={styles.label}>Saldo Atual</Text>
                  <Text style={styles.currentBalance}>
                    {formatCurrency(currentBalance)}
                  </Text>
                  
                  <Text style={styles.label}>Novo Saldo</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.currencySymbol}>R$</Text>
                    <TextInput
                      style={styles.input}
                      value={balance}
                      onChangeText={handleChangeText}
                      keyboardType="numeric"
                      placeholder="0,00"
                      autoFocus
                    />
                  </View>
                  
                  <Text style={styles.label}>Descrição</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={description}
                      onChangeText={setDescription}
                      placeholder="Motivo do ajuste (opcional)"
                      maxLength={100}
                    />
                  </View>
                  
                  <Text style={styles.helpText}>
                    Ajuste o saldo da república para refletir o valor real compartilhado.
                  </Text>
                </View>
                
                <View style={styles.footer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={onClose}
                    disabled={loading}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.submitButton, loading && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.submitButtonText}>Confirmar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: 320,
    backgroundColor: '#222',
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 4,
  },
  currentBalance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#333',
  },
  currencySymbol: {
    fontSize: 16,
    color: '#fff',
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#ccc',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#7B68EE',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default AdjustBalanceModal; 