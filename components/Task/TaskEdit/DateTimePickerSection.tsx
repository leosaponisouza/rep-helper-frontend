// components/TaskEdit/DateTimePickerSection.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';

interface DateTimePickerSectionProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  isDatePickerVisible: boolean;
  setDatePickerVisibility: (visible: boolean) => void;
  datePickerMode: 'date' | 'time';
  setDatePickerMode: (mode: 'date' | 'time') => void;
}

const DateTimePickerSection: React.FC<DateTimePickerSectionProps> = ({
  control,
  setValue,
  watch,
  isDatePickerVisible,
  setDatePickerVisibility,
  datePickerMode,
  setDatePickerMode,
}) => {
  const handleDatePickerChange = (event: any, selectedDate?: Date) => {
    setDatePickerVisibility(Platform.OS === 'ios');
    
    if (selectedDate) {
      const currentDate = watch('dueDate') || new Date();
      
      if (datePickerMode === 'date') {
        // Keep time part from current selection or current time
        const mergedDate = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          currentDate.getHours(),
          currentDate.getMinutes()
        );
        setValue('dueDate', mergedDate);
        
        // If it's iOS, we'll now show the time picker
        if (Platform.OS === 'ios') {
          setDatePickerMode('time');
          setDatePickerVisibility(true);
        }
      } else { // time mode
        // Keep date part from current selection but update time
        const mergedDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          selectedDate.getHours(),
          selectedDate.getMinutes()
        );
        setValue('dueDate', mergedDate);
      }
    }
  };

  const showDatePicker = () => {
    setDatePickerMode('date');
    setDatePickerVisibility(true);
  };

  const showTimePicker = () => {
    setDatePickerMode('time');
    setDatePickerVisibility(true);
  };

  const formatDate = (date?: Date) => {
    if (!date) return null;
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (date?: Date) => {
    if (!date) return null;
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Data e Hora (opcional)</Text>
      <View style={styles.dateTimeContainer}>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={showDatePicker}
        >
          <View style={styles.dateButtonContent}>
            <Ionicons name="calendar" size={20} color="#7B68EE" />
            <Text style={styles.dateTimeText}>
              {watch('dueDate') ? formatDate(watch('dueDate')) : 'Selecionar data'}
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.timeButton}
          onPress={showTimePicker}
        >
          <View style={styles.dateButtonContent}>
            <Ionicons name="time" size={20} color="#7B68EE" />
            <Text style={styles.dateTimeText}>
              {watch('dueDate') ? formatTime(watch('dueDate')) : 'Hora'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {isDatePickerVisible && (
        <DateTimePicker
          value={watch('dueDate') || new Date()}
          mode={datePickerMode}
          display="default"
          onChange={handleDatePickerChange}
          minimumDate={new Date()}
        />
      )}
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
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateButton: {
    flex: 0.65,
    backgroundColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#444',
    marginRight: 8,
  },
  timeButton: {
    flex: 0.35,
    backgroundColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default DateTimePickerSection;