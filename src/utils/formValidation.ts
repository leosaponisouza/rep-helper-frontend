interface ValidationRule {
    validate: (value: string) => boolean;
    message: string;
  }
  
  export const validationRules = {
    // Email validation
    email: {
      validate: (value: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value.trim());
      },
      message: 'Por favor, insira um email válido.'
    },
  
    // Password validation
    password: {
      validate: (value: string) => {
        // Pelo menos 6 caracteres, com pelo menos uma letra maiúscula, 
        // uma letra minúscula e um número
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/;
        return passwordRegex.test(value);
      },
      message: 'A senha deve ter no mínimo 6 caracteres, incluindo maiúsculas, minúsculas e números.'
    },
  
    // Nome completo validation
    fullName: {
      validate: (value: string) => {
        // Pelo menos dois nomes, cada um com no mínimo 2 caracteres
        const fullNameRegex = /^[a-zA-ZÀ-ÿ]+ [a-zA-ZÀ-ÿ]+(\s[a-zA-ZÀ-ÿ]+)*$/;
        return fullNameRegex.test(value.trim());
      },
      message: 'Por favor, insira seu nome completo.'
    },
  
    // CEP validation (Brasil)
    zipCode: {
      validate: (value: string) => {
        const zipCodeRegex = /^\d{5}-?\d{3}$/;
        return zipCodeRegex.test(value.trim());
      },
      message: 'Por favor, insira um CEP válido (ex: 12345-678).'
    },
  
    // Telefone validation (Brasil)
    phone: {
      validate: (value: string) => {
        const phoneRegex = /^(\+?55\s?)?(\(?\d{2}\)?[-.\s]?)?\d{4,5}[-.\s]?\d{4}$/;
        return phoneRegex.test(value.trim());
      },
      message: 'Por favor, insira um número de telefone válido.'
    },
  
    // Campo obrigatório
    required: {
      validate: (value: string) => {
        return value.trim().length > 0;
      },
      message: 'Este campo é obrigatório.'
    }
  };
  
  export class FormValidator {
    private errors: { [key: string]: string } = {};
  
    validate(
      values: { [key: string]: string }, 
      rules: { [key: string]: ValidationRule[] }
    ): boolean {
      // Limpar erros anteriores
      this.errors = {};
  
      // Validar cada campo
      Object.keys(rules).forEach(field => {
        const fieldRules = rules[field];
        const value = values[field] || '';
  
        for (const rule of fieldRules) {
          if (!rule.validate(value)) {
            this.errors[field] = rule.message;
            break; // Para no primeiro erro encontrado
          }
        }
      });
  
      // Retorna true se não houver erros
      return Object.keys(this.errors).length === 0;
    }
  
    // Obter todos os erros
    getErrors(): { [key: string]: string } {
      return this.errors;
    }
  
    // Obter erro de um campo específico
    getFieldError(field: string): string | undefined {
      return this.errors[field];
    }
  }