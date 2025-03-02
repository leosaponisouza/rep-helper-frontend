// src/models/user.model.ts

export interface User {
  uid: string;
  name: string;
  nickname?: string | null; // Campo de apelido (opcional)
  email: string;
  phoneNumber?: string | null;
  profile_picture_url?: string | null;
  currentRepublicId?: string | null;
  isAdmin?: boolean;
  createdAt?: string;
  lastLogin?: string;
  status?: 'active' | 'inactive' | 'banned';
  firebaseUid: string;
  provider: 'email' | 'google.com' | 'facebook.com' | 'phone' | 'github.com' | 'custom';
  role?: 'admin' | 'user' | 'resident';
}