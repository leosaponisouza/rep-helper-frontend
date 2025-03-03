// components/Home/HomeContainer.tsx
import React from 'react';
import { 
  StyleSheet, 
  View, 
  StatusBar, 
  Platform,
  ScrollView, 
  RefreshControl,
  SafeAreaView
} from 'react-native';
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
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content" 
        backgroundColor="#222" // Cor de fundo da status bar
        translucent={false}
      />
      
      {/* Background do header */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160, // Altura menor para o background do header
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
    paddingTop: 160, // Mesmo valor que a altura do headerBackground
    backgroundColor: '#222',
    paddingBottom: 30,
  },
});

export default HomeContainer;