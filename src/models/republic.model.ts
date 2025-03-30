import { User } from './user.model';

/**
 * Endereço da república
 */
export interface RepublicAddress {
  id?: number;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

/**
 * Membro da república
 */
export interface RepublicMember {
  id: string;
  name: string;
  nickname?: string | null;
  profilePictureUrl?: string | null;
  email: string;
  phoneNumber?: string | null;
  isAdmin: boolean;
  isOwner: boolean;
  joinedAt: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'BANNED';
}

/**
 * República
 */
export interface Republic {
  id: string;
  name: string;
  code: string;
  address: RepublicAddress;
  ownerId: string;
  ownerName: string;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Resposta da API para a criação de república
 */
export interface CreateRepublicResponse {
  republic: Republic;
  message?: string;
}

/**
 * Requisição para criação de república
 */
export interface CreateRepublicRequest {
  name: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  owner_id?: string;
}

/**
 * Requisição para atualizar uma república
 */
export interface UpdateRepublicRequest {
  name?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

/**
 * Requisição para entrar em uma república
 */
export interface JoinRepublicRequest {
  code: string;
}

/**
 * Resposta da API para entrar em uma república
 */
export interface JoinRepublicResponse {
  token: string;
  user: User;
  republic: Republic;
  message?: string;
}

/**
 * Resposta com um novo código de república
 */
export interface RegenerateCodeResponse {
  code: string;
  message?: string;
} 