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

const PrivacyPolicyScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      <Stack.Screen
        options={{
          title: "Política de Privacidade",
          headerStyle: {
            backgroundColor: "#333",
          },
          headerTintColor: "#fff",
          headerShadowVisible: false,
        }}
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Política de Privacidade</Text>
          <Text style={styles.date}>Última atualização: 01 de março de 2025</Text>
          
          <View style={styles.section}>
            <Text style={styles.paragraph}>
              A RepHelper ("nós", "nosso" ou "RepHelper") está comprometida em proteger a privacidade e os dados pessoais dos usuários do aplicativo RepHelper ("Aplicativo"). Esta Política de Privacidade descreve como coletamos, usamos, compartilhamos e protegemos suas informações pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
            </Text>
            <Text style={styles.paragraph}>
              Ao usar nosso Aplicativo, você concorda com as práticas descritas nesta Política de Privacidade. Recomendamos que você leia este documento com atenção.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Definições</Text>
            <Text style={styles.paragraph}>
              Para os fins desta Política de Privacidade:
            </Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Dados Pessoais:</Text> Informações relacionadas a uma pessoa natural identificada ou identificável.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Tratamento:</Text> Toda operação realizada com dados pessoais, como coleta, uso, acesso, reprodução, transmissão, etc.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Titular:</Text> Pessoa natural a quem se referem os dados pessoais tratados.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Controlador:</Text> Pessoa a quem competem as decisões sobre o tratamento de dados pessoais (RepHelper).</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>ANPD:</Text> Autoridade Nacional de Proteção de Dados.</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Dados que Coletamos</Text>
            <Text style={styles.paragraph}>
              Podemos coletar os seguintes tipos de dados pessoais:
            </Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Dados de Cadastro:</Text> Nome, endereço de e-mail, número de telefone, informações de perfil como foto e apelido.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Dados de Uso:</Text> Interações com o Aplicativo, tarefas criadas, eventos, transações financeiras e registros de atividades.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Dados de Dispositivo:</Text> Tipo de dispositivo, sistema operacional, identificadores únicos de dispositivo, informações de rede e endereço IP.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Dados de Localização:</Text> Aproximada ou precisa, conforme permissões concedidas.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Conteúdo Criado:</Text> Informações que você fornece ao utilizar o Aplicativo, como comentários, tarefas e eventos.</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Base Legal para Tratamento</Text>
            <Text style={styles.paragraph}>
              Em conformidade com a LGPD, tratamos seus dados pessoais com base nas seguintes bases legais:
            </Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Consentimento:</Text> Quando você concorda expressamente com o uso de seus dados para uma finalidade específica.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Execução de Contrato:</Text> Para fornecer os serviços solicitados e cumprir os Termos de Uso.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Interesse Legítimo:</Text> Quando o tratamento é necessário para atender aos interesses legítimos da RepHelper ou de terceiros, sem prejudicar seus direitos e liberdades fundamentais.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Cumprimento de Obrigação Legal:</Text> Quando necessário para cumprir uma obrigação legal ou regulatória.</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Finalidades do Tratamento</Text>
            <Text style={styles.paragraph}>
              Utilizamos seus dados pessoais para:
            </Text>
            <Text style={styles.bulletPoint}>• Fornecer e manter o Aplicativo;</Text>
            <Text style={styles.bulletPoint}>• Permitir o gerenciamento de repúblicas e moradias compartilhadas;</Text>
            <Text style={styles.bulletPoint}>• Processar e facilitar a divisão de despesas entre moradores;</Text>
            <Text style={styles.bulletPoint}>• Coordenar tarefas e eventos compartilhados;</Text>
            <Text style={styles.bulletPoint}>• Autenticar usuários e proteger suas contas;</Text>
            <Text style={styles.bulletPoint}>• Personalizar sua experiência com o Aplicativo;</Text>
            <Text style={styles.bulletPoint}>• Enviar comunicações relacionadas ao serviço;</Text>
            <Text style={styles.bulletPoint}>• Melhorar e otimizar o Aplicativo;</Text>
            <Text style={styles.bulletPoint}>• Detectar, prevenir e resolver problemas técnicos ou de segurança;</Text>
            <Text style={styles.bulletPoint}>• Cumprir obrigações legais.</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Compartilhamento de Dados</Text>
            <Text style={styles.paragraph}>
              Podemos compartilhar seus dados pessoais nas seguintes circunstâncias:
            </Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Com outros membros da república:</Text> Informações de perfil, tarefas atribuídas, despesas compartilhadas e outras informações necessárias para o funcionamento do aplicativo.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Com prestadores de serviços:</Text> Empresas que nos fornecem serviços, como hospedagem, análise, processamento de pagamentos e atendimento ao cliente.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Por razões legais:</Text> Se acreditarmos de boa-fé que o acesso, uso, preservação ou divulgação dos dados é necessário para cumprir uma obrigação legal, processo legal ou solicitação governamental aplicável.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Proteção de direitos:</Text> Para detectar, prevenir ou resolver problemas técnicos, de segurança ou fraude.</Text>
            <Text style={styles.paragraph}>
              Todos os terceiros com quem compartilhamos dados estão sujeitos a obrigações de confidencialidade e devem implementar medidas de segurança adequadas.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Transferência Internacional de Dados</Text>
            <Text style={styles.paragraph}>
              Seus dados pessoais podem ser transferidos e processados em países fora do Brasil, onde mantemos servidores ou onde nossos prestadores de serviços operam. Adotamos salvaguardas contratuais e técnicas adequadas para garantir que seus dados continuem protegidos de acordo com esta Política e com a LGPD.
            </Text>
            <Text style={styles.paragraph}>
              Só transferimos dados para países ou organizações que proporcionem um grau de proteção adequado ou mediante a adoção de garantias e mecanismos que assegurem a observância dos princípios, direitos e obrigações estabelecidos pela LGPD.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Armazenamento e Segurança</Text>
            <Text style={styles.paragraph}>
              Mantemos medidas de segurança técnicas, administrativas e organizacionais projetadas para proteger seus dados pessoais contra acesso não autorizado, perda, destruição, alteração ou divulgação.
            </Text>
            <Text style={styles.paragraph}>
              Algumas medidas adotadas incluem:
            </Text>
            <Text style={styles.bulletPoint}>• Criptografia de dados em trânsito e em repouso;</Text>
            <Text style={styles.bulletPoint}>• Controles de acesso restritos para funcionários;</Text>
            <Text style={styles.bulletPoint}>• Auditorias de segurança regulares;</Text>
            <Text style={styles.bulletPoint}>• Monitoramento contínuo de ameaças.</Text>
            <Text style={styles.paragraph}>
              Mantemos seus dados pessoais apenas pelo tempo necessário para cumprir as finalidades para as quais foram coletados, a menos que um período de retenção mais longo seja necessário ou permitido por lei.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Seus Direitos como Titular de Dados</Text>
            <Text style={styles.paragraph}>
              De acordo com a LGPD, você tem os seguintes direitos em relação aos seus dados pessoais:
            </Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Confirmação e Acesso:</Text> Confirmar a existência de tratamento e acessar seus dados.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Correção:</Text> Solicitar a correção de dados incompletos, inexatos ou desatualizados.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Anonimização, Bloqueio ou Eliminação:</Text> Solicitar que dados desnecessários, excessivos ou tratados em desconformidade com a LGPD sejam anonimizados, bloqueados ou eliminados.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Portabilidade:</Text> Obter a portabilidade dos seus dados para outro serviço ou produto.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Eliminação:</Text> Solicitar a eliminação dos dados tratados com seu consentimento, quando aplicável.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Informação:</Text> Ser informado sobre entidades públicas e privadas com as quais compartilhamos seus dados.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Revogação do Consentimento:</Text> Revogar seu consentimento a qualquer momento.</Text>
            <Text style={styles.paragraph}>
              Para exercer seus direitos, entre em contato conosco através do e-mail privacidade@rephelper.com.br. Responderemos à sua solicitação em até 15 dias, conforme estabelecido pela LGPD.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Cookies e Tecnologias Semelhantes</Text>
            <Text style={styles.paragraph}>
              O Aplicativo pode utilizar cookies e tecnologias semelhantes para melhorar a experiência do usuário, lembrar preferências, entender como o Aplicativo é utilizado e personalizar conteúdo.
            </Text>
            <Text style={styles.paragraph}>
              Você pode gerenciar suas preferências de cookies através das configurações do seu dispositivo ou navegador, mas tenha em mente que a desativação de certos cookies pode afetar a funcionalidade do Aplicativo.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. Crianças e Adolescentes</Text>
            <Text style={styles.paragraph}>
              O Aplicativo não é destinado a menores de 16 anos. Não coletamos intencionalmente dados pessoais de crianças ou adolescentes. Se tomarmos conhecimento de que coletamos dados pessoais de um menor de 16 anos sem a autorização específica e verificável de seus pais ou responsáveis legais, tomaremos medidas para excluir essas informações de nossos servidores.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11. Alterações nesta Política</Text>
            <Text style={styles.paragraph}>
              Podemos atualizar esta Política de Privacidade periodicamente para refletir alterações em nossas práticas de privacidade ou por outros motivos operacionais, legais ou regulatórios.
            </Text>
            <Text style={styles.paragraph}>
              Notificaremos você sobre quaisquer alterações materiais por meio de uma notificação no Aplicativo ou por e-mail antes que as alterações entrem em vigor. Recomendamos que você revise periodicamente esta Política para se manter informado sobre como estamos protegendo suas informações.
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>12. Encarregado de Proteção de Dados (DPO)</Text>
            <Text style={styles.paragraph}>
              Em conformidade com a LGPD, designamos um Encarregado de Proteção de Dados (Data Protection Officer - DPO) responsável por atuar como canal de comunicação entre a RepHelper, os titulares dos dados e a Autoridade Nacional de Proteção de Dados (ANPD).
            </Text>
            <Text style={styles.paragraph}>
              Para entrar em contato com nosso DPO, envie um e-mail para: dpo@rephelper.com.br
            </Text>
          </View>
          
          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>Contato</Text>
            <Text style={styles.paragraph}>
              Se você tiver dúvidas, preocupações ou solicitações relacionadas a esta Política de Privacidade ou ao tratamento de seus dados pessoais, entre em contato conosco em:
            </Text>
            <Text style={styles.paragraph}>
              RepHelper Tecnologia Ltda.
            </Text>
            <Text style={styles.paragraph}>
              Av. Paulista, 1000, São Paulo - SP, 01310-100
            </Text>
            <Text style={styles.paragraph}>
              privacidade@rephelper.com.br
            </Text>
            <Text style={styles.paragraph}>
              Responderemos a todas as solicitações dentro de 15 dias, conforme exigido pela LGPD.
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
  boldText: {
    fontWeight: 'bold',
    color: '#fff',
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

export default PrivacyPolicyScreen; 