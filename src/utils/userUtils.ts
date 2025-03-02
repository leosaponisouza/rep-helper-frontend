// src/utils/userUtils.ts
import { User } from '../models/user.model';

/**
 * Retorna o nome de exibição preferido do usuário:
 * - Retorna o apelido se estiver disponível
 * - Caso contrário, retorna o nome completo
 * 
 * @param user O objeto do usuário
 * @param useFirstNameOnly Se true, retorna apenas o primeiro nome quando usando o nome completo
 * @returns O nome de exibição do usuário
 */
export const getDisplayName = (
  user: User | null | undefined, 
  useFirstNameOnly: boolean = false
): string => {
  if (!user) return '';
  
  // Se o usuário tem um apelido, use-o (mas verifique se não está vazio)
  if (user.nickname && user.nickname.trim().length > 0) {
    return user.nickname.trim();
  }
  
  // Caso contrário, use o nome
  if (user.name) {
    if (useFirstNameOnly) {
      // Retorna apenas o primeiro nome
      const firstName = user.name.split(' ')[0];
      return firstName;
    }
    return user.name;
  }
  
  return '';
};

/**
 * Retorna as iniciais do usuário com base no nome de exibição
 * 
 * @param user O objeto do usuário
 * @returns As iniciais baseadas no nome de exibição do usuário
 */
export const getUserInitials = (user: User | null | undefined): string => {
  if (!user) return '';
  
  // Se tiver apelido, use a primeira letra do apelido
  if (user.nickname && user.nickname.trim().length > 0) {
    return user.nickname.trim()[0].toUpperCase();
  }
  
  // Caso contrário, use as iniciais do nome completo
  if (user.name) {
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }
  
  return '';
};