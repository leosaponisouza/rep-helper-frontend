// src/utils/errorHandler.ts
import { Alert } from 'react-native';
import axios, { AxiosError } from 'axios';

export interface ErrorDetails {
  type: 'network' | 'validation' | 'authentication' | 'server' | 'timeout' | 'unknown';
  message: string;
  code?: string | number;
  originalError?: any;
}

export class ErrorHandler {
  // Traduz erros de diferentes fontes para um formato padronizado
  static parseError(error: any): ErrorDetails {
    // Erro de timeout/abort
    if (error.name === 'AbortError' || error.name === 'TimeoutError' || (error instanceof DOMException && error.name === 'AbortError')) {
      return {
        type: 'timeout',
        message: 'A operação demorou muito. Verifique sua conexão e tente novamente.',
        code: 'TIMEOUT',
        originalError: error
      };
    }
    
    // Erros do Axios
    if (axios.isAxiosError(error)) {
      return this.handleAxiosError(error);
    }

    // Erros do Firebase Authentication
    if (error.code && error.code.startsWith('auth/')) {
      return this.handleFirebaseAuthError(error);
    }

    // Erros de rede
    if (error.message === 'Network Error' || error.message?.includes('network')) {
      return {
        type: 'network',
        message: 'Sem conexão com a internet. Verifique sua conexão.',
        code: 'NETWORK_ERROR',
        originalError: error
      };
    }

    // Erros gerais
    return {
      type: 'unknown',
      message: error.message || 'Ocorreu um erro desconhecido.',
      code: error.code,
      originalError: error
    };
  }

  // Tratamento específico para erros do Axios
  private static handleAxiosError(error: AxiosError): ErrorDetails {
    // Erro de timeout
    if (error.code === 'ECONNABORTED') {
      return {
        type: 'timeout',
        message: 'A conexão expirou. Verifique sua internet e tente novamente.',
        code: 'TIMEOUT',
        originalError: error
      };
    }
    
    // Erro de rede (sem resposta do servidor)
    if (!error.response) {
      return {
        type: 'network',
        message: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
        code: 'NETWORK_ERROR',
        originalError: error
      };
    }

    // Erros de status específicos
    switch (error.response.status) {
      case 400:
        return {
          type: 'validation',
          message: this.extractErrorMessage(error.response.data) || 'Dados inválidos. Verifique os campos e tente novamente.',
          code: 400,
          originalError: error
        };
      case 401:
        return {
          type: 'authentication',
          message: 'Sessão expirada. Faça login novamente.',
          code: 401,
          originalError: error
        };
      case 403:
        return {
          type: 'authentication',
          message: 'Você não tem permissão para realizar esta ação.',
          code: 403,
          originalError: error
        };
      case 404:
        return {
          type: 'server',
          message: 'Recurso não encontrado.',
          code: 404,
          originalError: error
        };
      case 422:
        return {
          type: 'validation',
          message: this.extractErrorMessage(error.response.data) || 'Erro de validação dos dados.',
          code: 422,
          originalError: error
        };
      case 429:
        return {
          type: 'server',
          message: 'Muitas requisições. Aguarde um momento e tente novamente.',
          code: 429,
          originalError: error
        };
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: 'server',
          message: 'Erro interno do servidor. Tente novamente mais tarde.',
          code: error.response.status,
          originalError: error
        };
      default:
        return {
          type: 'server',
          message: this.extractErrorMessage(error.response.data) || 'Erro desconhecido no servidor.',
          code: error.response.status,
          originalError: error
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
      'auth/network-request-failed': 'Falha na conexão. Verifique sua internet.',
      'auth/requires-recent-login': 'Esta operação requer uma autenticação recente. Faça login novamente.',
      'auth/popup-closed-by-user': 'Login cancelado. Tente novamente.',
      'auth/cancelled-popup-request': 'Processo de login cancelado.',
      'auth/invalid-credential': 'Credencial inválida. Verifique seus dados e tente novamente.',
      'auth/operation-not-allowed': 'Operação não permitida.',
      'auth/account-exists-with-different-credential': 'Uma conta já existe com o mesmo email, mas credenciais diferentes.'
    };

    return {
      type: 'authentication',
      message: authErrorMap[error.code] || 'Erro de autenticação.',
      code: error.code,
      originalError: error
    };
  }

  // Extrair mensagem de erro de respostas do servidor
  private static extractErrorMessage(data: any): string | null {
    if (typeof data === 'string') return data;
    
    // Verificar mensagens em diferentes estruturas de resposta
    if (data?.message) return data.message;
    if (data?.error?.message) return data.error.message;
    if (data?.error) return typeof data.error === 'string' ? data.error : null;
    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors[0].message || JSON.stringify(data.errors[0]);
    }
    
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
      'timeout': 'Tempo Esgotado',
      'unknown': 'Erro Inesperado'
    };

    return titles[type] || 'Erro';
  }

  // Método de log de erros (pode ser integrado com serviço de logging)
  static logError(error: ErrorDetails) {
    console.error(`[${error.type.toUpperCase()}] [${error.code}] ${error.message}`, {
      timestamp: new Date().toISOString(),
      details: error.originalError
    });
    
    // Aqui você poderia enviar o erro para um serviço de monitoramento
    // como Sentry, Firebase Crashlytics, etc.
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