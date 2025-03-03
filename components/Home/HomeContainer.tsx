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
    <SafeAreaView 
      style={styles.safeArea} 
      edges={['top', 'right', 'left']}
    >
      <StatusBar barStyle="light-content" backgroundColor="#7B68EE" />
      
      {/* Gradiente de fundo que se estende até o topo */}
      <View style={styles.headerBackground}>
        <LinearGradient
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
    backgroundColor: '#7B68EE',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200, // Altura do gradiente
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
    paddingBottom: 30,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    // Padding para começar abaixo do header roxo
    paddingTop: 120,
  }
});

export default HomeContainer;