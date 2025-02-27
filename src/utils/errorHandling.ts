// src/utils/errorHandler.ts
import { Alert } from 'react-native';
import axios, { AxiosError } from 'axios';

export interface ErrorDetails {
  type: 'network' | 'validation' | 'authentication' | 'server' | 'unknown';
  message: string;
  code?: string | number;
}

export class ErrorHandler {
  // Traduz erros de diferentes fontes para um formato padronizado
  static parseError(error: any): ErrorDetails {
    // Erros do Axios
    if (axios.isAxiosError(error)) {
      return this.handleAxiosError(error);
    }

    // Erros do Firebase Authentication
    if (error.code && error.code.startsWith('auth/')) {
      return this.handleFirebaseAuthError(error);
    }

    // Erros de rede
    if (error.message === 'Network Error') {
      return {
        type: 'network',
        message: 'Sem conexão com a internet. Verifique sua conexão.',
        code: 'NETWORK_ERROR'
      };
    }

    // Erros gerais
    return {
      type: 'unknown',
      message: error.message || 'Ocorreu um erro desconhecido.',
      code: error.code
    };
  }

  // Tratamento específico para erros do Axios
  private static handleAxiosError(error: AxiosError): ErrorDetails {
    // Sem resposta do servidor
    if (!error.response) {
      return {
        type: 'network',
        message: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
        code: 'NETWORK_ERROR'
      };
    }

    // Erros de status específicos
    switch (error.response.status) {
      case 400:
        return {
          type: 'validation',
          message: this.extractErrorMessage(error.response.data) || 'Erro de validação dos dados.',
          code: 400
        };
      case 401:
        return {
          type: 'authentication',
          message: 'Sessão expirada. Faça login novamente.',
          code: 401
        };
      case 403:
        return {
          type: 'authentication',
          message: 'Você não tem permissão para realizar esta ação.',
          code: 403
        };
      case 404:
        return {
          type: 'server',
          message: 'Recurso não encontrado.',
          code: 404
        };
      case 500:
        return {
          type: 'server',
          message: 'Erro interno do servidor. Tente novamente mais tarde.',
          code: 500
        };
      default:
        return {
          type: 'server',
          message: this.extractErrorMessage(error.response.data) || 'Erro desconhecido no servidor.',
          code: error.response.status
        };
    }
  }

  // Tratamento de erros do Firebase Authentication
  private static handleFirebaseAuthError(error: any): ErrorDetails {
    const authErrorMap: { [key: string]: string } = {
      'auth/invalid-email': 'Email inválido.',
      'auth/user-disabled': 'Esta conta foi desativada.',
      'auth/user-not-found': 'Usuário não encontrado.',
      'auth/wrong-password': 'Senha incorreta.',
      'auth/email-already-in-use': 'Este email já está em uso.',
      'auth/weak-password': 'A senha é muito fraca.',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
      'auth/network-request-failed': 'Falha na conexão. Verifique sua internet.'
    };

    return {
      type: 'authentication',
      message: authErrorMap[error.code] || 'Erro de autenticação.',
      code: error.code
    };
  }

  // Extrair mensagem de erro de respostas do servidor
  private static extractErrorMessage(data: any): string | null {
    if (typeof data === 'string') return data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    return null;
  }

  // Método para exibir erro em um alerta
  static showAlert(error: ErrorDetails) {
    Alert.alert(
      this.getAlertTitle(error.type),
      error.message,
      [{ text: 'OK' }]
    );
  }

  // Títulos de alerta baseados no tipo de erro
  private static getAlertTitle(type: ErrorDetails['type']): string {
    const titles = {
      'network': 'Erro de Conexão',
      'validation': 'Erro de Validação',
      'authentication': 'Erro de Autenticação',
      'server': 'Erro do Servidor',
      'unknown': 'Erro Desconhecido'
    };

    return titles[type] || 'Erro';
  }

  // Método de log de erros (pode ser integrado com serviço de logging)
  static logError(error: ErrorDetails) {
    console.error(`[${error.type.toUpperCase()}] ${error.message}`, {
      code: error.code,
      timestamp: new Date().toISOString()
    });
  }

  // Método para lidar completamente com o erro
  static handle(error: any) {
    const parsedError = this.parseError(error);
    
    // Log do erro
    this.logError(parsedError);
    
    // Mostrar alerta ao usuário
    this.showAlert(parsedError);

    return parsedError;
  }
}