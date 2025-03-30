// app/republic/join.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as republicService from '../../src/services/republicService';

const JoinRepublicScreen = () => {
  const { login } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleJoinRepublic = async () => {
    if (!code.trim()) {
      Alert.alert('Erro', 'Por favor, insira o código da república');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await republicService.joinRepublic(code.trim());
      
      // Atualizar contexto de autenticação com os novos dados do usuário
      login(response.token, response.user);
      
      Alert.alert(
        'Sucesso', 
        'Você entrou na república com sucesso!',
        [{ text: 'OK', onPress: () => router.replace('/(panel)/home') }]
      );
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível entrar na república');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      <View style={styles.content}>
        <Text style={styles.title}>Entrar em uma República</Text>
        <Text style={styles.subtitle}>
          Digite o código fornecido pelo administrador da república
        </Text>
        
        <View style={styles.inputContainer}>
          <Ionicons name="key" size={20} color="#7B68EE" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Código da República"
            placeholderTextColor="#999"
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleJoinRepublic}
          disabled={loading || !code.trim()}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="log-in" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Entrar na República</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#7B68EE" style={styles.buttonIcon} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    paddingHorizontal: 15,
    marginBottom: 20,
    width: '100%',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B68EE',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#555',
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#7B68EE',
    fontSize: 16,
    fontWeight: '500',
  }
});

export default JoinRepublicScreen;