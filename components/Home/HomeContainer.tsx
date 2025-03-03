// components/Home/HomeContainer.tsx
import React from 'react';
import { 
  StyleSheet, 
  View, 
  StatusBar, 
  Platform,
  ScrollView, 
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface HomeContainerProps {
  children: React.ReactNode;
  refreshing: boolean;
  onRefresh: () => void;
}

const HomeContainer: React.FC<HomeContainerProps> = ({ 
  children, 
  refreshing, 
  onRefresh 
}) => {
  return (
<SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'right', 'left']}>
<StatusBar
    barStyle="light-content" 
    backgroundColor="#7B68EE" // Mesma cor do header
  />

<View style={styles.headerBackground}>
    <LinearGradient
      // Se quiser o mesmo roxo em todo o topo, use a mesma cor
      // colors={['#7B68EE', '#7B68EE']}
      // Ou mantenha seu degradê:
      colors={['#7B68EE', '#6A5ACD']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    />
  </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#7B68EE']}
            tintColor={'#7B68EE'}
            progressBackgroundColor="#333"
          />
        }
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    // Deixe como transparente, pois o gradiente já cuida do fundo
    backgroundColor: 'transparent'
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // Ajuste essa altura para cobrir a StatusBar + parte do header
    height: 200,
    zIndex: 0,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    // Aumente este paddingTop para ficar abaixo do gradiente
    paddingTop: 200,
    backgroundColor: '#1a1a1a',
    paddingBottom: 30,
  },
});

export default HomeContainer;