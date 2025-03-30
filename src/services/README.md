# Serviços de API - RepHelper

Este diretório contém implementações dos serviços para interagir com a API do backend RepHelper.

## Serviço de Autenticação

O arquivo `authService.ts` implementa o fluxo de autenticação conforme a [documentação de referência](https://api.rephelper.com/docs) da API RepHelper. 

### Fluxo de Autenticação

O sistema utiliza autenticação em duas etapas:

1. Autenticação inicial via Firebase
2. Uso de tokens JWT para acesso contínuo à API

### Base URL

```
https://api.rephelper.com/api/v1
```

### Autenticação em Requisições

Após o login bem-sucedido, todas as requisições subsequentes incluem o token JWT no header de Authorization:

```
Authorization: Bearer {token}
```

### Validade do Token

O token JWT tem validade de 7 dias (604.800.000 milissegundos). Após este período, é necessário renovar o token usando o endpoint `/auth/refresh` ou fazer login novamente.

## Exemplo de Uso

### Login com Email e Senha

```tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { styles } from './styles';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loginWithCredentials, loading, error, clearError } = useAuth();

  const handleLogin = async () => {
    try {
      await loginWithCredentials(email, password);
      // Navegação realizada automaticamente no AuthContext
    } catch (err) {
      Alert.alert('Erro de Login', 'Não foi possível fazer login. Verifique suas credenciais.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        onFocus={clearError}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        onFocus={clearError}
      />
      
      <Button
        title={loading ? "Carregando..." : "Entrar"}
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  );
};
```

### Cadastro de Novo Usuário

```tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { styles } from './styles';

export const SignUpScreen = () => {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const { signUp, loading, error, clearError } = useAuth();

  const handleSignUp = async () => {
    try {
      await signUp(email, password, {
        name,
        nickname: nickname || null,
        phoneNumber
      });
      // Navegação realizada automaticamente no AuthContext
    } catch (err) {
      Alert.alert('Erro no Cadastro', 'Não foi possível completar o cadastro.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastro</Text>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      <TextInput
        style={styles.input}
        placeholder="Nome Completo"
        value={name}
        onChangeText={setName}
        onFocus={clearError}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Apelido (opcional)"
        value={nickname}
        onChangeText={setNickname}
        onFocus={clearError}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        onFocus={clearError}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        onFocus={clearError}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Telefone (opcional)"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        onFocus={clearError}
      />
      
      <Button
        title={loading ? "Processando..." : "Cadastrar"}
        onPress={handleSignUp}
        disabled={loading || !name || !email || !password}
      />
    </View>
  );
};
```

### Logout

```tsx
import React from 'react';
import { View, Button, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { styles } from './styles';

export const ProfileScreen = () => {
  const { user, logout, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Navegação realizada automaticamente no AuthContext
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      
      {user && (
        <>
          <Text style={styles.text}>Nome: {user.name}</Text>
          {user.nickname && <Text style={styles.text}>Apelido: {user.nickname}</Text>}
          <Text style={styles.text}>Email: {user.email}</Text>
        </>
      )}
      
      <Button
        title={loading ? "Saindo..." : "Sair"}
        onPress={handleLogout}
        disabled={loading}
      />
    </View>
  );
};
```

## Tratamento de Erros e Tokens Expirados

O serviço implementa renovação automática de tokens quando necessário através dos interceptors no arquivo `api.ts`. Se um token estiver expirado, o sistema tentará renovar automaticamente antes de redirecionar o usuário para a tela de login.

Para dúvidas ou suporte, entre em contato com a equipe de desenvolvimento. 