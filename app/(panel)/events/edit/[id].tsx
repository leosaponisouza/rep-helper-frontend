// app/(panel)/events/edit/[id].tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Keyboard,
  Animated
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEvents } from '../../../../src/hooks/useEvents';
import { useAuth } from '../../../../src/context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EventsService } from '../../../../src/services/events';

// Importar estilos compartilhados
import { sharedStyles, colors } from '../../../../src/styles/sharedStyles';
import eventsStyles from '../../../../src/styles/eventStyles';
import { formatToBackendDateTime } from '@/src/utils/dateUtils';

// Importar componente de convite de usuários
import InviteUsersSection from '@/components/Event/InviteUsersSection';

const EditEventScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { updateEvent, isCurrentUserCreator, inviteUsers } = useEvents();
  
  // Animações
  const fadeAnim = useState(new Animated.Value(0))[0];
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [event, setEvent] = useState<any | null>(null);
  
  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');
  const [datePickerFor, setDatePickerFor] = useState<'start' | 'end'>('start');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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
  
  // Carregar os dados do evento
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!id) return;
      
      try {
        setInitialLoading(true);
        const eventData = await EventsService.getEventById(id);
        
        if (!eventData) {
          Alert.alert('Erro', 'Evento não encontrado.');
          router.back();
          return;
        }

        // Verificar se o usuário tem permissão para editar
        const isCreator = !!user && user.uid === eventData.creatorId;
        if (!isCreator) {
          Alert.alert('Erro', 'Você não tem permissão para editar este evento');
          router.back();
          return;
        }
        
        setEvent(eventData);
        setTitle(eventData.title);
        setDescription(eventData.description || '');
        setLocation(eventData.location || '');
        setStartDate(parseISO(eventData.startDate));
        setEndDate(parseISO(eventData.endDate));

        // Carregar participantes existentes, se disponíveis
        if (eventData.invitations) {
          const participantIds = eventData.invitations.map((invitation) => invitation.userId);
          setSelectedParticipants(participantIds);
        }
      } catch (error: any) {
        console.error("Error fetching event:", error);
        
        // Extrair a mensagem de erro mais específica se disponível
        const errorMessage = error?.message || 
                            error?.originalError?.message || 
                            'Não foi possível carregar o evento';
                            
        Alert.alert('Erro', errorMessage);
        router.back();
      } finally {
        setInitialLoading(false);
      }
    };

    fetchEventDetails();
  }, [id, user, router]);
  
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
          const newEndDate = new Date(newDate);
          newEndDate.setHours(newDate.getHours() + 2);
          setEndDate(newEndDate);
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
        
        // Ajusta a data de término se necessário
        if (isBefore(endDate, newDate)) {
          const newEndDate = new Date(newDate);
          newEndDate.setHours(newDate.getHours() + 2);
          setEndDate(newEndDate);
        }
        
        if (Platform.OS === 'ios') {
          setShowStartDatePicker(false);
        }
      }
    } else {
      // Para data/hora de término
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
        
        // Não permite data de término anterior à data de início
        if (isBefore(newDate, startDate)) {
          Alert.alert('Atenção', 'A data de término não pode ser anterior à data de início');
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
  }, [startDate, endDate, datePickerFor, datePickerMode]);
  
  // Formatação das datas para exibição - otimizada
  const formatDate = useCallback((date: Date) => {
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  }, []);
  
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
  
  // Atualizar evento
  const handleUpdateEvent = useCallback(async () => {
    Keyboard.dismiss();
    
    if (!validateForm() || !id) return;
    
    setLoading(true);
    
    try {
      const eventData = {
        title: title.trim(),
        description: description.trim() || '',
        // Use a nova função que gera formato compatível com LocalDateTime do Java
        startDate: formatToBackendDateTime(startDate),
        endDate: formatToBackendDateTime(endDate),
        location: location.trim() || ''
      };
      
      await updateEvent(parseInt(id), eventData);
      
      // Atualizar participantes se necessário
      // O criador do evento já é automaticamente um participante confirmado
      // e não precisa ser incluído na lista de convites
      if (selectedParticipants.length > 0) {
        await inviteUsers(parseInt(id), selectedParticipants);
      }
      
      // Animação de saída
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        Alert.alert(
          'Sucesso',
          'Evento atualizado com sucesso!',
          [
            {
              text: 'OK',
              onPress: () => router.push(`/(panel)/events/${id}`)
            }
          ]
        );
      });
    } catch (error: any) {
      console.error('Erro ao atualizar evento:', error);
      
      // Extrair a mensagem de erro mais específica se disponível
      const errorMessage = error?.message || 
                          error?.originalError?.message || 
                          'Não foi possível atualizar o evento. Tente novamente.';
                          
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [title, description, startDate, endDate, location, validateForm, id, updateEvent, fadeAnim, router, selectedParticipants, inviteUsers]);

  
  if (initialLoading) {
    return (
      <SafeAreaView style={sharedStyles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />
        <View style={sharedStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={sharedStyles.loadingText}>Carregando evento...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
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
          <Text style={sharedStyles.headerTitle}>Editar Evento</Text>
        </View>
        
        <Animated.ScrollView 
          style={[sharedStyles.scrollContainer, { opacity: fadeAnim }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }} // Adiciona padding extra no final para evitar que conteúdo seja cortado
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
                <Text style={eventsStyles.dateTimeText}>{formatDate(startDate)}</Text>
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
                <Text style={eventsStyles.dateTimeText}>{formatDate(endDate)}</Text>
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
          
          {/* Botão para gerenciar convites */}
          <TouchableOpacity 
            style={[
              sharedStyles.button,
              sharedStyles.buttonSecondary,
              { marginBottom: 5, marginTop: 0 } // Ajuste para espaçamento adequado
            ]}
            onPress={() => router.push(`/(panel)/events/invitations/${id}`)}
            accessibilityRole="button"
            accessibilityLabel="Gerenciar convidados"
          >
            <Ionicons name="people" size={20} color={colors.primary.main} style={sharedStyles.buttonIcon} />
            <Text style={[sharedStyles.buttonText, sharedStyles.buttonTextSecondary]}>Gerenciar Convidados</Text>
          </TouchableOpacity>
          {/* Botão de Atualizar */}
          <View style={{ marginTop: 20, marginBottom: 60 }}>
            <TouchableOpacity 
              style={[
                sharedStyles.button, 
                loading && sharedStyles.buttonDisabled
              ]}
              onPress={handleUpdateEvent}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Atualizar evento"
              accessibilityHint="Salva as alterações feitas no evento"
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.text.primary} />
              ) : (
                <>
                  <Ionicons name="save" size={20} color={colors.text.primary} style={sharedStyles.buttonIcon} />
                  <Text style={sharedStyles.buttonText}>Atualizar Evento</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          
         
        </Animated.ScrollView>
        
        {/* Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode={datePickerMode}
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
            textColor={Platform.OS === 'ios' ? '#fff' : undefined}
          />
        )}
        
        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode={datePickerMode}
            display="default"
            onChange={handleDateChange}
            minimumDate={datePickerMode === 'date' ? startDate : undefined}
            textColor={Platform.OS === 'ios' ? '#fff' : undefined}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditEventScreen;