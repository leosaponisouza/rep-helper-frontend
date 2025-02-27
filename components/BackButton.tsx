// ../components/BackButton.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Ou outra biblioteca de ícones
import { useRouter } from 'expo-router';

interface BackButtonProps {
  color?: string; // Cor do ícone e do texto (opcional)
}

const BackButton: React.FC<BackButtonProps> = ({ color = '#7B68EE' }) => { // Valor padrão para a cor
  const router = useRouter();

  const handleGoBack = () => {
    if (router.canGoBack()) { // Verifica se é possível voltar
      router.back();        // Volta para a tela anterior
    } else {
      // Opcional: Lógica para lidar com o caso em que não há tela anterior (ex: navegar para uma tela padrão)
      // router.replace('/'); // Exemplo: redireciona para a raiz
       console.warn("Cannot go back. No previous screen in history.");
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleGoBack}>
      <Ionicons name="arrow-back" size={24} color={color} />
      <Text style={[styles.text, { color: color }]}>Voltar</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row', // Ícone e texto lado a lado
    alignItems: 'center',
    padding: 10,
    position: 'absolute', // Posiciona o botão de forma absoluta
    top: 10,           // Distância do topo (ajuste conforme necessário)
    left: 10,         // Distância da esquerda
    zIndex: 1,          // Garante que o botão fique acima de outros elementos
    backgroundColor: 'transparent', // Sem fundo

  },
  text: {
    marginLeft: 8, // Espaçamento entre o ícone e o texto
    fontSize: 16,
  },
});

export default BackButton;