// app/(panel)/events/create.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Keyboard
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEvents } from '../../../src/hooks/useEvents';
import { useAuth } from '../../../src/context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, addHours, parseISO, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CreateEventScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { createEvent } = useEvents();
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(addHours(new Date(), 2));
  
  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');
  const [datePickerFor, setDatePickerFor] = useState<'start' | 'end'>('start');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [locationFocused, setLocationFocused] = useState(false);
  
  // Funções para manipular o DateTimePicker
  const showDatePicker = (forDate: 'start' | 'end', mode: 'date' | 'time') => {
    setDatePickerFor(forDate);
    setDatePickerMode(mode);
    if (forDate === 'start') {
      setShowStartDatePicker(true);
    } else {
      setShowEndDatePicker(true);
    }
  };
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
      setShowEndDatePicker(false);
    }
    
    if (!selectedDate) return;
    
    if (datePickerFor === 'start') {
      const currentStartDate = new Date(startDate);
      
      if (datePickerMode === 'date') {
        // Atualiza apenas a data, mantendo a hora
        const newDate = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          currentStartDate.getHours(),
          currentStartDate.getMinutes()
        );
        setStartDate(newDate);
        
        // Se a data de término for anterior à nova data de início, ajusta
        if (isBefore(endDate, newDate)) {
          setEndDate(addHours(newDate, 2));
        }
        
        // No iOS, após selecionar a data, mostra o seletor de hora
        if (Platform.OS === 'ios') {
          setDatePickerMode('time');
        }
      } else {
        // Atualiza apenas a hora, mantendo a data
        const currentEndDate = new Date(endDate);
        const newDate = new Date(
          currentEndDate.getFullYear(),
          currentEndDate.getMonth(),
          currentEndDate.getDate(),
          selectedDate.getHours(),
          selectedDate.getMinutes()
        );
        
        // Não permite hora de término anterior à hora de início no mesmo dia
        if (
          currentEndDate.getFullYear() === startDate.getFullYear() &&
          currentEndDate.getMonth() === startDate.getMonth() &&
          currentEndDate.getDate() === startDate.getDate() &&
          isBefore(newDate, startDate)
        ) {
          Alert.alert('Atenção', 'O horário de término não pode ser anterior ao horário de início');
          return;
        }
        
        setEndDate(newDate);
        
        if (Platform.OS === 'ios') {
          setShowEndDatePicker(false);
        }
      }
    }
  };
  
  // Formatação das datas para exibição
  const formatDate = (date: Date) => {
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };
  
  const formatTime = (date: Date) => {
    return format(date, "HH:mm", { locale: ptBR });
  };
  
  // Validar formulário antes de submeter
  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Erro', 'Por favor, informe um título para o evento');
      return false;
    }
    
    if (isBefore(endDate, startDate)) {
      Alert.alert('Erro', 'A data/hora de término deve ser após a data/hora de início');
      return false;
    }
    
    return true;
  };
  
  // Criar evento
  const handleCreateEvent = async () => {
    Keyboard.dismiss();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const eventData = {
        title: title.trim(),
        description: description.trim() || '',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        location: location.trim() || '',
        republicId: user?.currentRepublicId || ''
      };
      
      const createdEvent = await createEvent(eventData);
      
      Alert.alert(
        'Sucesso',
        'Evento criado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Ir para a tela de convites ou para detalhes do evento
              if (createdEvent && createdEvent.id) {
                router.push(`/(panel)/events/${createdEvent.id}`);
              } else {
                router.push('/(panel)/events/index');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      Alert.alert('Erro', 'Não foi possível criar o evento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#7B68EE" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Criar Evento</Text>
        </View>
        
        <ScrollView 
          style={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Título */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Título do Evento *</Text>
            <View style={[
              styles.inputContainer, 
              titleFocused && styles.inputFocused
            ]}>
              <Ionicons name="calendar" size={20} color="#7B68EE" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Digite o título do evento"
                placeholderTextColor="#aaa"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
                onFocus={() => setTitleFocused(true)}
                onBlur={() => setTitleFocused(false)}
              />
            </View>
          </View>
          
          {/* Descrição */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Descrição (opcional)</Text>
            <View style={[
              styles.inputContainer, 
              styles.textAreaContainer,
              descriptionFocused && styles.inputFocused
            ]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descreva mais sobre o evento"
                placeholderTextColor="#aaa"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                onFocus={() => setDescriptionFocused(true)}
                onBlur={() => setDescriptionFocused(false)}
              />
            </View>
          </View>
          
          {/* Data de Início */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Data e Hora de Início *</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => showDatePicker('start', 'date')}
              >
                <Ionicons name="calendar" size={20} color="#7B68EE" style={styles.inputIcon} />
                <Text style={styles.dateTimeText}>{formatDate(startDate)}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.timeButton}
                onPress={() => showDatePicker('start', 'time')}
              >
                <Ionicons name="time" size={20} color="#7B68EE" style={styles.inputIcon} />
                <Text style={styles.dateTimeText}>{formatTime(startDate)}</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Data de Término */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Data e Hora de Término *</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => showDatePicker('end', 'date')}
              >
                <Ionicons name="calendar" size={20} color="#7B68EE" style={styles.inputIcon} />
                <Text style={styles.dateTimeText}>{formatDate(endDate)}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.timeButton}
                onPress={() => showDatePicker('end', 'time')}
              >
                <Ionicons name="time" size={20} color="#7B68EE" style={styles.inputIcon} />
                <Text style={styles.dateTimeText}>{formatTime(endDate)}</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Local do Evento */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Local (opcional)</Text>
            <View style={[
              styles.inputContainer, 
              locationFocused && styles.inputFocused
            ]}>
              <Ionicons name="location" size={20} color="#7B68EE" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Local do evento"
                placeholderTextColor="#aaa"
                value={location}
                onChangeText={setLocation}
                onFocus={() => setLocationFocused(true)}
                onBlur={() => setLocationFocused(false)}
              />
            </View>
          </View>
          
          {/* Botão de Criar */}
          <TouchableOpacity 
            style={[styles.createButton, loading && styles.buttonDisabled]}
            onPress={handleCreateEvent}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.createButtonText}>Criar Evento</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
        
        {/* Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode={datePickerMode}
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
        
        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode={datePickerMode}
            display="default"
            onChange={handleDateChange}
            minimumDate={datePickerMode === 'date' ? startDate : undefined}
          />
        )}
      </KeyboardAvoidingView>
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
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#222',
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#fff',
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
    height: 56,
    paddingHorizontal: 16,
  },
  textAreaContainer: {
    height: 120,
    alignItems: 'flex-start',
  },
  inputFocused: {
    borderColor: '#7B68EE',
    backgroundColor: '#393939',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: '100%',
  },
  textArea: {
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateButton: {
    flex: 0.65,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#444',
    marginRight: 8,
  },
  timeButton: {
    flex: 0.32,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  dateTimeText: {
    color: '#fff',
    fontSize: 16,
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: '#7B68EE',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#7B68EE',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#5a5a5a',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonIcon: {
    marginRight: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CreateEventScreen;
