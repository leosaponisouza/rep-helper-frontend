import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { Stack } from 'expo-router';

// Lista de bibliotecas utilizadas com suas licenças
const libraries = [
  {
    name: 'React Native',
    version: '0.72.6',
    license: 'MIT',
    website: 'https://reactnative.dev/',
    description: 'Framework para desenvolvimento de aplicações móveis multiplataforma.',
  },
  {
    name: 'Expo',
    version: '~49.0.8',
    license: 'MIT',
    website: 'https://expo.dev/',
    description: 'Plataforma para criar aplicativos React Native universais para Android, iOS e web.',
  },
  {
    name: 'React Navigation',
    version: '6.0.0',
    license: 'MIT',
    website: 'https://reactnavigation.org/',
    description: 'Biblioteca de navegação para React Native.',
  },
  {
    name: 'React Native Reanimated',
    version: '~3.3.0',
    license: 'MIT',
    website: 'https://docs.swmansion.com/react-native-reanimated/',
    description: 'Biblioteca de animações para React Native.',
  },
  {
    name: 'Tamagui',
    version: '1.74.8',
    license: 'MIT',
    website: 'https://tamagui.dev/',
    description: 'UI Kit para React Native e Web.',
  },
  {
    name: 'Zustand',
    version: '4.4.1',
    license: 'MIT',
    website: 'https://github.com/pmndrs/zustand',
    description: 'Biblioteca de gerenciamento de estado mínima e simples.',
  },
  {
    name: 'Axios',
    version: '1.5.0',
    license: 'MIT',
    website: 'https://axios-http.com/',
    description: 'Cliente HTTP baseado em promessas para navegador e Node.js.',
  },
  {
    name: 'React Native Async Storage',
    version: '~1.18.2',
    license: 'MIT',
    website: 'https://github.com/react-native-async-storage/async-storage',
    description: 'Sistema de armazenamento local assíncrono para React Native.',
  },
  {
    name: 'React Native Safe Area Context',
    version: '4.6.3',
    license: 'MIT',
    website: 'https://github.com/th3rdwave/react-native-safe-area-context',
    description: 'Fornece informações sobre áreas seguras para diferentes dispositivos.',
  },
  {
    name: 'React Native Gesture Handler',
    version: '~2.12.0',
    license: 'MIT',
    website: 'https://docs.swmansion.com/react-native-gesture-handler/',
    description: 'API declarativa para gestos em React Native.',
  },
  {
    name: 'React Native Vector Icons',
    version: '10.0.0',
    license: 'MIT',
    website: 'https://github.com/oblador/react-native-vector-icons',
    description: 'Conjunto de ícones personalizáveis para React Native.',
  },
  {
    name: 'Moment.js',
    version: '2.29.4',
    license: 'MIT',
    website: 'https://momentjs.com/',
    description: 'Biblioteca para manipulação de datas em JavaScript.',
  },
];

const SoftwareLicensesScreen = () => {
  const openWebsite = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('Não foi possível abrir a URL:', err));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      <Stack.Screen
        options={{
          title: "Licenças de Software",
          headerStyle: {
            backgroundColor: "#333",
          },
          headerTintColor: "#fff",
          headerShadowVisible: false,
        }}
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Licenças de Software</Text>
          <Text style={styles.paragraph}>
            O RepHelper utiliza diversas bibliotecas e ferramentas de código aberto para fornecer suas funcionalidades.
            Esta página lista os componentes de software de terceiros utilizados no desenvolvimento deste aplicativo,
            juntamente com suas respectivas licenças.
          </Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bibliotecas e Componentes</Text>
            
            {libraries.map((lib, index) => (
              <View key={index} style={styles.libraryItem}>
                <View style={styles.libraryHeader}>
                  <Text style={styles.libraryName}>{lib.name}</Text>
                  <Text style={styles.libraryVersion}>v{lib.version}</Text>
                </View>
                <Text style={styles.libraryDescription}>{lib.description}</Text>
                <View style={styles.libraryFooter}>
                  <Text style={styles.licenseText}>Licença: {lib.license}</Text>
                  <TouchableOpacity onPress={() => openWebsite(lib.website)}>
                    <Text style={styles.websiteLink}>Visitar site</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre Licenças MIT</Text>
            <Text style={styles.paragraph}>
              A maioria das bibliotecas utilizadas neste aplicativo está sob a Licença MIT, uma licença permissiva que
              permite o uso, cópia, modificação, fusão, publicação, distribuição, sublicenciamento e/ou venda de cópias
              do software, desde que o aviso de copyright e este aviso de permissão sejam incluídos em todas as cópias ou
              partes substanciais do software.
            </Text>
            <Text style={styles.paragraph}>
              Texto completo da Licença MIT:
            </Text>
            <Text style={styles.licenseText}>
              Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
              associated documentation files (the "Software"), to deal in the Software without restriction, including
              without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
              copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
              following conditions:
            </Text>
            <Text style={styles.licenseText}>
              The above copyright notice and this permission notice shall be included in all copies or substantial
              portions of the Software.
            </Text>
            <Text style={styles.licenseText}>
              THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
              LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO
              EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
              IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
              USE OR OTHER DEALINGS IN THE SOFTWARE.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Licenças Adicionais</Text>
            <Text style={styles.paragraph}>
              Para obter informações detalhadas sobre outras licenças utilizadas neste aplicativo, entre em contato com
              nossa equipe de desenvolvimento através do e-mail dev@rephelper.com.br.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Agradecimentos</Text>
            <Text style={styles.paragraph}>
              Agradecemos a todos os desenvolvedores e mantenedores das bibliotecas de código aberto que tornaram
              possível a criação deste aplicativo. Seu trabalho e dedicação à comunidade de desenvolvimento são
              inestimáveis.
            </Text>
          </View>
        </View>
      </ScrollView>
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
    backgroundColor: '#222',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7B68EE',
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 15,
    color: '#ddd',
    marginBottom: 16,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    marginTop: 8,
  },
  libraryItem: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#7B68EE',
  },
  libraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  libraryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  libraryVersion: {
    fontSize: 14,
    color: '#aaa',
  },
  libraryDescription: {
    fontSize: 14,
    color: '#ddd',
    marginBottom: 10,
  },
  libraryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  licenseText: {
    fontSize: 14,
    color: '#bbb',
    marginBottom: 8,
    lineHeight: 20,
  },
  websiteLink: {
    fontSize: 14,
    color: '#7B68EE',
    textDecorationLine: 'underline',
  },
});

export default SoftwareLicensesScreen; 