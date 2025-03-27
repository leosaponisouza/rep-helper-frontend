/**
 * @file errorHandling.ts
 * @description Sistema de tratamento de erros unificado para a aplicação
 */

import { Alert, Platform } from 'react-native';
import axios, { AxiosError } from 'axios';
import NetInfo from '@react-native-community/netinfo';

/**
 * Tipos de erros que a aplicação pode tratar
 */
export type ErrorType = 
  | 'network'        // Erros de conexão com a internet
  | 'validation'     // Erros de validação de dados
  | 'authentication' // Erros de autenticação/autorização
  | 'server'         // Erros do servidor
  | 'timeout'        // Erros de timeout
  | 'business'       // Erros de regras de negócio
  | 'permission'     // Erros de permissão
  | 'not_found'      // Recurso não encontrado
  | 'input'          // Erro de entrada do usuário
  | 'unknown';       // Erros desconhecidos

/**
 * Níveis de severidade para log de erros
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Interface para detalhes padronizados de erro
 */
export interface ErrorDetails {
  type: ErrorType;
  message: string;
  code?: string | number;
  severity?: ErrorSeverity;
  timestamp?: string;
  context?: Record<string, any>;
  originalError?: any;
}

/**
 * Opções para personalizar o comportamento do tratamento de erros
 */
export interface ErrorHandlingOptions {
  showAlert?: boolean;
  logError?: boolean;
  severity?: ErrorSeverity;
  context?: Record<string, any>;
}

// Polyfill para DOMException em ambientes que não o suportam nativamente
if (typeof global.DOMException === 'undefined') {
  class DOMExceptionPolyfill extends Error {
    name: string;
    
    constructor(message: string, name?: string) {
      super(message);
      this.name = name || 'Error';
      
      // Corrigir a cadeia de protótipos em ambientes mais antigos
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, DOMExceptionPolyfill);
      }
    }
  }
  
  (global as any).DOMException = DOMExceptionPolyfill;
}

/**
 * Classe responsável pelo tratamento unificado de erros na aplicação
 */
export class ErrorHandler {
  /**
   * Configurações padrão para mensagens de erro por idioma
   */
  private static messages = {
    pt: {
      network: 'Sem conexão com a internet. Verifique sua conexão.',
      timeout: 'A operação demorou muito. Verifique sua conexão e tente novamente.',
      server: 'Erro interno do servidor. Tente novamente mais tarde.',
      authentication: 'Erro de autenticação. Verifique suas credenciais.',
      validation: 'Dados inválidos. Verifique os campos e tente novamente.',
      permission: 'Você não tem permissão para realizar esta ação.',
      not_found: 'Recurso não encontrado.',
      unknown: 'Ocorreu um erro inesperado.',
      business: 'Não foi possível completar a operação.',
      input: 'Verifique os dados informados e tente novamente.'
    },
    en: {
      network: 'No internet connection. Please check your connection.',
      timeout: 'The operation took too long. Check your connection and try again.',
      server: 'Internal server error. Please try again later.',
      authentication: 'Authentication error. Please check your credentials.',
      validation: 'Invalid data. Please check the fields and try again.',
      permission: 'You do not have permission to perform this action.',
      not_found: 'Resource not found.',
      unknown: 'An unexpected error occurred.',
      business: 'Could not complete the operation.',
      input: 'Please check the provided data and try again.'
    }
  };

  /**
   * Idioma atual para mensagens de erro
   */
  private static currentLanguage: 'pt' | 'en' = 'pt';

  /**
   * Define o idioma para as mensagens de erro
   */
  static setLanguage(language: 'pt' | 'en'): void {
    this.currentLanguage = language;
  }

  /**
   * Registra um handler personalizado para um tipo específico de erro
   */
  private static customHandlers: Partial<Record<ErrorType, (error: ErrorDetails) => void>> = {};

  /**
   * Registra um handler personalizado para um tipo específico de erro
   */
  static registerCustomHandler(type: ErrorType, handler: (error: ErrorDetails) => void): void {
    this.customHandlers[type] = handler;
  }

  /**
   * Traduz erros de diferentes fontes para um formato padronizado
   */
  static async parseError(error: any): Promise<ErrorDetails> {
    // Verificar se é um erro já formatado
    if (error && error.type && error.message && 
        Object.keys(this.messages.pt).includes(error.type)) {
      return error as ErrorDetails;
    }

    // Verificar conexão com a internet para erros de rede
    const netInfo = await NetInfo.fetch();
    const isConnected = netInfo.isConnected;

    // Erro de timeout/abort
    if (error.name === 'AbortError' || error.name === 'TimeoutError' || 
        (error instanceof DOMException && error.name === 'AbortError')) {
      return {
        type: 'timeout',
        message: this.messages[this.currentLanguage].timeout,
        code: 'TIMEOUT',
        severity: 'warning',
        timestamp: new Date().toISOString(),
        originalError: error
      };
    }
    
    // Erros do Axios
    if (axios.isAxiosError(error)) {
      return this.handleAxiosError(error, isConnected);
    }

    // Erros do Firebase Authentication
    if (error.code && typeof error.code === 'string' && error.code.startsWith('auth/')) {
      return this.handleFirebaseAuthError(error);
    }

    // Erros de rede
    if (!isConnected || error.message === 'Network Error' || 
        (typeof error.message === 'string' && error.message.toLowerCase().includes('network'))) {
      return {
        type: 'network',
        message: this.messages[this.currentLanguage].network,
        code: 'NETWORK_ERROR',
        severity: 'warning',
        timestamp: new Date().toISOString(),
        originalError: error
      };
    }

    // Erros gerais
    return {
      type: 'unknown',
      message: error.message || this.messages[this.currentLanguage].unknown,
      code: error.code || 'UNKNOWN_ERROR',
      severity: 'error',
      timestamp: new Date().toISOString(),
      originalError: error
    };
  }

  /**
   * Tratamento específico para erros do Axios
   */
  private static handleAxiosError(error: AxiosError, isConnected: boolean | null): ErrorDetails {
    // Erro de timeout
    if (error.code === 'ECONNABORTED') {
      return {
        type: 'timeout',
        message: this.messages[this.currentLanguage].timeout,
        code: 'TIMEOUT',
        severity: 'warning',
        timestamp: new Date().toISOString(),
        originalError: error
      };
    }
    
    // Erro de rede (sem resposta do servidor)
    if (!error.response) {
      return {
        type: !isConnected ? 'network' : 'server',
        message: !isConnected 
          ? this.messages[this.currentLanguage].network 
          : 'Não foi possível conectar ao servidor. Tente novamente mais tarde.',
        code: !isConnected ? 'NETWORK_ERROR' : 'SERVER_UNREACHABLE',
        severity: 'warning',
        timestamp: new Date().toISOString(),
        originalError: error
      };
    }

    // Erros de status específicos
    switch (error.response.status) {
      case 400:
        return {
          type: 'validation',
          message: this.extractErrorMessage(error.response.data) || 
                  'Dados inválidos. Verifique os campos e tente novamente.',
          code: 400,
          severity: 'warning',
          timestamp: new Date().toISOString(),
          originalError: error
        };
      case 401:
        return {
          type: 'authentication',
          message: 'Sessão expirada. Faça login novamente.',
          code: 401,
          severity: 'warning',
          timestamp: new Date().toISOString(),
          originalError: error
        };
      case 403:
        return {
          type: 'permission',
          message: 'Você não tem permissão para realizar esta ação.',
          code: 403,
          severity: 'warning',
          timestamp: new Date().toISOString(),
          originalError: error
        };
      case 404:
        return {
          type: 'not_found',
          message: 'Recurso não encontrado.',
          code: 404,
          severity: 'warning',
          timestamp: new Date().toISOString(),
          originalError: error
        };
      case 422:
        return {
          type: 'validation',
          message: this.extractErrorMessage(error.response.data) || 
                  'Erro de validação dos dados.',
          code: 422,
          severity: 'warning',
          timestamp: new Date().toISOString(),
          originalError: error
        };
      case 429:
        return {
          type: 'server',
          message: 'Muitas requisições. Aguarde um momento e tente novamente.',
          code: 429,
          severity: 'warning',
          timestamp: new Date().toISOString(),
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
          severity: 'error',
          timestamp: new Date().toISOString(),
          originalError: error
        };
      default:
        return {
          type: 'server',
          message: this.extractErrorMessage(error.response.data) || 
                  'Erro desconhecido no servidor.',
          code: error.response.status,
          severity: 'error',
          timestamp: new Date().toISOString(),
          originalError: error
        };
    }
  }

  /**
   * Tratamento de erros do Firebase Authentication
   */
  private static handleFirebaseAuthError(error: any): ErrorDetails {
    const authErrorMap: { [key: string]: string } = {
      'auth/invalid-email': 'Email inválido.',
      'auth/user-disabled': 'Esta conta foi desativada.',
      'auth/user-not-found': 'Usuário não encontrado.',
      'auth/wrong-password': 'Senha incorreta.',
      'auth/invalid-credential': 'Email ou senha incorretos.',
      'auth/email-already-in-use': 'Este email já está em uso.',
      'auth/weak-password': 'A senha é muito fraca.',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
      'auth/network-request-failed': 'Falha na conexão. Verifique sua internet.',
      'auth/requires-recent-login': 'Esta operação requer uma autenticação recente. Faça login novamente.',
      'auth/popup-closed-by-user': 'Login cancelado. Tente novamente.',
      'auth/cancelled-popup-request': 'Processo de login cancelado.',
      'auth/operation-not-allowed': 'Operação não permitida.',
      'auth/account-exists-with-different-credential': 'Uma conta já existe com o mesmo email, mas credenciais diferentes.',
      'auth/invalid-verification-code': 'Código de verificação inválido.',
      'auth/invalid-verification-id': 'ID de verificação inválido.',
      'auth/missing-verification-code': 'Código de verificação não informado.',
      'auth/missing-verification-id': 'ID de verificação não informado.',
      'auth/quota-exceeded': 'Cota excedida. Tente novamente mais tarde.',
      'auth/captcha-check-failed': 'Verificação de CAPTCHA falhou. Tente novamente.',
      'auth/missing-phone-number': 'Número de telefone não informado.',
      'auth/invalid-phone-number': 'Número de telefone inválido.',
      'auth/provider-already-linked': 'Conta já vinculada a este provedor.',
      'auth/credential-already-in-use': 'Esta credencial já está em uso por outra conta.'
    };

    return {
      type: 'authentication',
      message: authErrorMap[error.code] || 'Erro de autenticação.',
      code: error.code,
      severity: 'warning',
      timestamp: new Date().toISOString(),
      originalError: error
    };
  }

  /**
   * Extrair mensagem de erro de respostas do servidor
   */
  private static extractErrorMessage(data: any): string | null {
    if (!data) return null;
    
    if (typeof data === 'string') return data;
    
    // Verificar mensagens em diferentes estruturas de resposta
    if (data.message) return data.message;
    if (data.error?.message) return data.error.message;
    if (data.error) return typeof data.error === 'string' ? data.error : null;
    
    if (data.errors) {
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        return data.errors[0].message || JSON.stringify(data.errors[0]);
      }
      
      if (typeof data.errors === 'object') {
        const firstKey = Object.keys(data.errors)[0];
        if (firstKey && data.errors[firstKey]) {
          return Array.isArray(data.errors[firstKey]) 
            ? data.errors[firstKey][0] 
            : data.errors[firstKey];
        }
      }
    }
    
    return null;
  }

  /**
   * Método para exibir erro em um alerta
   */
  static showAlert(error: ErrorDetails, options?: { title?: string, buttonText?: string }): void {
    Alert.alert(
      options?.title || this.getAlertTitle(error.type),
      error.message,
      [{ text: options?.buttonText || 'OK' }]
    );
  }

  /**
   * Títulos de alerta baseados no tipo de erro
   */
  private static getAlertTitle(type: ErrorType): string {
    const titles = {
      pt: {
        'network': 'Erro de Conexão',
        'validation': 'Erro de Validação',
        'authentication': 'Erro de Autenticação',
        'server': 'Erro do Servidor',
        'timeout': 'Tempo Esgotado',
        'business': 'Erro de Operação',
        'permission': 'Erro de Permissão',
        'not_found': 'Não Encontrado',
        'input': 'Dados Inválidos',
        'unknown': 'Erro Inesperado'
      },
      en: {
        'network': 'Connection Error',
        'validation': 'Validation Error',
        'authentication': 'Authentication Error',
        'server': 'Server Error',
        'timeout': 'Timeout',
        'business': 'Operation Error',
        'permission': 'Permission Error',
        'not_found': 'Not Found',
        'input': 'Invalid Data',
        'unknown': 'Unexpected Error'
      }
    };

    return titles[this.currentLanguage][type] || 'Erro';
  }

  /**
   * Método de log de erros (pode ser integrado com serviço de logging)
   */
  static logError(error: ErrorDetails): void {
    // Em ambiente de produção, não exibimos logs no console
    if (__DEV__) {
      const logPrefix = `[${error.severity?.toUpperCase() || 'ERROR'}] [${error.type.toUpperCase()}]`;
      const logData = {
        code: error.code,
        timestamp: error.timestamp || new Date().toISOString(),
        context: error.context || {},
        platform: Platform.OS,
        appVersion: Platform.Version,
        originalError: error.originalError
      };
      
      // Log no console apenas para desenvolvimento
      console.error(`${logPrefix} ${error.message}`, logData);
    }
    
    // Aqui você poderia enviar o erro para um serviço de monitoramento
    // como Sentry, Firebase Crashlytics, etc.
    // 
    // Exemplo com Sentry:
    // if (Sentry) {
    //   Sentry.captureException(error.originalError || new Error(error.message), {
    //     level: error.severity === 'critical' ? 'fatal' : error.severity,
    //     tags: {
    //       type: error.type,
    //       code: error.code
    //     },
    //     extra: logData
    //   });
    // }
  }

  /**
   * Método para lidar completamente com o erro
   */
  static async handle(error: any, options?: ErrorHandlingOptions): Promise<ErrorDetails> {
    const parsedError = await this.parseError(error);
    
    // Adicionar contexto adicional se fornecido
    if (options?.context) {
      parsedError.context = {
        ...parsedError.context,
        ...options.context
      };
    }
    
    // Definir severidade personalizada se fornecida
    if (options?.severity) {
      parsedError.severity = options.severity;
    }
    
    // Log do erro (a menos que explicitamente desativado)
    if (options?.logError !== false) {
      this.logError(parsedError);
    }
    
    // Verificar se há um handler personalizado para este tipo de erro
    const customHandler = this.customHandlers[parsedError.type];
    if (customHandler) {
      customHandler(parsedError);
    } else if (options?.showAlert !== false) {
      // Mostrar alerta ao usuário (a menos que explicitamente desativado)
      this.showAlert(parsedError);
    }

    return parsedError;
  }

  /**
   * Cria um erro de negócio com uma mensagem personalizada
   */
  static createBusinessError(message: string, code?: string): ErrorDetails {
    return {
      type: 'business',
      message,
      code: code || 'BUSINESS_ERROR',
      severity: 'warning',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cria um erro de validação com uma mensagem personalizada
   */
  static createValidationError(message: string, code?: string): ErrorDetails {
    return {
      type: 'validation',
      message,
      code: code || 'VALIDATION_ERROR',
      severity: 'warning',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cria um erro de entrada do usuário com uma mensagem personalizada
   */
  static createInputError(message: string, code?: string): ErrorDetails {
    return {
      type: 'input',
      message,
      code: code || 'INPUT_ERROR',
      severity: 'info',
      timestamp: new Date().toISOString()
    };
  }
}