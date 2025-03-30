// env.js
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Determina qual arquivo .env usar baseado na variável de ambiente
const getEnvPath = () => {
  const environment = process.env.EXPO_PUBLIC_ENV || 'development';
  
  // Tenta carregar .env.{environment}.local primeiro, depois .env.{environment}, depois .env.local, depois .env
  const envPaths = [
    `.env.${environment}.local`,
    `.env.${environment}`,
    '.env.local',
    '.env',
  ];
  
  for (const envPath of envPaths) {
    const fullPath = path.resolve(process.cwd(), envPath);
    if (fs.existsSync(fullPath)) {
      console.log(`Using environment variables from ${envPath}`);
      return fullPath;
    }
  }
  
  // Fallback se nenhum arquivo for encontrado
  console.warn('No .env file found. Using process.env only.');
  return null;
};

// Logging para ajudar no debugging, mas sem expor os valores
const logEnvStatus = (env) => {
  const keys = Object.keys(env);
  if (keys.length === 0) {
    console.warn('Aviso: Nenhuma variável de ambiente encontrada!');
    return;
  }
  
  console.log(`Variáveis de ambiente carregadas: ${keys.length} disponíveis`);
  keys.forEach(key => {
    const value = env[key];
    // Apenas indicamos se temos ou não um valor, sem mostrar o valor real
    console.log(`- ${key}: ${value ? '✓ (Definido)' : '✗ (Não definido)'}`);
  });
};

// Carrega variáveis de ambiente do arquivo apropriado
const loadEnv = () => {
  const envPath = getEnvPath();
  let envConfig = { parsed: {} };
  
  if (envPath) {
    try {
      envConfig = dotenv.config({ path: envPath });
      if (envConfig.error) {
        console.warn('Error loading .env file:', envConfig.error);
        envConfig = { parsed: {} };
      }
    } catch (error) {
      console.warn('Error loading .env file:', error);
      envConfig = { parsed: {} };
    }
  }
  
  // Mesclar com process.env, dando prioridade para o process.env
  const mergedEnv = { ...envConfig.parsed, ...process.env };
  
  // Logging sem expor os valores
  logEnvStatus(mergedEnv);
  
  return mergedEnv;
};

// Exporta as variáveis de ambiente carregadas
module.exports = loadEnv();