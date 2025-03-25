import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Linking
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface HelpSectionProps {
  title: string;
  children: React.ReactNode;
  initiallyExpanded?: boolean;
}

// Componente para cada seção expansível
const HelpSection: React.FC<HelpSectionProps> = ({ 
  title, 
  children, 
  initiallyExpanded = false 
}) => {
  const [expanded, setExpanded] = useState(initiallyExpanded);

  return (
    <View style={styles.helpSection}>
      <TouchableOpacity 
        style={styles.helpSectionHeader} 
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.helpSectionTitle}>{title}</Text>
        <Ionicons 
          name={expanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#7B68EE" 
        />
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.helpSectionContent}>
          {children}
        </View>
      )}
    </View>
  );
};

// Componente para cada item de ajuda simples
const HelpItem = ({ title, description }: { title: string; description: string }) => (
  <View style={styles.helpItem}>
    <Text style={styles.helpItemTitle}>{title}</Text>
    <Text style={styles.helpItemDescription}>{description}</Text>
  </View>
);

// Componente para cada tópico com passo a passo
const HelpTopic = ({ 
  title, 
  steps 
}: { 
  title: string; 
  steps: string[]; 
}) => (
  <View style={styles.helpTopic}>
    <Text style={styles.helpTopicTitle}>{title}</Text>
    {steps.map((step, index) => (
      <View key={index} style={styles.stepRow}>
        <View style={styles.stepNumberContainer}>
          <Text style={styles.stepNumber}>{index + 1}</Text>
        </View>
        <Text style={styles.stepText}>{step}</Text>
      </View>
    ))}
  </View>
);

const HelpScreen = () => {
  const router = useRouter();
  
  const openEmailSupport = () => {
    Linking.openURL('mailto:suporte@rephelper.com.br?subject=Suporte%20RepHelper');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#222" />
      
      <Stack.Screen
        options={{
          title: "Ajuda",
          headerStyle: {
            backgroundColor: "#333",
          },
          headerTintColor: "#fff",
          headerShadowVisible: false,
        }}
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Central de Ajuda</Text>
          <Text style={styles.introText}>
            Aqui você encontra dicas, tutoriais e respostas para as dúvidas mais comuns sobre o RepHelper.
          </Text>
        </View>

        <HelpSection title="Primeiros Passos" initiallyExpanded={true}>
          <HelpItem 
            title="O que é o RepHelper?" 
            description="O RepHelper é um aplicativo desenvolvido para facilitar a gestão de repúblicas e moradias compartilhadas. Com ele, é possível organizar tarefas, eventos, finanças e muito mais."
          />
          <HelpItem 
            title="Como começar?" 
            description="Ao fazer login pela primeira vez, você pode criar uma nova república ou se juntar a uma existente usando um código de convite. Em seguida, configure seu perfil e comece a usar os recursos disponíveis."
          />
        </HelpSection>
        
        <HelpSection title="Gestão de Tarefas">
          <HelpTopic 
            title="Como criar uma tarefa" 
            steps={[
              "Acesse a seção 'Tarefas' no menu principal",
              "Toque no botão '+' no canto inferior direito",
              "Preencha as informações da tarefa (título, descrição, data, etc.)",
              "Você pode atribuir a tarefa a outros membros da república",
              "Toque em 'Criar Tarefa' para finalizar"
            ]}
          />
          <HelpTopic 
            title="Tarefas recorrentes" 
            steps={[
              "Ao criar uma tarefa, ative a opção 'Repetir'",
              "Selecione a frequência (diária, semanal, mensal, etc.)",
              "Defina o intervalo de repetição",
              "As tarefas serão automaticamente criadas com base na recorrência configurada"
            ]}
          />
        </HelpSection>
        
        <HelpSection title="Eventos">
          <HelpTopic 
            title="Como criar um evento" 
            steps={[
              "Acesse a seção 'Eventos' no menu principal",
              "Toque no botão '+' ou 'Criar Evento'",
              "Preencha o título, descrição, data e hora",
              "Você pode convidar membros específicos da república",
              "Toque em 'Criar Evento' para finalizar"
            ]}
          />
          <HelpItem 
            title="Confirmação de presença" 
            description="Os membros convidados podem confirmar, recusar ou deixar pendente a participação no evento. Isso ajuda o organizador a planejar melhor."
          />
        </HelpSection>
        
        <HelpSection title="Gestão Financeira">
          <HelpTopic 
            title="Registrar despesas" 
            steps={[
              "Acesse a seção 'Finanças' no menu principal",
              "Toque em 'Nova Despesa'",
              "Preencha o valor, descrição e categoria",
              "Você pode dividir a despesa entre os membros",
              "Confirme a criação da despesa"
            ]}
          />
          <HelpTopic 
            title="Registrar receitas" 
            steps={[
              "Acesse a seção 'Finanças'",
              "Toque em 'Nova Receita'",
              "Preencha o valor, descrição e categoria",
              "Confirme a criação da receita"
            ]}
          />
          <HelpItem 
            title="Balanço financeiro" 
            description="Na tela inicial de Finanças, você pode visualizar um resumo do saldo atual, receitas e despesas do mês, além de pendências de pagamento."
          />
        </HelpSection>
        
        <HelpSection title="Gerenciamento de Membros">
          <HelpTopic 
            title="Convidar novos membros" 
            steps={[
              "Acesse 'Configurações > Membros'",
              "Toque em 'Convidar Membro'",
              "Você pode enviar um link de convite ou código diretamente",
              "O novo membro precisará criar uma conta caso ainda não tenha"
            ]}
          />
          <HelpItem 
            title="Funções dos membros" 
            description="Existem três níveis de acesso: Proprietário (controle total), Administrador (gerencia tarefas, eventos e membros) e Membro (funções básicas). Apenas o Proprietário pode transferir a propriedade."
          />
        </HelpSection>
        
        <HelpSection title="Perfil e Configurações">
          <HelpTopic 
            title="Alterar informações do perfil" 
            steps={[
              "Acesse 'Configurações > Conta'",
              "Edite seu nome, apelido ou telefone",
              "Você também pode alterar sua foto de perfil",
              "Toque em 'Salvar Alterações' para confirmar"
            ]}
          />
          <HelpTopic 
            title="Alterar senha" 
            steps={[
              "Acesse 'Configurações > Conta > Alterar Senha'",
              "Digite sua senha atual",
              "Digite e confirme sua nova senha",
              "Toque em 'Atualizar Senha' para confirmar"
            ]}
          />
        </HelpSection>
        
        <HelpSection title="Dicas e Truques">
          <HelpItem 
            title="Atualizar dados" 
            description="Puxe a tela para baixo na maioria das seções para atualizar os dados e obter as informações mais recentes."
          />
          <HelpItem 
            title="Notificações" 
            description="Mantenha as notificações ativadas para receber alertas sobre novas tarefas, eventos e ações pendentes."
          />
          <HelpItem 
            title="Atalhos rápidos" 
            description="Use o botão '+' na tela inicial para acessar rapidamente as ações mais comuns, como criar tarefas ou registrar despesas."
          />
        </HelpSection>
        
        <HelpSection title="Perguntas Frequentes (FAQ)">
          <HelpItem 
            title="Posso usar o app sem criar uma república?" 
            description="Não. O RepHelper foi projetado especificamente para gerenciar repúblicas ou moradias compartilhadas. Você precisa criar ou se juntar a uma república para utilizar as funcionalidades."
          />
          
          <HelpItem 
            title="Como transferir a propriedade da república?" 
            description="Acesse 'Configurações > República > Transferir Propriedade'. Selecione um membro para se tornar o novo proprietário e confirme a transferência. Essa ação não pode ser desfeita."
          />
          
          <HelpItem 
            title="O que acontece quando saio de uma república?" 
            description="Ao sair, você perde acesso a todas as informações da república. Se você tiver pendências financeiras, elas continuarão visíveis para os administradores. Seus dados pessoais permanecem em sua conta."
          />
          
          <HelpItem 
            title="É possível criar mais de uma república?" 
            description="Atualmente, cada usuário pode pertencer a apenas uma república por vez. Para gerenciar outra república, você precisará sair da atual primeiro."
          />
          
          <HelpItem 
            title="Como funcionam as notificações de tarefas?" 
            description="Você receberá notificações quando: 1) For atribuído a uma nova tarefa; 2) Uma tarefa atribuída a você estiver próxima do prazo; 3) Alguém comentar em uma tarefa que você está envolvido."
          />
          
          <HelpItem 
            title="É possível dividir uma despesa de forma desigual?" 
            description="Sim. Ao criar uma despesa, você pode selecionar a opção 'Divisão personalizada' e atribuir valores ou porcentagens diferentes para cada membro da república."
          />
          
          <HelpItem 
            title="Perdi meu celular. Como proteger minha conta?" 
            description="Acesse sua conta em outro dispositivo e altere sua senha imediatamente. Você pode verificar seus dispositivos conectados em 'Configurações > Conta > Segurança > Dispositivos conectados'."
          />
          
          <HelpItem 
            title="Posso ver o histórico de quem completou uma tarefa recorrente?" 
            description="Sim. Nas tarefas recorrentes, toque na opção 'Ver histórico' para visualizar quem completou cada ocorrência da tarefa, quando foi concluída e observações."
          />
          
          <HelpItem 
            title="Como funciona o sistema de controle financeiro?" 
            description="O app registra receitas (entrada de dinheiro) e despesas (saídas). Você pode atribuir categorias, definir quem pagou, como foi a divisão e manter um saldo atualizado da república e individual de cada membro."
          />
          
          <HelpItem 
            title="Posso exportar os dados financeiros?" 
            description="Sim. Em 'Finanças > Menu (três pontos) > Exportar', você pode gerar relatórios em PDF ou Excel com os dados financeiros do período selecionado, útil para prestação de contas."
          />
          
          <HelpItem 
            title="O que são as 'Ações Pendentes' na tela inicial?" 
            description="São notificações de itens que requerem sua atenção: despesas para confirmar pagamento, tarefas com prazo próximo, eventos aguardando confirmação, entre outros."
          />
          
          <HelpItem 
            title="Como adicionar um novo residente que não tem smartphone?" 
            description="Você pode criar um 'Membro Virtual' em 'Configurações > Membros > Adicionar Membro Virtual'. Este perfil será gerenciado pelos administradores da república."
          />
        </HelpSection>
        
        <HelpSection title="Solução de Problemas">
          <HelpTopic 
            title="O aplicativo está lento ou travando" 
            steps={[
              "Feche o aplicativo completamente e abra novamente",
              "Verifique se há atualizações pendentes na loja de aplicativos",
              "Reinicie seu dispositivo",
              "Verifique a conexão com a internet",
              "Se persistir, limpe o cache do aplicativo em Configurações > Aplicativos > RepHelper > Armazenamento > Limpar cache"
            ]}
          />
          
          <HelpTopic 
            title="Não estou recebendo notificações" 
            steps={[
              "Verifique se as notificações estão ativadas no aplicativo em Configurações > Notificações",
              "Verifique as configurações de notificação do seu dispositivo",
              "Certifique-se que o aplicativo não está em modo de economia de bateria",
              "Desinstale e reinstale o aplicativo (isto não afetará seus dados)"
            ]}
          />
          
          <HelpTopic 
            title="Não consigo fazer login" 
            steps={[
              "Verifique sua conexão com a internet",
              "Confirme se está usando o email e senha corretos",
              "Use a opção 'Esqueci minha senha' para redefinir sua senha",
              "Se estiver usando login social (Google, Apple), tente fazer login diretamente pelo provedor",
              "Se o problema persistir, entre em contato com o suporte"
            ]}
          />
          
          <HelpTopic 
            title="Não consigo carregar ou visualizar imagens" 
            steps={[
              "Verifique sua conexão com a internet",
              "Tente atualizar a tela puxando para baixo",
              "Verifique se o armazenamento do seu dispositivo não está cheio",
              "Limpe o cache do aplicativo",
              "Reinicie o aplicativo"
            ]}
          />
          
          <HelpTopic 
            title="Dados desatualizados ou inconsistentes" 
            steps={[
              "Puxe a tela para baixo para atualizar os dados",
              "Vá para a tela inicial e volte para a tela atual",
              "Verifique se todos os membros da república estão usando a versão mais recente do app",
              "Desconecte e conecte novamente (logout e login)",
              "Se o problema persistir, contate o suporte informando detalhes do problema"
            ]}
          />
        </HelpSection>
        
        <View style={styles.supportSection}>
          <Text style={styles.supportTitle}>Precisa de mais ajuda?</Text>
          <TouchableOpacity 
            style={styles.supportButton}
            onPress={openEmailSupport}
          >
            <Ionicons name="mail" size={20} color="#fff" style={styles.supportButtonIcon} />
            <Text style={styles.supportButtonText}>Contatar Suporte</Text>
          </TouchableOpacity>
          
          <Text style={styles.versionInfo}>
            RepHelper v1.0.0
          </Text>
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
  introSection: {
    padding: 20,
    backgroundColor: '#333',
    borderRadius: 12,
    margin: 16,
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#7B68EE',
    marginBottom: 12,
  },
  introText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
  helpSection: {
    backgroundColor: '#333',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  helpSectionHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helpSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  helpSectionContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  helpItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  helpItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7B68EE',
    marginBottom: 8,
  },
  helpItemDescription: {
    color: '#ddd',
    fontSize: 14,
    lineHeight: 20,
  },
  helpTopic: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  helpTopicTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7B68EE',
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  stepNumberContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(123, 104, 238, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumber: {
    color: '#7B68EE',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepText: {
    color: '#ddd',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  supportSection: {
    alignItems: 'center',
    padding: 20,
    marginVertical: 16,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  supportButton: {
    backgroundColor: '#7B68EE',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    minWidth: 200,
  },
  supportButtonIcon: {
    marginRight: 8,
  },
  supportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionInfo: {
    color: '#777',
    fontSize: 14,
    marginTop: 16,
  },
});

export default HelpScreen; 