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
  
  // Fallback para .env se nenhum arquivo for encontrado
  console.warn('No .env file found. Using process.env only.');
  return path.resolve(process.cwd(), '.env');
};

// Carrega variáveis de ambiente do arquivo apropriado
const loadEnv = () => {
  const envPath = getEnvPath();
  const envConfig = dotenv.config({ path: envPath });
  
  if (envConfig.error) {
    console.warn('Error loading .env file:', envConfig.error);
  }
  
  // Retorna as variáveis de ambiente
  return envConfig.parsed || {};
};

// Exporta as variáveis de ambiente carregadas
module.exports = loadEnv();