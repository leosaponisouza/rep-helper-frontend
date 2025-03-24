// components/TaskEdit/TitleDescriptionInputs.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Controller, Control, FieldErrors } from 'react-hook-form';

interface TitleDescriptionInputsProps {
  control: Control<any>;
  errors: FieldErrors<any>;
}

const TitleDescriptionInputs: React.FC<TitleDescriptionInputsProps> = ({ control, errors }) => {
  return (
    <>
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, value } }) => (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Título da Tarefa</Text>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={onChange}
              placeholder="Digite o título da tarefa"
              placeholderTextColor="#aaa"
            />
            {errors.title && (
              <Text style={styles.errorText}>
                {errors.title.message as string}
              </Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, value } }) => (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Descrição (opcional)</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={value}
              onChangeText={onChange}
              placeholder="Descrição detalhada da tarefa"
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={4}
            />
          </View>
        )}
      />
    </>
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
  input: {
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  multilineInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#FF6347',
    fontSize: 12,
    marginTop: 5,
  },
});

export default TitleDescriptionInputs;