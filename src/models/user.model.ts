// src/models/user.model.ts (Frontend - React Native)

//  Interface que representa os dados do USUÁRIO *NO FRONTEND*.
//  Ela DEVE ser compatível com o que o backend retorna.
export interface User {
    uid: string; // Não mais opcional, pois após o login SEMPRE teremos um UID.
    name: string;
    email: string;
    phoneNumber?: string | null; // Opcional
    profile_picture_url?: string | null; // Opcional
    currentRepublicId?: string | null; // Opcional (pode não ter república ainda)
    isAdmin?: boolean;
    createdAt?: string; // Pode ser string, se você estiver recebendo a data como string do backend.
    lastLogin?: string;  // Pode ser string
    status?: 'active' | 'inactive' | 'banned';
    firebaseUid: string; // Não opcional após o login
    provider: 'email' | 'google.com' | 'facebook.com' | 'phone' | 'github.com' | 'custom';
    // password?: string;  <-- REMOVA!  A senha NUNCA deve ir para o frontend.
    role?: 'admin' | 'user' | 'resident'; // Enum inline
  }