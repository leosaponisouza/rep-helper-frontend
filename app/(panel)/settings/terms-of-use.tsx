import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Stack } from 'expo-router';

const TermsOfUseScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      <Stack.Screen
        options={{
          title: "Termos de Uso",
          headerStyle: {
            backgroundColor: "#333",
          },
          headerTintColor: "#fff",
          headerShadowVisible: false,
        }}
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Termos de Uso</Text>
          <Text style={styles.date}>Última atualização: 01 de março de 2025</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Aceitação dos Termos</Text>
            <Text style={styles.paragraph}>
              Ao acessar ou utilizar o aplicativo RepHelper ("Aplicativo"), você concorda com estes Termos de Uso. Se você não concordar com qualquer parte destes termos, por favor, não utilize o Aplicativo.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Descrição do Serviço</Text>
            <Text style={styles.paragraph}>
              O RepHelper é um aplicativo que oferece serviços de gerenciamento para repúblicas e moradias compartilhadas, incluindo gestão de tarefas, despesas e eventos entre moradores.
            </Text>
            <Text style={styles.paragraph}>
              Os serviços oferecidos pelo Aplicativo estão sujeitos a alterações a critério da RepHelper, sem aviso prévio.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Cadastro e Responsabilidades</Text>
            <Text style={styles.paragraph}>
              3.1. Para utilizar o Aplicativo, é necessário criar uma conta fornecendo informações precisas e completas.
            </Text>
            <Text style={styles.paragraph}>
              3.2. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorrem em sua conta.
            </Text>
            <Text style={styles.paragraph}>
              3.3. Você concorda em notificar imediatamente o RepHelper sobre qualquer uso não autorizado de sua conta ou qualquer outra violação de segurança.
            </Text>
            <Text style={styles.paragraph}>
              3.4. O RepHelper não será responsável por quaisquer perdas ou danos decorrentes do seu não cumprimento desta seção.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Uso do Aplicativo</Text>
            <Text style={styles.paragraph}>
              4.1. Você concorda em utilizar o Aplicativo apenas para fins legais e de acordo com estes Termos.
            </Text>
            <Text style={styles.paragraph}>
              4.2. Você não pode:
            </Text>
            <Text style={styles.bulletPoint}>• Utilizar o Aplicativo de qualquer maneira que possa danificar, desabilitar ou sobrecarregar o Aplicativo;</Text>
            <Text style={styles.bulletPoint}>• Tentar acessar áreas restritas do Aplicativo;</Text>
            <Text style={styles.bulletPoint}>• Utilizar robots, spiders ou outros dispositivos automáticos para acessar o Aplicativo;</Text>
            <Text style={styles.bulletPoint}>• Introduzir vírus, trojan, worms ou outro material malicioso no Aplicativo;</Text>
            <Text style={styles.bulletPoint}>• Coletar informações pessoais de outros usuários sem consentimento;</Text>
            <Text style={styles.bulletPoint}>• Violar quaisquer leis ou regulamentos aplicáveis.</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Propriedade Intelectual</Text>
            <Text style={styles.paragraph}>
              5.1. O conteúdo, recursos e funcionalidades do Aplicativo, incluindo textos, gráficos, logos, ícones e imagens, são propriedade do RepHelper e estão protegidos por leis de direitos autorais, marcas comerciais e outras leis de propriedade intelectual.
            </Text>
            <Text style={styles.paragraph}>
              5.2. Você não tem permissão para copiar, modificar, distribuir, vender ou alugar qualquer parte do Aplicativo ou seu conteúdo, nem para realizar engenharia reversa ou tentar extrair o código fonte do Aplicativo.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Conteúdo do Usuário</Text>
            <Text style={styles.paragraph}>
              6.1. O Aplicativo permite que os usuários publiquem, enviem ou transmitam conteúdo, como tarefas, eventos, transações financeiras e comentários ("Conteúdo do Usuário").
            </Text>
            <Text style={styles.paragraph}>
              6.2. Você mantém a propriedade sobre seu Conteúdo do Usuário, mas concede ao RepHelper uma licença mundial, não exclusiva, livre de royalties para usar, reproduzir, modificar, adaptar, publicar e exibir tal conteúdo no Aplicativo e em todos os serviços relacionados.
            </Text>
            <Text style={styles.paragraph}>
              6.3. Você é o único responsável por seu Conteúdo do Usuário e pelas consequências de publicá-lo ou compartilhá-lo.
            </Text>
            <Text style={styles.paragraph}>
              6.4. O RepHelper não garante a precisão, integridade ou qualidade do Conteúdo do Usuário e não endossa qualquer opinião expressa por qualquer usuário.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Privacidade</Text>
            <Text style={styles.paragraph}>
              7.1. O uso do Aplicativo está sujeito à nossa Política de Privacidade, que descreve como coletamos, usamos e compartilhamos suas informações.
            </Text>
            <Text style={styles.paragraph}>
              7.2. Ao utilizar o Aplicativo, você consente com a coleta e uso de suas informações conforme descrito na Política de Privacidade.
            </Text>
            <Text style={styles.paragraph}>
              7.3. Estamos comprometidos em respeitar a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e outras leis de privacidade aplicáveis.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Modificações do Serviço e dos Termos</Text>
            <Text style={styles.paragraph}>
              8.1. O RepHelper reserva-se o direito de modificar ou descontinuar, temporariamente ou permanentemente, o Aplicativo ou qualquer recurso ou parte dele, a qualquer momento e sem aviso prévio.
            </Text>
            <Text style={styles.paragraph}>
              8.2. O RepHelper também pode atualizar estes Termos de Uso a qualquer momento. Você será notificado sobre quaisquer alterações materiais nestes Termos.
            </Text>
            <Text style={styles.paragraph}>
              8.3. O uso contínuo do Aplicativo após tais modificações constitui sua aceitação dos Termos modificados.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Limitação de Responsabilidade</Text>
            <Text style={styles.paragraph}>
              9.1. O Aplicativo é fornecido "como está" e "conforme disponível", sem garantias de qualquer tipo, expressas ou implícitas.
            </Text>
            <Text style={styles.paragraph}>
              9.2. O RepHelper não garante que o Aplicativo funcionará sem interrupções, de maneira segura ou livre de erros, nem que os defeitos serão corrigidos.
            </Text>
            <Text style={styles.paragraph}>
              9.3. O RepHelper não será responsável por quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo perdas de lucros, dados ou uso.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Indenização</Text>
            <Text style={styles.paragraph}>
              Você concorda em defender, indenizar e isentar o RepHelper e seus funcionários, diretores, agentes e parceiros de e contra quaisquer reivindicações, danos, obrigações, perdas, responsabilidades, custos ou dívidas e despesas decorrentes de: (i) seu uso e acesso ao Aplicativo; (ii) sua violação de qualquer termo destes Termos; (iii) sua violação de quaisquer direitos de terceiros, incluindo sem limitação quaisquer direitos autorais, de propriedade ou de privacidade.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Lei Aplicável e Jurisdição</Text>
            <Text style={styles.paragraph}>
              Estes Termos serão regidos e interpretados de acordo com as leis da República Federativa do Brasil. Qualquer disputa decorrente ou relacionada a estes Termos será submetida à jurisdição exclusiva dos tribunais da cidade de São Paulo, Brasil.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>12. Disposições Gerais</Text>
            <Text style={styles.paragraph}>
              12.1. Estes Termos constituem o acordo integral entre você e o RepHelper em relação ao uso do Aplicativo.
            </Text>
            <Text style={styles.paragraph}>
              12.2. A falha do RepHelper em exercer ou fazer cumprir qualquer direito ou disposição destes Termos não constituirá uma renúncia a tal direito ou disposição.
            </Text>
            <Text style={styles.paragraph}>
              12.3. Se qualquer disposição destes Termos for considerada inválida ou inexequível por um tribunal, as disposições restantes permanecerão em pleno vigor e efeito.
            </Text>
            <Text style={styles.paragraph}>
              12.4. Você não pode ceder ou transferir estes Termos, por força de lei ou de outra forma, sem o consentimento prévio por escrito do RepHelper.
            </Text>
            <Text style={styles.paragraph}>
              12.5. O RepHelper pode ceder estes Termos, no todo ou em parte, a qualquer momento, com ou sem aviso prévio.
            </Text>
          </View>
          
          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>Contato</Text>
            <Text style={styles.paragraph}>
              Se você tiver alguma dúvida sobre estes Termos de Uso, entre em contato conosco pelo e-mail: suporte@rephelper.com.br
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
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 15,
    color: '#ddd',
    marginBottom: 10,
    lineHeight: 22,
  },
  bulletPoint: {
    fontSize: 15,
    color: '#ddd',
    marginBottom: 6,
    lineHeight: 22,
    paddingLeft: 15,
  },
  contactSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
});

export default TermsOfUseScreen; 