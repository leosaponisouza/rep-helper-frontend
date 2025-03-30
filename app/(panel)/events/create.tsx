import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Keyboard,
  Animated,
  ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEvents } from '../../../src/hooks/useEvents';
import { useAuth } from '../../../src/context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, addHours, parseISO, isBefore, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatToBackendDateTime } from '@/src/utils/dateUtils';

// Importar estilos compartilhados
import { sharedStyles, colors } from '../../../src/styles/sharedStyles';
import eventsStyles from '@/src/styles/eventStyles';
import { formatLocalDate } from '@/src/utils/dateUtils';

// Importar componente de convite de usuários
import InviteUsersSection from '@/components/Event/InviteUsersSection';

const CreateEventScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const { user } = useAuth();
  const { createEvent, inviteUsers } = useEvents();
  
  // Animações
  const fadeAnim = useState(new Animated.Value(0))[0];
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  
  // Inicializar datas com base no parâmetro recebido ou data atual
  const [startDate, setStartDate] = useState(() => {
    if (params.date) {
      try {
        // Se recebemos uma data do calendário, usamos ela como base
        const baseDate = parseISO(params.date);
        // Definir hora para o próximo horário redondo (ex: 10:00, 11:00)
        const now = new Date();
        const roundedHour = Math.ceil(now.getHours() / 1) * 1;
        return setHours(setMinutes(baseDate, 0), roundedHour);
      } catch (error) {
        console.error('Error parsing date parameter:', error);
        return new Date();
      }
    }
    return new Date();
  });
  
  const [endDate, setEndDate] = useState(() => {
    // Definir data de término como 2 horas após a data de início
    return addHours(startDate, 2);
  });
  
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
  
  // Estado para participantes selecionados
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  
  // Efeito de entrada com animação
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);
  
  // Funções para manipular o DateTimePicker - otimizadas
  const showDatePicker = useCallback((forDate: 'start' | 'end', mode: 'date' | 'time') => {
    setDatePickerFor(forDate);
    setDatePickerMode(mode);
    if (forDate === 'start') {
      setShowStartDatePicker(true);
    } else {
      setShowEndDatePicker(true);
    }
  }, []);
  
  const handleDateChange = useCallback((event: any, selectedDate?: Date) => {
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
        const newDate = new Date(
          currentStartDate.getFullYear(),
          currentStartDate.getMonth(),
          currentStartDate.getDate(),
          selectedDate.getHours(),
          selectedDate.getMinutes()
        );
        setStartDate(newDate);
        
        // Ajustar a data de término para ser 2 horas após a nova data de início
        setEndDate(addHours(newDate, 2));
        
        if (Platform.OS === 'ios') {
          setShowStartDatePicker(false);
        }
      }
    } else {
      // Para a data de término
      const currentEndDate = new Date(endDate);
      
      if (datePickerMode === 'date') {
        // Atualiza apenas a data, mantendo a hora
        const newDate = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          currentEndDate.getHours(),
          currentEndDate.getMinutes()
        );
        
        // Verificar se a nova data é posterior à data de início
        if (isBefore(newDate, startDate)) {
          Alert.alert('Atenção', 'A data de término deve ser posterior à data de início');
          return;
        }
        
        setEndDate(newDate);
        
        // No iOS, após selecionar a data, mostra o seletor de hora
        if (Platform.OS === 'ios') {
          setDatePickerMode('time');
        }
      } else {
        // Atualiza apenas a hora, mantendo a data
        const newDate = new Date(
          currentEndDate.getFullYear(),
          currentEndDate.getMonth(),
          currentEndDate.getDate(),
          selectedDate.getHours(),
          selectedDate.getMinutes()
        );
        
        // Verificar se a nova hora é posterior à hora de início no mesmo dia
        if (
          currentEndDate.getFullYear() === startDate.getFullYear() &&
          currentEndDate.getMonth() === startDate.getMonth() &&
          currentEndDate.getDate() === startDate.getDate() &&
          isBefore(newDate, startDate)
        ) {
          Alert.alert('Atenção', 'O horário de término deve ser posterior ao horário de início');
          return;
        }
        
        setEndDate(newDate);
        
        if (Platform.OS === 'ios') {
          setShowEndDatePicker(false);
        }
      }
    }
  }, [startDate, endDate, datePickerFor, datePickerMode]);
  
  const formatTime = useCallback((date: Date) => {
    return format(date, "HH:mm", { locale: ptBR });
  }, []);
  
  // Validar formulário antes de submeter - otimizada
  const validateForm = useCallback(() => {
    if (!title.trim()) {
      Alert.alert('Erro', 'Por favor, informe um título para o evento');
      return false;
    }
    
    if (isBefore(endDate, startDate)) {
      Alert.alert('Erro', 'A data/hora de término deve ser após a data/hora de início');
      return false;
    }
    
    return true;
  }, [title, startDate, endDate]);
  
  const handleCreateEvent = useCallback(async () => {
    Keyboard.dismiss();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const eventData = {
        title: title.trim(),
        description: description.trim() || '',
        // Use a nova função que gera formato compatível com LocalDateTime do Java
        startDate: formatToBackendDateTime(startDate),
        endDate: formatToBackendDateTime(endDate),
        location: location.trim() || '',
        republicId: user?.currentRepublicId || ''
      };
      
      const createdEvent = await createEvent(eventData);
      
      // Quando o evento é criado, o criador já é automaticamente adicionado como confirmado
      // no backend, então não precisamos adicionar o criador aos convidados manualmente
      
      // Se há participantes selecionados, enviamos convites
      if (selectedParticipants.length > 0 && createdEvent && createdEvent.id) {
        try {
          await inviteUsers(createdEvent.id, selectedParticipants);
        } catch (error) {
          console.error('Erro ao convidar participantes:', error);
          // Não interrompemos o fluxo se falhar ao convidar, apenas notificamos
          Alert.alert(
            'Atenção',
            'O evento foi criado, mas ocorreu um erro ao enviar alguns convites. Você pode convidar participantes mais tarde.'
          );
        }
      }
      
      // Animação de saída
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        Alert.alert(
          'Sucesso',
          'Evento criado com sucesso!',
          [
            { 
              text: 'OK', 
              onPress: () => router.push('/(panel)/events')
            }
          ]
        );
      });
      
    } catch (error: any) {
      console.error('Erro ao criar evento:', error);
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível criar o evento. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  }, [
    title, 
    description, 
    startDate, 
    endDate, 
    location, 
    user?.currentRepublicId,
    selectedParticipants,
    validateForm, 
    createEvent,
    inviteUsers,
    fadeAnim, 
    router
  ]);
  
  return (
    <SafeAreaView style={sharedStyles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />
      
      <KeyboardAvoidingView 
        style={sharedStyles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={sharedStyles.headerContainer}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={sharedStyles.headerBackButton}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary.main} />
          </TouchableOpacity>
          <Text style={sharedStyles.headerTitle}>Criar Evento</Text>
        </View>
        
        <View style={{flex: 1}}>
          <ScrollView
            style={sharedStyles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            nestedScrollEnabled={true}
          >
            {/* Título */}
            <View style={sharedStyles.inputGroup}>
              <Text style={sharedStyles.inputLabel}>Título do Evento *</Text>
              <View style={[
                sharedStyles.inputContainer, 
                titleFocused && sharedStyles.inputFocused
              ]}>
                <Ionicons name="calendar" size={20} color={colors.primary.main} style={sharedStyles.buttonIcon} />
                <TextInput
                  style={sharedStyles.input}
                  placeholder="Digite o título do evento"
                  placeholderTextColor={colors.text.tertiary}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                  onFocus={() => setTitleFocused(true)}
                  onBlur={() => setTitleFocused(false)}
                  returnKeyType="next"
                />
              </View>
            </View>
            
            {/* Descrição */}
            <View style={sharedStyles.inputGroup}>
              <Text style={sharedStyles.inputLabel}>Descrição (opcional)</Text>
              <View style={[
                sharedStyles.inputContainer, 
                sharedStyles.textAreaContainer,
                descriptionFocused && sharedStyles.inputFocused
              ]}>
                <TextInput
                  style={[sharedStyles.input, sharedStyles.textArea]}
                  placeholder="Descreva mais sobre o evento"
                  placeholderTextColor={colors.text.tertiary}
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
            <View style={sharedStyles.inputGroup}>
              <Text style={sharedStyles.inputLabel}>Data e Hora de Início *</Text>
              <View style={eventsStyles.dateTimeContainer}>
                <TouchableOpacity 
                  style={eventsStyles.dateButton}
                  onPress={() => showDatePicker('start', 'date')}
                  accessibilityRole="button"
                  accessibilityLabel="Selecionar data de início"
                >
                  <Ionicons name="calendar" size={20} color={colors.primary.main} style={sharedStyles.buttonIcon} />
                  <Text style={eventsStyles.dateTimeText}>
                    {format(startDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={eventsStyles.timeButton}
                  onPress={() => showDatePicker('start', 'time')}
                  accessibilityRole="button"
                  accessibilityLabel="Selecionar hora de início"
                >
                  <Ionicons name="time" size={20} color={colors.primary.main} style={sharedStyles.buttonIcon} />
                  <Text style={eventsStyles.dateTimeText}>{formatTime(startDate)}</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Data de Término */}
            <View style={sharedStyles.inputGroup}>
              <Text style={sharedStyles.inputLabel}>Data e Hora de Término *</Text>
              <View style={eventsStyles.dateTimeContainer}>
                <TouchableOpacity 
                  style={eventsStyles.dateButton}
                  onPress={() => showDatePicker('end', 'date')}
                  accessibilityRole="button"
                  accessibilityLabel="Selecionar data de término"
                >
                  <Ionicons name="calendar" size={20} color={colors.primary.main} style={sharedStyles.buttonIcon} />
                  <Text style={eventsStyles.dateTimeText}>
                    {format(endDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={eventsStyles.timeButton}
                  onPress={() => showDatePicker('end', 'time')}
                  accessibilityRole="button"
                  accessibilityLabel="Selecionar hora de término"
                >
                  <Ionicons name="time" size={20} color={colors.primary.main} style={sharedStyles.buttonIcon} />
                  <Text style={eventsStyles.dateTimeText}>{formatTime(endDate)}</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Local do Evento */}
            <View style={sharedStyles.inputGroup}>
              <Text style={sharedStyles.inputLabel}>Local (opcional)</Text>
              <View style={[
                sharedStyles.inputContainer, 
                locationFocused && sharedStyles.inputFocused
              ]}>
                <Ionicons name="location" size={20} color={colors.primary.main} style={sharedStyles.buttonIcon} />
                <TextInput
                  style={sharedStyles.input}
                  placeholder="Local do evento"
                  placeholderTextColor={colors.text.tertiary}
                  value={location}
                  onChangeText={setLocation}
                  onFocus={() => setLocationFocused(true)}
                  onBlur={() => setLocationFocused(false)}
                  returnKeyType="done"
                />
              </View>
            </View>
            
            {/* Seção de Convite de Participantes */}
            {user?.currentRepublicId && (
              <InviteUsersSection
                republicId={user.currentRepublicId}
                selectedIds={selectedParticipants}
                onSelectionChange={setSelectedParticipants}
              />
            )}
            
            {/* Botão de Criar */}
            <TouchableOpacity 
              style={[
                sharedStyles.button,
                { backgroundColor: colors.primary.main },
                loading && sharedStyles.buttonDisabled
              ]}
              onPress={handleCreateEvent}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Criar evento"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#fff" style={sharedStyles.buttonIcon} />
                  <Text style={[sharedStyles.buttonText, { color: '#fff' }]}>Criar Evento</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
        
        {/* Date Pickers */}
        {(showStartDatePicker || showEndDatePicker) && (
          <DateTimePicker
            value={datePickerFor === 'start' ? startDate : endDate}
            mode={datePickerMode}
            is24Hour={true}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date(2030, 11, 31)}
            minimumDate={new Date()}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateEventScreen;